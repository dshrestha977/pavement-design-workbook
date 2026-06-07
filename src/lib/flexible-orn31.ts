/**
 * Flexible pavement — TRL Overseas Road Note 31 (structural catalogue method).
 *
 * The design is selected from a structural catalogue keyed by traffic class
 * (T1–T8, cumulative ESA) and subgrade strength class (S1–S6, CBR). This module
 * determines those classes EXACTLY and returns catalogue thicknesses for the
 * most common case — Chart 1 (granular road base + bituminous surfacing).
 *
 * ⚠ The catalogue thickness values below are an INDICATIVE reconstruction of
 * ORN 31 Chart 1 (anchored to the documented T3/S3 = 200 mm base / 225 mm
 * sub-base / surface dressing). They MUST be confirmed against the official
 * ORN 31 structural catalogue before use in construction.
 */
import { ORN31_TRAFFIC } from './constants'
import { classifyBand } from './traffic'
import { orn31SubgradeClass } from './subgrade'
import type { DesignResult, PavementLayer } from './types'

/** Granular road base thickness (mm) by traffic class — ORN 31 Chart 1 (indicative). */
const ROAD_BASE_MM: Record<string, number> = {
  T1: 150, T2: 175, T3: 200, T4: 225, T5: 275, T6: 300, T7: 300, T8: 300,
}
/** Granular sub-base thickness (mm) by subgrade class — ORN 31 Chart 1 (indicative). */
const SUB_BASE_MM: Record<string, number> = {
  S1: 300, S2: 300, S3: 225, S4: 150, S5: 100, S6: 0,
}
/** Capping layer (mm) for weak subgrades — ORN 31 (indicative). */
const CAPPING_MM: Record<string, number> = {
  S1: 300, S2: 150, S3: 0, S4: 0, S5: 0, S6: 0,
}

export interface Orn31Input {
  /** Cumulative design traffic in million ESA. */
  cumulativeMsa: number
  /** Design subgrade CBR (%). */
  designCBR: number
}

/** ORN 31 catalogue design (Chart 1 — granular road base). */
export function orn31Design(inp: Orn31Input): DesignResult {
  const t = classifyBand(inp.cumulativeMsa, ORN31_TRAFFIC)
  const tCls = t.band.cls
  const sg = orn31SubgradeClass(inp.designCBR)
  const sCls = sg.cls

  const roadBase = ROAD_BASE_MM[tCls] ?? 300
  const subBase = SUB_BASE_MM[sCls] ?? 200
  const capping = CAPPING_MM[sCls] ?? 0

  // Surfacing: surface dressing for light/medium traffic; structural AC for T7/T8.
  const structuralSurface = tCls === 'T7' || tCls === 'T8'
  const surfaceMm = structuralSurface ? 100 : 20
  const surfaceMaterial = structuralSurface ? 'Asphalt concrete (structural)' : 'Double bituminous surface dressing'

  const layers: PavementLayer[] = [
    { role: 'Surfacing', material: surfaceMaterial, thickness: surfaceMm },
    { role: 'Road base', material: 'Crushed stone (granular)', thickness: roadBase },
    { role: 'Sub-base', material: 'Granular sub-base', thickness: subBase },
  ]
  if (capping > 0) layers.push({ role: 'Capping', material: 'Capping layer', thickness: capping })
  layers.push({ role: 'Subgrade', material: `${sCls} — ${sg.label}`, thickness: 0 })

  const total = surfaceMm + roadBase + subBase + capping
  const warnings = [
    'Catalogue thicknesses are INDICATIVE — confirm against the official ORN 31 structural catalogue (Charts 1–8).',
  ]
  if (structuralSurface)
    warnings.push('For T7/T8, ORN 31 Chart 1 (granular base) does not apply — use a chart with a bituminous/composite road base and structural surfacing.')

  return {
    method: 'ORN 31 (Flexible — catalogue)',
    ok: true,
    sectionLabel: `${tCls}/${sCls}: ${surfaceMm}/${roadBase}/${subBase}${capping ? '/' + capping : ''} mm`,
    layers,
    totalThickness: total,
    checks: [
      { label: 'Traffic class', value: inp.cumulativeMsa, unit: 'msa', status: 'na', note: tCls + (t.exceeds ? ' (exceeds T8)' : '') },
      { label: 'Subgrade class', value: inp.designCBR, unit: '% CBR', status: 'na', note: `${sCls} — ${sg.label}` },
    ],
    summary: {
      'Traffic class': tCls,
      'Subgrade class': sCls,
      'Road base (mm)': roadBase,
      'Sub-base (mm)': subBase,
      'Capping (mm)': capping,
      'Total granular + surfacing (mm)': total,
    },
    citations: [{ code: 'TRL ORN 31', clause: 'Structural catalogue — Chart 1' }],
    warnings,
  }
}
