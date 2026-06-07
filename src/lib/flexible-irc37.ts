/**
 * Flexible pavement — IRC:37-2018 mechanistic-empirical verification.
 *
 * IRC:37-2018 designs are produced with layered-elastic analysis (IITPAVE) and
 * checked against two performance criteria. This module implements those exact
 * criteria: the bituminous-layer fatigue life Nf and the subgrade rutting life
 * Nr, plus the cumulative-damage (utilisation) check against the design traffic.
 *
 * The critical strains εt (tensile, bottom of bituminous layer) and εv (vertical,
 * top of subgrade) come from a layered-elastic solver such as IITPAVE; they are
 * supplied as inputs here so the verification is exact rather than approximate.
 */
import { IRC37_FATIGUE, IRC37_RUTTING, ircReliability } from './constants'
import { round } from './units'
import type { DesignResult, PavementLayer } from './types'

/** Mix-correction factor C = 10^M, M = 4.84·[Vbe/(Va+Vbe) − 0.69] (IRC:37-2018). */
export function irc37CFactor(Va: number, Vbe: number): number {
  const M = 4.84 * (Vbe / (Va + Vbe) - 0.69)
  return Math.pow(10, M)
}

/**
 * Allowable fatigue repetitions Nf:
 *   Nf = C · coeff · (1/εt)^3.89 · (1/MR)^0.854   (εt absolute strain, MR in MPa)
 */
export function irc37AllowableFatigue(
  epsilonTMicro: number,
  bituminousModulusMPa: number,
  reliability: 80 | 90,
  C: number,
): number {
  const eps = epsilonTMicro * 1e-6
  const coeff = reliability === 90 ? IRC37_FATIGUE.coeff90 : IRC37_FATIGUE.coeff80
  return (
    C *
    coeff *
    Math.pow(1 / eps, IRC37_FATIGUE.strainExp) *
    Math.pow(1 / bituminousModulusMPa, IRC37_FATIGUE.modulusExp)
  )
}

/** Allowable rutting repetitions Nr = coeff · (1/εv)^4.5337 (εv absolute strain). */
export function irc37AllowableRutting(epsilonVMicro: number, reliability: 80 | 90): number {
  const eps = epsilonVMicro * 1e-6
  const coeff = reliability === 90 ? IRC37_RUTTING.coeff90 : IRC37_RUTTING.coeff80
  return coeff * Math.pow(1 / eps, IRC37_RUTTING.strainExp)
}

export interface Irc37CheckInput {
  /** Design traffic in million standard axles. */
  msa: number
  /** Tensile strain at bottom of bituminous layer (microstrain), from IITPAVE. */
  epsilonTMicro: number
  /** Vertical compressive strain on top of subgrade (microstrain), from IITPAVE. */
  epsilonVMicro: number
  /** Resilient modulus of the bituminous layer (MPa). */
  bituminousModulusMPa: number
  /** Air-void content of the bottom bituminous layer (%). Default 3. */
  Va?: number
  /** Effective bitumen volume of the bottom bituminous layer (%). Default 11.5. */
  Vbe?: number
  reliability?: 80 | 90
  /** Optional trial section thicknesses for the cross-section (mm). */
  section?: { acMm: number; baseMm: number; subbaseMm: number }
}

/** Exact IRC:37-2018 fatigue + rutting verification for a trial section. */
export function irc37Check(inp: Irc37CheckInput): DesignResult {
  const reliability = inp.reliability ?? ircReliability(inp.msa)
  const C = irc37CFactor(inp.Va ?? 3, inp.Vbe ?? 11.5)
  const Nf = irc37AllowableFatigue(inp.epsilonTMicro, inp.bituminousModulusMPa, reliability, C)
  const Nr = irc37AllowableRutting(inp.epsilonVMicro, reliability)
  const designRep = inp.msa * 1e6
  const fatigueUtil = Nf > 0 ? designRep / Nf : Infinity
  const ruttingUtil = Nr > 0 ? designRep / Nr : Infinity
  const ok = fatigueUtil <= 1 && ruttingUtil <= 1

  const s = inp.section
  const layers: PavementLayer[] = s
    ? [
        { role: 'Bituminous', material: 'Bituminous layers', thickness: s.acMm, modulus: inp.bituminousModulusMPa },
        { role: 'Granular base', material: 'WMM / granular base', thickness: s.baseMm },
        { role: 'Granular sub-base', material: 'GSB', thickness: s.subbaseMm },
        { role: 'Subgrade', material: 'Subgrade', thickness: 0 },
      ]
    : []

  return {
    method: 'IRC:37-2018 (Flexible — M-E check)',
    ok,
    sectionLabel: s ? `${s.acMm} / ${s.baseMm} / ${s.subbaseMm} mm` : `${round(inp.msa, 2)} msa check`,
    layers,
    totalThickness: s ? s.acMm + s.baseMm + s.subbaseMm : 0,
    checks: [
      {
        label: 'Fatigue: design reps ≤ Nf',
        value: round(designRep, 0),
        limit: round(Nf, 0),
        unit: 'ESA',
        status: fatigueUtil <= 1 ? 'pass' : 'fail',
        note: `Utilisation ${round(fatigueUtil * 100, 1)}%`,
      },
      {
        label: 'Rutting: design reps ≤ Nr',
        value: round(designRep, 0),
        limit: round(Nr, 0),
        unit: 'ESA',
        status: ruttingUtil <= 1 ? 'pass' : 'fail',
        note: `Utilisation ${round(ruttingUtil * 100, 1)}%`,
      },
    ],
    summary: {
      'Reliability (%)': reliability,
      'C factor': round(C, 3),
      'Allowable Nf (ESA)': round(Nf, 0),
      'Allowable Nr (ESA)': round(Nr, 0),
      'Design repetitions (ESA)': round(designRep, 0),
    },
    citations: [{ code: 'IRC:37-2018', clause: 'Cl. 3 — fatigue & rutting criteria' }],
    warnings: [
      'εt and εv must be obtained from layered-elastic analysis (IITPAVE). This module performs the exact IRC:37 performance check for the supplied strains.',
      ...(ok ? [] : ['Trial section fails a performance criterion — increase the relevant layer thickness/modulus and re-analyse.']),
    ],
  }
}
