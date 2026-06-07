/**
 * Combined / composite pavement and overlay design (AASHTO 1993 overlay method).
 *
 * Implements the structural-deficiency overlay approach:
 *  - Asphalt overlay of an existing flexible pavement (Structural Number based).
 *  - Asphalt overlay of an existing rigid pavement (effective-thickness based).
 *  - Composite / white-topping guidance.
 */
import { inToMm, mmToIn, round, roundUpTo } from './units'
import type { DesignResult, PavementLayer } from './types'

export interface FlexibleOverlayInput {
  /** Structural number required for future traffic (from AASHTO design). */
  snRequired: number
  /** Effective structural number of the existing pavement. */
  snEffective: number
  /** Layer coefficient of the asphalt overlay (per inch). */
  overlayLayerCoeff?: number
  existingThicknessMm?: number
}

/** Asphalt overlay over existing flexible pavement: D_ol = (SN_req − SN_eff)/a_ol. */
export function flexibleAsphaltOverlay(inp: FlexibleOverlayInput): DesignResult {
  const aol = inp.overlayLayerCoeff ?? 0.44
  const snDeficiency = Math.max(0, inp.snRequired - inp.snEffective)
  const overlayMm = roundUpTo(inToMm(snDeficiency / aol), 5)
  const ok = true

  const layers: PavementLayer[] = [
    { role: 'AC overlay', material: 'Asphalt concrete overlay', thickness: overlayMm, note: `a=${aol}` },
  ]
  if (inp.existingThicknessMm) layers.push({ role: 'Existing pavement', material: 'Existing flexible pavement', thickness: inp.existingThicknessMm })
  layers.push({ role: 'Subgrade', material: 'Subgrade', thickness: 0 })

  return {
    method: 'AASHTO 1993 (AC overlay / flexible)',
    ok,
    sectionLabel: `${overlayMm} mm AC overlay`,
    layers,
    totalThickness: overlayMm,
    checks: [
      { label: 'Structural deficiency (SN)', value: round(snDeficiency, 2), unit: '', status: 'na' },
    ],
    summary: {
      'SN required': round(inp.snRequired, 2),
      'SN effective': round(inp.snEffective, 2),
      'SN deficiency': round(snDeficiency, 2),
      'Overlay thickness (mm)': overlayMm,
    },
    citations: [{ code: 'AASHTO 1993', clause: 'Part III — Overlay design (flexible)' }],
    warnings: snDeficiency === 0 ? ['No structural overlay required (SN_eff ≥ SN_req); a functional overlay may still be needed.'] : [],
  }
}

export interface RigidAcOverlayInput {
  /** Slab thickness required for future traffic (mm) — from rigid design. */
  slabRequiredMm: number
  /** Effective thickness of the existing slab (mm). */
  slabEffectiveMm: number
  /** Overlay conversion factor A (≈2.2233 for AC over PCC, AASHTO). */
  factorA?: number
}

/** Asphalt overlay of existing rigid pavement: D_ol = A·(D_f − D_eff). */
export function rigidAsphaltOverlay(inp: RigidAcOverlayInput): DesignResult {
  const A = inp.factorA ?? 2.2233
  const deficiencyMm = Math.max(0, inp.slabRequiredMm - inp.slabEffectiveMm)
  const overlayMm = roundUpTo(A * deficiencyMm, 5)

  return {
    method: 'AASHTO 1993 (AC overlay / rigid)',
    ok: true,
    sectionLabel: `${overlayMm} mm AC overlay over PCC`,
    layers: [
      { role: 'AC overlay', material: 'Asphalt concrete overlay', thickness: overlayMm },
      { role: 'Existing PCC', material: 'Existing concrete slab', thickness: inp.slabEffectiveMm },
      { role: 'Foundation', material: 'Foundation', thickness: 0 },
    ],
    totalThickness: overlayMm,
    checks: [{ label: 'Thickness deficiency', value: round(deficiencyMm, 1), unit: 'mm', status: 'na' }],
    summary: {
      'Slab required (mm)': round(inp.slabRequiredMm, 0),
      'Slab effective (mm)': round(inp.slabEffectiveMm, 0),
      'Overlay thickness (mm)': overlayMm,
      'Factor A': A,
    },
    citations: [{ code: 'AASHTO 1993', clause: 'Part III — Overlay design (rigid)' }],
    warnings: ['Effective slab thickness should be from condition survey / NDT (FWD); white-topping requires a separate composite analysis.'],
  }
}

/** Convert an existing flexible layer set to an effective SN given layer coefficients. */
export function effectiveSN(layers: { thicknessMm: number; coeff: number; conditionFactor?: number }[]): number {
  return layers.reduce((sum, l) => sum + l.coeff * mmToIn(l.thicknessMm) * (l.conditionFactor ?? 1), 0)
}
