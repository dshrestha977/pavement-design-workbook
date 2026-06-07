/** Unit conversions and small numeric helpers shared across the engine. */

// ---- Length -----------------------------------------------------------------
export const IN_TO_MM = 25.4
export const MM_TO_IN = 1 / 25.4

// ---- Stress / modulus -------------------------------------------------------
export const PSI_TO_MPA = 0.006894757
export const MPA_TO_PSI = 145.0377
export const KSI_TO_MPA = 6.894757

// ---- Load -------------------------------------------------------------------
export const KN_TO_LBF = 224.8089
export const LBF_TO_KN = 1 / 224.8089

// ---- Modulus of subgrade reaction ------------------------------------------
/** 1 psi/in (pci) = 0.271447 MPa/m. So 100 pci ≈ 27.1 MPa/m. */
export const PCI_TO_MPA_PER_M = 0.271447
export const MPA_PER_M_TO_PCI = 1 / 0.271447

export const inToMm = (v: number) => v * IN_TO_MM
export const mmToIn = (v: number) => v * MM_TO_IN
export const psiToMpa = (v: number) => v * PSI_TO_MPA
export const mpaToPsi = (v: number) => v * MPA_TO_PSI

/** Round to `dp` decimal places (away-from-zero half rounding). */
export function round(x: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round((x + Number.EPSILON * Math.sign(x || 1)) * f) / f
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

/** Round a thickness up to a practical construction increment (default 5 mm). */
export function roundUpTo(value: number, step = 5): number {
  return Math.ceil(value / step) * step
}

/**
 * Bisection root finder for a continuous, monotonic function on [lo, hi].
 * If there is no sign change across the interval, returns the bound whose
 * |f| is smallest (i.e. the closest feasible answer) — useful when a design
 * value is pinned at a practical limit.
 */
export function bisection(
  f: (x: number) => number,
  lo: number,
  hi: number,
  tol = 1e-7,
  maxIter = 300,
): number {
  let flo = f(lo)
  const fhi = f(hi)
  if (flo === 0) return lo
  if (fhi === 0) return hi
  if (flo * fhi > 0) return Math.abs(flo) < Math.abs(fhi) ? lo : hi
  let a = lo
  let b = hi
  for (let i = 0; i < maxIter; i++) {
    const m = (a + b) / 2
    const fm = f(m)
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) return m
    if (flo * fm < 0) {
      b = m
    } else {
      a = m
      flo = fm
    }
  }
  return (a + b) / 2
}
