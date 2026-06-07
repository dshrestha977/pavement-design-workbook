/**
 * Flexible pavement — Nepal DoR "Guidelines for the Design of Flexible Pavement"
 * (2nd Revision, 2021).
 *
 * The DoR guideline is built on IRC:37-2018 (for roads carrying > 2 msa), the
 * TRL Road Note 31 / Road Note 3 traffic approach, and AASHTO concepts, adapted
 * to Nepal. This module applies the DoR decision logic — choose the design track
 * from the design traffic — and returns an indicative Nepal-standard section with
 * the appropriate citations. Final thickness must be confirmed with IITPAVE /
 * the DoR catalogue.
 */
import { classifyBand } from './traffic'
import { ORN31_TRAFFIC } from './constants'
import { orn31SubgradeClass } from './subgrade'
import { round } from './units'
import type { DesignResult, PavementLayer } from './types'

export interface DorInput {
  /** Design traffic in million standard axles. */
  msa: number
  /** Design subgrade CBR (%). */
  designCBR: number
}

/** Bituminous (DBM + BC) total thickness guidance (mm) by design traffic (msa). */
function bituminousThickness(msa: number): number {
  if (msa < 2) return 50 // SDBC / thin bituminous for low-volume
  if (msa < 5) return 90
  if (msa < 10) return 110
  if (msa < 20) return 140
  if (msa < 30) return 165
  return 190
}

/** Granular base (WMM) thickness guidance (mm). */
function baseThickness(msa: number): number {
  return msa < 2 ? 225 : 250
}

/** Granular sub-base (GSB) thickness guidance (mm) by subgrade CBR. */
function subbaseThickness(cbr: number): number {
  if (cbr >= 10) return 200
  if (cbr >= 6) return 250
  if (cbr >= 4) return 300
  return 380 // weak subgrade — sub-base + improvement
}

export function dorNepalDesign(inp: DorInput): DesignResult {
  const t = classifyBand(inp.msa, ORN31_TRAFFIC)
  const sg = orn31SubgradeClass(inp.designCBR)
  const lowVolume = inp.msa < 2

  const bit = bituminousThickness(inp.msa)
  const base = baseThickness(inp.msa)
  const sub = subbaseThickness(inp.designCBR)

  const layers: PavementLayer[] = [
    {
      role: 'Bituminous',
      material: lowVolume ? 'Surface dressing / SDBC' : 'BC over DBM',
      thickness: bit,
    },
    { role: 'Granular base', material: 'Wet-mix macadam (WMM)', thickness: base },
    { role: 'Granular sub-base', material: 'GSB (Nepal Std. Spec.)', thickness: sub },
    { role: 'Subgrade', material: `CBR ${round(inp.designCBR, 1)}% (${sg.cls})`, thickness: 0 },
  ]
  const total = bit + base + sub

  return {
    method: 'Nepal DoR 2021 (Flexible)',
    ok: true,
    sectionLabel: `${bit}/${base}/${sub} mm (Bit/WMM/GSB)`,
    layers,
    totalThickness: total,
    checks: [
      {
        label: 'Design track',
        value: inp.msa,
        unit: 'msa',
        status: 'na',
        note: lowVolume ? 'Low-volume (Road Note 31 / surface dressing track)' : 'IRC:37-2018 track (> 2 msa)',
      },
      { label: 'Traffic class (ORN)', value: inp.msa, unit: 'msa', status: 'na', note: t.band.cls },
    ],
    summary: {
      'Design traffic (msa)': round(inp.msa, 2),
      'Track': lowVolume ? 'Low-volume roads' : 'IRC:37-2018',
      'Bituminous (mm)': bit,
      'Base WMM (mm)': base,
      'Sub-base GSB (mm)': sub,
      'Total (mm)': total,
    },
    citations: [
      { code: 'DoR Nepal 2021', clause: 'Guidelines for the Design of Flexible Pavement (2nd Rev.)' },
      { code: 'IRC:37-2018', note: 'adopted by DoR for > 2 msa' },
    ],
    warnings: [
      'Indicative Nepal-standard section — confirm thicknesses with the DoR 2021 catalogue and IITPAVE layered-elastic analysis (use the IRC:37 check tab with εt, εv).',
    ],
  }
}
