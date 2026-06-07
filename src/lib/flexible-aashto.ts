/**
 * Flexible pavement design — AASHTO 1993 (Structural Number method).
 *
 * Design equation (AASHTO Guide for Design of Pavement Structures, 1993):
 *   log10(W18) = ZR·S0 + 9.36·log10(SN+1) − 0.20
 *              + log10(ΔPSI/(4.2−1.5)) / (0.40 + 1094/(SN+1)^5.19)
 *              + 2.32·log10(MR) − 8.07
 * with W18 in ESALs and MR in psi. Solved for SN by bisection, then layer
 * thicknesses are designed by the layered (staged) method.
 */
import { zFromReliability } from './constants'
import { bisection, inToMm, mmToIn, mpaToPsi, round, roundUpTo } from './units'
import type { DesignResult, PavementLayer } from './types'

/** Predicted log10(W18) for a trial structural number SN. */
export function aashtoFlexiblePredLogW18(
  SN: number,
  zr: number,
  s0: number,
  deltaPSI: number,
  mrPsi: number,
): number {
  return (
    zr * s0 +
    9.36 * Math.log10(SN + 1) -
    0.2 +
    Math.log10(deltaPSI / 2.7) / (0.4 + 1094 / Math.pow(SN + 1, 5.19)) +
    2.32 * Math.log10(mrPsi) -
    8.07
  )
}

/** Required structural number SN for a given support modulus MR (psi). */
export function aashtoRequiredSN(
  w18: number,
  reliabilityPct: number,
  s0: number,
  deltaPSI: number,
  mrPsi: number,
): number {
  const zr = zFromReliability(reliabilityPct)
  const target = Math.log10(w18)
  return bisection(
    (SN) => aashtoFlexiblePredLogW18(SN, zr, s0, deltaPSI, mrPsi) - target,
    0.01,
    20,
  )
}

export interface AashtoFlexibleInput {
  w18: number
  reliabilityPct: number
  s0: number
  /** Design serviceability loss ΔPSI = p0 − pt (e.g. 4.2 − 2.5 = 1.7). */
  deltaPSI: number
  subgradeMrMPa: number
  baseMrMPa?: number
  subbaseMrMPa?: number
  a1: number
  a2: number
  a3: number
  m2?: number
  m3?: number
  minSurfaceMm?: number
  minBaseMm?: number
  minSubbaseMm?: number
}

interface LayerDesign {
  mm: number
  sn: number
}

function designLayer(
  reqSNAbove: number,
  snBelow: number,
  coeff: number,
  m: number,
  minMm: number,
): LayerDesign {
  const neededIn = Math.max(mmToIn(minMm), (reqSNAbove - snBelow) / (coeff * m))
  const mm = roundUpTo(inToMm(Math.max(0, neededIn)), 5)
  const sn = coeff * m * mmToIn(mm)
  return { mm, sn }
}

/** Full AASHTO 1993 flexible design: required SN + layered thickness solution. */
export function aashtoFlexibleDesign(inp: AashtoFlexibleInput): DesignResult {
  const m2 = inp.m2 ?? 1
  const m3 = inp.m3 ?? 1
  const baseMr = inp.baseMrMPa ?? 300
  const subbaseMr = inp.subbaseMrMPa ?? 150
  const minSurf = inp.minSurfaceMm ?? 50
  const minBase = inp.minBaseMm ?? 150
  const minSub = inp.minSubbaseMm ?? 150

  const snTotal = aashtoRequiredSN(inp.w18, inp.reliabilityPct, inp.s0, inp.deltaPSI, mpaToPsi(inp.subgradeMrMPa))
  const snOverSubbase = aashtoRequiredSN(inp.w18, inp.reliabilityPct, inp.s0, inp.deltaPSI, mpaToPsi(subbaseMr))
  const snOverBase = aashtoRequiredSN(inp.w18, inp.reliabilityPct, inp.s0, inp.deltaPSI, mpaToPsi(baseMr))

  const l1 = designLayer(snOverBase, 0, inp.a1, 1, minSurf)
  const l2 = designLayer(snOverSubbase, l1.sn, inp.a2, m2, minBase)
  const l3 = designLayer(snTotal, l1.sn + l2.sn, inp.a3, m3, minSub)
  const snProvided = l1.sn + l2.sn + l3.sn
  const ok = snProvided >= snTotal - 1e-6

  const layers: PavementLayer[] = [
    { role: 'Surface (AC)', material: 'Asphalt concrete', thickness: l1.mm, note: `a₁=${inp.a1}` },
    { role: 'Base', material: 'Granular / treated base', thickness: l2.mm, modulus: baseMr, note: `a₂=${inp.a2}, m₂=${m2}` },
    { role: 'Sub-base', material: 'Granular sub-base', thickness: l3.mm, modulus: subbaseMr, note: `a₃=${inp.a3}, m₃=${m3}` },
    { role: 'Subgrade', material: `MR = ${round(inp.subgradeMrMPa)} MPa`, thickness: 0 },
  ]

  return {
    method: 'AASHTO 1993 (Flexible)',
    ok,
    sectionLabel: `${l1.mm} / ${l2.mm} / ${l3.mm} mm (AC/Base/Sub-base)`,
    layers,
    totalThickness: l1.mm + l2.mm + l3.mm,
    checks: [
      {
        label: 'Provided SN ≥ Required SN',
        value: round(snProvided, 2),
        limit: round(snTotal, 2),
        unit: '',
        status: ok ? 'pass' : 'fail',
      },
    ],
    summary: {
      'Required SN': round(snTotal, 2),
      'Provided SN': round(snProvided, 2),
      'ZR': round(zFromReliability(inp.reliabilityPct), 3),
      'ΔPSI': inp.deltaPSI,
      'Total thickness (mm)': l1.mm + l2.mm + l3.mm,
    },
    citations: [{ code: 'AASHTO 1993', clause: 'Part II — Flexible Pavement Design' }],
    warnings: ok ? [] : ['Provided structural number is below the required value — increase layer thicknesses.'],
  }
}
