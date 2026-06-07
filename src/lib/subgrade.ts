/**
 * Subgrade evaluation — design CBR, resilient modulus (MR), modulus of subgrade
 * reaction (k) and ORN 31 subgrade strength class.
 *
 * Sources: IRC:37-2018 Cl. 6 (subgrade, MR–CBR), IRC:58-2015 Table 2 (k–CBR),
 * AASHTO 1993, TRL ORN 31 (subgrade classes S1–S6).
 */
import { psiToMpa } from './units'

export type CbrDesignMethod = 'mean' | 'percentile'

export interface DesignCbrInput {
  samples: number[]
  method: CbrDesignMethod
  /** For the percentile method: design CBR is equalled/exceeded by p% of samples. */
  percentile?: number
}

export interface DesignCbrResult {
  designCBR: number
  method: string
  n: number
  note: string
}

/**
 * Recommended design-CBR exceedance percentile by traffic level (AASHTO 1993
 * percentile-selection guidance): higher-volume roads use a higher percentile.
 */
export function recommendedPercentile(msa: number): number {
  if (msa > 10) return 87.5
  if (msa >= 2) return 75
  return 50
}

export function designCBR(inp: DesignCbrInput): DesignCbrResult {
  const xs = [...inp.samples].filter((v) => v > 0).sort((a, b) => a - b)
  const n = xs.length
  if (n === 0) return { designCBR: 0, method: inp.method, n: 0, note: 'No valid samples' }

  if (inp.method === 'mean') {
    const m = xs.reduce((a, b) => a + b, 0) / n
    return { designCBR: m, method: 'Mean', n, note: 'Arithmetic mean of samples' }
  }

  // Percentile method: design CBR equalled or exceeded by p% of values, i.e.
  // the (100−p)th percentile of the ascending data (linear interpolation).
  const p = inp.percentile ?? 90
  const q = (100 - p) / 100
  const idx = q * (n - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  const val = lo === hi ? xs[lo] : xs[lo] + (idx - lo) * (xs[hi] - xs[lo])
  return {
    designCBR: val,
    method: `${p}% exceedance`,
    n,
    note: `CBR equalled or exceeded by ${p}% of ${n} samples`,
  }
}

export type MrCorrelation = 'irc' | 'aashto'

/**
 * Resilient modulus (MPa) from soaked CBR.
 *  - 'irc'    : IRC:37-2018 — MR = 10·CBR (CBR≤5); MR = 17.6·CBR^0.64 (CBR>5).
 *  - 'aashto' : AASHTO 1993 — MR(psi) = 1500·CBR (valid for CBR < 10).
 */
export function cbrToMr(cbr: number, corr: MrCorrelation = 'irc'): number {
  if (cbr <= 0) return 0
  if (corr === 'aashto') return psiToMpa(1500 * cbr)
  return cbr <= 5 ? 10 * cbr : 17.6 * Math.pow(cbr, 0.64)
}

/** IRC:58-2015 Table 2 — modulus of subgrade reaction k (MPa/m) vs subgrade CBR (%). */
const IRC58_K_TABLE: [number, number][] = [
  [2, 21], [3, 28], [4, 35], [5, 42], [7, 48], [10, 55], [15, 62], [20, 69], [50, 140], [100, 220],
]

/** Modulus of subgrade reaction k (MPa/m) from CBR, interpolated from IRC:58 Table 2. */
export function cbrToK(cbr: number): number {
  const t = IRC58_K_TABLE
  if (cbr <= t[0][0]) return t[0][1]
  if (cbr >= t[t.length - 1][0]) return t[t.length - 1][1]
  for (let i = 0; i < t.length - 1; i++) {
    const [c0, k0] = t[i]
    const [c1, k1] = t[i + 1]
    if (cbr >= c0 && cbr <= c1) return k0 + ((cbr - c0) / (c1 - c0)) * (k1 - k0)
  }
  return t[t.length - 1][1]
}

export interface Orn31Subgrade {
  cls: string
  label: string
}

/** TRL ORN 31 subgrade strength class S1–S6 from soaked CBR (%). */
export function orn31SubgradeClass(cbr: number): Orn31Subgrade {
  if (cbr < 3) return { cls: 'S1', label: 'CBR 2 (<3)' }
  if (cbr < 5) return { cls: 'S2', label: 'CBR 3–4' }
  if (cbr < 8) return { cls: 'S3', label: 'CBR 5–7' }
  if (cbr < 15) return { cls: 'S4', label: 'CBR 8–14' }
  if (cbr < 30) return { cls: 'S5', label: 'CBR 15–29' }
  return { cls: 'S6', label: 'CBR 30+' }
}
