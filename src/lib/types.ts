/**
 * Shared domain types for the pavement design engine.
 *
 * Internal calculations use SI units unless a function explicitly documents
 * otherwise: length in millimetres (mm), load in kilonewtons (kN), stress and
 * modulus in megapascals (MPa). AASHTO routines convert to US units (inch, psi,
 * pci) internally because the empirical equations are calibrated in those units.
 */

export type UnitSystem = 'metric' | 'imperial'

export type PavementType = 'flexible' | 'rigid' | 'combined'

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'na'

/** A reference to a design standard / clause, surfaced in the UI and reports. */
export interface Citation {
  code: string
  clause?: string
  note?: string
}

/** A single pass/fail design verification line. */
export interface DesignCheck {
  label: string
  value: number
  limit?: number
  unit?: string
  status: CheckStatus
  note?: string
}

/** One structural layer of a pavement cross-section (top → bottom). */
export interface PavementLayer {
  role: string // e.g. "Surface (AC)", "Base", "Sub-base", "PQC slab", "DLC"
  material: string
  thickness: number // mm (0 for a semi-infinite subgrade marker)
  modulus?: number // MPa, if known
  note?: string
}

/** Uniform result envelope returned by every design method. */
export interface DesignResult {
  method: string
  ok: boolean
  sectionLabel: string
  layers: PavementLayer[]
  totalThickness: number // mm (structural layers above subgrade)
  checks: DesignCheck[]
  summary: Record<string, number | string>
  citations: Citation[]
  warnings: string[]
}

/** Helper: classification band lookup result. */
export interface ClassBand<T extends string = string> {
  cls: T
  min: number
  max: number
  label?: string
}
