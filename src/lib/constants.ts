/**
 * Design constants and reference data, with sources.
 *
 * Sources:
 *  - AASHTO Guide for Design of Pavement Structures, 1993.
 *  - IRC:37-2018 Guidelines for the Design of Flexible Pavements.
 *  - IRC:58-2015 Guidelines for the Design of Plain Jointed Rigid Pavements.
 *  - TRL Overseas Road Note 31 (4th ed.), A Guide to the Structural Design of
 *    Bitumen-surfaced Roads in Tropical and Sub-tropical Countries.
 *  - DoR Nepal, Guidelines for the Design of Flexible Pavement, 2nd Rev. 2021.
 */
import type { ClassBand } from './types'

/** Reference single axle: 80 kN (8.16 t), dual wheel. */
export const STANDARD_AXLE_KN = 80

/** AASHTO 1993 overall standard deviation S0 (typical values). */
export const S0_FLEXIBLE = 0.45 // range 0.40–0.50
export const S0_RIGID = 0.35 // range 0.30–0.40

/**
 * AASHTO 1993 reliability (%) → standard normal deviate ZR (one-sided, negative).
 * Tabulated reference values (AASHTO Guide, Table 4.1).
 */
export const ZR_TABLE: Record<number, number> = {
  50: 0.0, 60: -0.253, 70: -0.524, 75: -0.674, 80: -0.841, 85: -1.037,
  90: -1.282, 91: -1.34, 92: -1.405, 93: -1.476, 94: -1.555, 95: -1.645,
  96: -1.751, 97: -1.881, 98: -2.054, 99: -2.327, 99.9: -3.09, 99.99: -3.75,
}

/**
 * Inverse standard-normal CDF (Acklam's algorithm, |abs error| < 1.15e-9).
 * Returns z such that Φ(z) = p, for 0 < p < 1.
 */
export function invNorm(p: number): number {
  if (p <= 0 || p >= 1) throw new Error('invNorm: p must be in (0,1)')
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const plow = 0.02425
  const phigh = 1 - plow
  let q: number
  let r: number
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= phigh) {
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}

/** AASHTO standard normal deviate ZR for a reliability R (percent). Negative for R>50. */
export function zFromReliability(R: number): number {
  return invNorm(1 - R / 100)
}

// ---- IRC 37:2018 performance models ----------------------------------------
/**
 * Fatigue (bottom-up cracking) of the bituminous layer:
 *   Nf = C * coeff * (1/εt)^3.89 * (1/MR)^0.854
 * where εt = horizontal tensile strain at bottom of bituminous layer,
 * MR = resilient modulus of the bituminous layer (MPa),
 * C = 10^M, M = 4.84*[Vbe/(Va+Vbe) − 0.69].  (IRC:37-2018 Eq. 3.1)
 */
export const IRC37_FATIGUE = {
  strainExp: 3.89,
  modulusExp: 0.854,
  coeff80: 1.6064e-4, // 80% reliability (design traffic < 20 msa)
  coeff90: 0.5161e-4, // 90% reliability (design traffic ≥ 20 msa)
}

/**
 * Rutting (subgrade) criterion:
 *   Nr = coeff * (1/εv)^4.5337
 * where εv = vertical compressive strain on top of subgrade. (IRC:37-2018 Eq. 3.2)
 */
export const IRC37_RUTTING = {
  strainExp: 4.5337,
  coeff80: 4.1656e-8, // 80% reliability (< 20 msa)
  coeff90: 1.41e-8, // 90% reliability (≥ 20 msa)
}

/** Reliability level recommended by IRC:37-2018 from design traffic (msa). */
export function ircReliability(msa: number): 80 | 90 {
  return msa >= 20 ? 90 : 80
}

// ---- IRC 58:2015 concrete fatigue model (PCA form) -------------------------
/**
 * Allowable load repetitions from stress ratio SR (= flexural stress / modulus
 * of rupture). IRC:58-2015 Cl. 6.4 / PCA fatigue:
 *   SR < 0.45             → unlimited (return Infinity)
 *   0.45 ≤ SR < 0.55      → N = (4.2577 / (SR − 0.4325))^3.268
 *   SR ≥ 0.55             → log10(N) = (0.9718 − SR) / 0.0828
 */
export function concreteFatigueLife(SR: number): number {
  if (SR < 0.45) return Infinity
  if (SR < 0.55) return Math.pow(4.2577 / (SR - 0.4325), 3.268)
  return Math.pow(10, (0.9718 - SR) / 0.0828)
}

// ---- ORN 31 classification bands -------------------------------------------
/** Traffic classes T1–T8 in cumulative million equivalent standard axles (ESA). */
export const ORN31_TRAFFIC: ClassBand<`T${number}`>[] = [
  { cls: 'T1', min: 0, max: 0.3 },
  { cls: 'T2', min: 0.3, max: 0.7 },
  { cls: 'T3', min: 0.7, max: 1.5 },
  { cls: 'T4', min: 1.5, max: 3.0 },
  { cls: 'T5', min: 3.0, max: 6.0 },
  { cls: 'T6', min: 6.0, max: 10.0 },
  { cls: 'T7', min: 10.0, max: 17.0 },
  { cls: 'T8', min: 17.0, max: 30.0 },
]

/** Subgrade strength classes S1–S6 in soaked CBR (%). */
export const ORN31_SUBGRADE: ClassBand<`S${number}`>[] = [
  { cls: 'S1', min: 2, max: 2, label: '2 (CBR < 3)' },
  { cls: 'S2', min: 3, max: 4 },
  { cls: 'S3', min: 5, max: 7 },
  { cls: 'S4', min: 8, max: 14 },
  { cls: 'S5', min: 15, max: 29 },
  { cls: 'S6', min: 30, max: Infinity, label: '30+' },
]

// ---- AASHTO 1993 default layer coefficients (per inch) ----------------------
/** Indicative AASHTO structural layer coefficients (AASHTO 1993, Ch. 2). */
export const AASHTO_LAYER_COEFF = {
  ac_surface: 0.44, // dense-graded asphalt concrete surface
  ac_binder: 0.4,
  bituminous_base: 0.3,
  granular_base: 0.14, // unbound crushed stone base (CBR ~80–100)
  granular_subbase: 0.11, // unbound granular sub-base (CBR ~30)
  cement_treated_base: 0.2,
}

/** Default drainage coefficient m (AASHTO 1993, Table 2.4) — fair drainage. */
export const AASHTO_DRAINAGE_M_DEFAULT = 1.0
