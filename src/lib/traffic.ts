/**
 * Traffic analysis — design traffic in both ESAL (AASHTO) and MSA (IRC/ORN).
 *
 * Sources: IRC:37-2018 Cl. 5 (design traffic), AASHTO 1993 Part II (ESAL),
 * TRL Overseas Road Note 31 (traffic classes T1–T8).
 */
import { ORN31_TRAFFIC } from './constants'
import type { ClassBand } from './types'

export type AxleType = 'single' | 'tandem' | 'tridem'

/** IRC:37 standard axle loads by configuration (kN). Damage ∝ (load/standard)^4. */
export const STD_AXLE_KN: Record<AxleType, number> = {
  single: 80,
  tandem: 148,
  tridem: 224,
}

export interface AxleLoadGroup {
  type: AxleType
  loadKn: number
  count: number
}

/** Find the class band a value falls into (bands sorted ascending by `max`). */
export function classifyBand<T extends string>(
  value: number,
  bands: ClassBand<T>[],
): { band: ClassBand<T>; exceeds: boolean } {
  const last = bands[bands.length - 1]
  if (value > last.max) return { band: last, exceeds: true }
  for (const b of bands) if (value <= b.max) return { band: b, exceeds: false }
  return { band: last, exceeds: false }
}

/** Cumulative growth factor over n years at annual rate r (%). Uses n if r=0. */
export function growthFactor(growthRatePct: number, years: number): number {
  const r = growthRatePct / 100
  return r > 0 ? (Math.pow(1 + r, years) - 1) / r : years
}

// ---- IRC / ORN: design traffic in MSA --------------------------------------

export interface DesignTrafficInput {
  /** Commercial vehicles/day at completion of construction (both directions). */
  initialCommercialVehiclesPerDay: number
  growthRatePct: number
  designLifeYears: number
  /** Lane distribution factor D — share of CVs in the design lane (IRC:37 Cl.5.4). */
  laneDistributionFactor: number
  /** Vehicle Damage Factor F — standard axles per commercial vehicle. */
  vehicleDamageFactor: number
}

export interface DesignTrafficResult {
  growthFactor: number
  cumulativeESA: number
  msa: number
  orn31Class: string
  orn31Exceeds: boolean
}

/**
 * IRC:37-2018 cumulative standard axles:
 *   N = 365 · A · [((1+r)^n − 1)/r] · D · F
 * Returned both as raw ESA and as msa (×10⁻⁶), with the ORN 31 traffic class.
 */
export function designTrafficMSA(inp: DesignTrafficInput): DesignTrafficResult {
  const gf = growthFactor(inp.growthRatePct, inp.designLifeYears)
  const cumulativeESA =
    365 *
    inp.initialCommercialVehiclesPerDay *
    gf *
    inp.laneDistributionFactor *
    inp.vehicleDamageFactor
  const msa = cumulativeESA / 1e6
  const { band, exceeds } = classifyBand(msa, ORN31_TRAFFIC)
  return {
    growthFactor: gf,
    cumulativeESA,
    msa,
    orn31Class: band.cls,
    orn31Exceeds: exceeds,
  }
}

/**
 * Vehicle Damage Factor from an axle-load survey: standard axles per vehicle,
 * VDF = Σ count·(load/standard)^4  ÷  number of vehicles surveyed.
 */
export function vehicleDamageFactor(
  groups: AxleLoadGroup[],
  numVehiclesSurveyed: number,
): number {
  const esa = groups.reduce(
    (s, g) => s + g.count * Math.pow(g.loadKn / STD_AXLE_KN[g.type], 4),
    0,
  )
  return numVehiclesSurveyed > 0 ? esa / numVehiclesSurveyed : 0
}

// ---- AASHTO: cumulative ESAL (W18) -----------------------------------------

export interface VehicleClassEsal {
  label: string
  aadt: number
  /** Load equivalency factor (ESALs per vehicle pass). */
  lef: number
}

export interface EsalInput {
  classes: VehicleClassEsal[]
  growthRatePct: number
  designLifeYears: number
  /** Directional distribution DD (≈0.5 for two-way). */
  directionalDistribution: number
  /** Lane distribution DL (1.0 single lane/direction, <1 multi-lane). */
  laneDistribution: number
}

export interface EsalResult {
  dailyESAL: number
  growthFactor: number
  w18: number
}

/** AASHTO 1993 design ESAL: W18 = 365·ΣAADTᵢ·LEFᵢ·GF·DD·DL. */
export function cumulativeESAL(inp: EsalInput): EsalResult {
  const gf = growthFactor(inp.growthRatePct, inp.designLifeYears)
  const dailyESAL = inp.classes.reduce((s, c) => s + c.aadt * c.lef, 0)
  const w18 = 365 * dailyESAL * gf * inp.directionalDistribution * inp.laneDistribution
  return { dailyESAL, growthFactor: gf, w18 }
}

/** Load equivalency factor for one vehicle from its axles (4th-power law). */
export function lefFromAxles(axles: AxleLoadGroup[]): number {
  return axles.reduce(
    (s, a) => s + a.count * Math.pow(a.loadKn / STD_AXLE_KN[a.type], 4),
    0,
  )
}
