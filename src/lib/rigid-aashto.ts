/**
 * Rigid pavement design — AASHTO 1993 (slab thickness from the rigid equation).
 *
 *   log10(W18) = ZR·S0 + 7.35·log10(D+1) − 0.06
 *      + log10(ΔPSI/(4.5−1.5)) / (1 + 1.624e7/(D+1)^8.46)
 *      + (4.22 − 0.32·pt)·log10{ [Sc'·Cd·(D^0.75 − 1.132)]
 *                                 / [215.63·J·(D^0.75 − 18.42/(Ec/k)^0.25)] }
 * with D in inches, Sc' and Ec in psi, k in pci. Solved for D by bisection.
 * (AASHTO Guide for Design of Pavement Structures, 1993, Part II.)
 */
import { zFromReliability } from './constants'
import { bisection, inToMm, MPA_PER_M_TO_PCI, mpaToPsi, round, roundUpTo } from './units'
import type { DesignResult, PavementLayer } from './types'

/** Predicted log10(W18) for a trial slab thickness D (inches). */
export function aashtoRigidPredLogW18(
  Din: number,
  zr: number,
  s0: number,
  deltaPSI: number,
  pt: number,
  scPsi: number,
  cd: number,
  j: number,
  ecPsi: number,
  kPci: number,
): number {
  const t1 = zr * s0 + 7.35 * Math.log10(Din + 1) - 0.06
  const t2 = Math.log10(deltaPSI / 3.0) / (1 + 1.624e7 / Math.pow(Din + 1, 8.46))
  const numerator = scPsi * cd * (Math.pow(Din, 0.75) - 1.132)
  const denominator = 215.63 * j * (Math.pow(Din, 0.75) - 18.42 / Math.pow(ecPsi / kPci, 0.25))
  const t3 = (4.22 - 0.32 * pt) * Math.log10(numerator / denominator)
  return t1 + t2 + t3
}

export interface AashtoRigidInput {
  w18: number
  reliabilityPct: number
  s0: number
  /** Initial serviceability (default 4.5 for rigid). */
  p0?: number
  /** Terminal serviceability pt (e.g. 2.5 major roads, 2.0 minor). */
  pt: number
  /** 28/90-day flexural strength (modulus of rupture) Sc' (MPa). */
  modulusRuptureMPa: number
  /** Concrete elastic modulus Ec (MPa). */
  concreteEcMPa: number
  /** Effective modulus of subgrade reaction k (MPa/m). */
  kMPaPerM: number
  /** Load transfer coefficient J (2.7–4.2). */
  loadTransferJ: number
  /** Drainage coefficient Cd (0.80–1.20). */
  drainageCd: number
}

/** Required slab thickness D (mm) and design envelope for AASHTO 1993 rigid. */
export function aashtoRigidDesign(inp: AashtoRigidInput): DesignResult {
  const p0 = inp.p0 ?? 4.5
  const deltaPSI = p0 - inp.pt
  const zr = zFromReliability(inp.reliabilityPct)
  const scPsi = mpaToPsi(inp.modulusRuptureMPa)
  const ecPsi = mpaToPsi(inp.concreteEcMPa)
  const kPci = inp.kMPaPerM * MPA_PER_M_TO_PCI
  const target = Math.log10(inp.w18)

  const dIn = bisection(
    (D) => aashtoRigidPredLogW18(D, zr, s0Safe(inp.s0), deltaPSI, inp.pt, scPsi, cd(inp.drainageCd), inp.loadTransferJ, ecPsi, kPci) - target,
    4,
    24,
  )
  const dMm = roundUpTo(inToMm(dIn), 5)

  const layers: PavementLayer[] = [
    { role: 'PQC slab', material: `PCC (MR ${round(inp.modulusRuptureMPa, 2)} MPa)`, thickness: dMm, modulus: inp.concreteEcMPa },
    { role: 'Subgrade / foundation', material: `k = ${round(inp.kMPaPerM)} MPa/m`, thickness: 0 },
  ]

  return {
    method: 'AASHTO 1993 (Rigid)',
    ok: true,
    sectionLabel: `${dMm} mm PQC slab`,
    layers,
    totalThickness: dMm,
    checks: [
      { label: 'Slab thickness D', value: dMm, unit: 'mm', status: 'pass' },
    ],
    summary: {
      'Slab thickness (mm)': dMm,
      'Slab thickness (in)': round(dIn, 2),
      'ZR': round(zr, 3),
      'ΔPSI': round(deltaPSI, 2),
      'k (pci)': round(kPci, 1),
    },
    citations: [{ code: 'AASHTO 1993', clause: 'Part II — Rigid Pavement Design' }],
    warnings: [],
  }
}

function s0Safe(s0: number): number {
  return s0 > 0 ? s0 : 0.35
}
function cd(v: number): number {
  return v > 0 ? v : 1.0
}
