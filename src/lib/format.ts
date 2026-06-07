/** UI number formatting helpers. */

export function fmt(n: number | string | undefined | null, dp = 2): string {
  if (n === undefined || n === null) return '—'
  if (typeof n === 'string') return n
  if (!isFinite(n)) return n > 0 ? '∞' : '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: dp, minimumFractionDigits: 0 })
}

export function fmtInt(n: number | undefined | null): string {
  if (n === undefined || n === null || !isFinite(n)) return '—'
  return Math.round(n).toLocaleString('en-US')
}

/** Compact scientific-ish formatting for large repetition counts. */
export function fmtBig(n: number | undefined | null): string {
  if (n === undefined || n === null) return '—'
  if (!isFinite(n)) return '∞'
  if (Math.abs(n) >= 1e6) return n.toExponential(2)
  return fmtInt(n)
}
