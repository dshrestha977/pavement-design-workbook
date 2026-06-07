/**
 * Material properties — layer moduli, AASHTO layer coefficients and concrete
 * strength relationships.
 *
 * Sources: AASHTO 1993 Ch.2 (layer-coefficient nomograph regressions),
 * IRC:37-2018 (granular layer modulus), IS:456 / IRC:58-2015 (concrete).
 */
import { mpaToPsi } from './units'

// ---- AASHTO structural layer coefficients from modulus ----------------------

/** Granular base coefficient a₂ from base modulus (MPa). AASHTO 1993 regression. */
export function aashtoA2FromModulus(eBaseMPa: number): number {
  return 0.249 * Math.log10(mpaToPsi(eBaseMPa)) - 0.977
}

/** Granular sub-base coefficient a₃ from sub-base modulus (MPa). AASHTO 1993 regression. */
export function aashtoA3FromModulus(eSubbaseMPa: number): number {
  return 0.227 * Math.log10(mpaToPsi(eSubbaseMPa)) - 0.839
}

/**
 * Asphalt-concrete surface coefficient a₁ from AC modulus (MPa).
 * Approximation of the AASHTO a₁ nomograph (a₁ ≈ 0.44 at 450,000 psi); clamped.
 */
export function aashtoA1FromModulus(eAcMPa: number): number {
  const a1 = 0.171 * Math.log(mpaToPsi(eAcMPa)) - 1.7765
  return Math.max(0, Math.min(0.54, a1))
}

// ---- IRC:37 granular layer modulus -----------------------------------------

/**
 * Resilient modulus (MPa) of an unbound granular layer over a support layer:
 *   MR_gran = 0.2 · h^0.45 · MR_support   (IRC:37-2018; h in mm).
 * Optionally capped (IRC limits the composite granular modulus).
 */
export function granularLayerModulus(
  thicknessMm: number,
  supportModulusMPa: number,
  cap = Infinity,
): number {
  const m = 0.2 * Math.pow(thicknessMm, 0.45) * supportModulusMPa
  return Math.min(m, cap)
}

// ---- Concrete ---------------------------------------------------------------

/** Elastic modulus of concrete Ec (MPa) from characteristic strength fck (MPa). IS:456. */
export function concreteEcFromFck(fckMPa: number): number {
  return 5000 * Math.sqrt(fckMPa)
}

/** 28-day flexural strength / modulus of rupture (MPa) from fck (MPa). IS:456. */
export function flexuralStrength28(fckMPa: number): number {
  return 0.7 * Math.sqrt(fckMPa)
}

/** 90-day flexural strength ≈ 1.10 × 28-day value (IRC:58-2015 design basis). */
export function flexuralStrength90(fcr28MPa: number): number {
  return 1.1 * fcr28MPa
}

// ---- Indicative default moduli (MPa) ---------------------------------------

export const DEFAULT_MODULI_MPA = {
  bituminous_VG10: 1450,
  bituminous_VG30_35C: 2000,
  bituminous_VG40_35C: 3000,
  granular_base: 300,
  granular_subbase: 150,
  cemented_base_CTB: 5000,
  dry_lean_concrete: 13600,
  pqc_M40: 30000,
} as const

export const POISSON = {
  bituminous: 0.35,
  granular: 0.35,
  cemented: 0.25,
  concrete: 0.15,
  subgrade: 0.4,
} as const
