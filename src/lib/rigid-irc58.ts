/**
 * Rigid pavement — IRC:58-2015 (plain jointed) stress + fatigue framework.
 *
 * IRC:58-2015 obtains the load-induced flexural stress from finite-element
 * regression (IITRIGID). This module implements the exact surrounding framework
 * — radius of relative stiffness, Westergaard load stresses (used as an estimate
 * and selectable), Bradbury temperature-warping stress, the concrete fatigue
 * model and cumulative fatigue damage, plus tie-bar and dowel-bar design. The
 * load flexural stress may instead be supplied directly from IITRIGID for an
 * exact IRC:58-2015 check.
 */
import { concreteFatigueLife } from './constants'
import { round } from './units'
import type { DesignResult } from './types'

/** Radius of relative stiffness l (mm). E in MPa, h in mm, k in MPa/m. */
export function radiusOfRelativeStiffness(eMPa: number, hMm: number, mu: number, kMPaPerM: number): number {
  const k = kMPaPerM / 1000 // MPa/m → N/mm³
  return Math.pow((eMPa * Math.pow(hMm, 3)) / (12 * (1 - mu * mu) * k), 0.25)
}

/** Westergaard equivalent radius of resisting section b (mm). */
export function equivalentRadius(aMm: number, hMm: number): number {
  return aMm / hMm < 1.724 ? Math.sqrt(1.6 * aMm * aMm + hMm * hMm) - 0.675 * hMm : aMm
}

/** Contact radius a (mm) of a circular wheel imprint: a = √(P/(π·p)). P in N, p in MPa. */
export function contactRadius(pN: number, pressureMPa: number): number {
  return Math.sqrt(pN / (Math.PI * pressureMPa))
}

/** Westergaard edge load stress (MPa). P in N; h, l, b in mm. (Yoder & Witczak form.) */
export function westergaardEdgeStress(pN: number, hMm: number, lMm: number, bMm: number): number {
  return 0.803 * (pN / (hMm * hMm)) * (4 * Math.log10(lMm / bMm) + 0.666 * (bMm / lMm) - 0.034)
}

/** Westergaard corner load stress (MPa). */
export function westergaardCornerStress(pN: number, hMm: number, lMm: number, aMm: number): number {
  return (3 * pN) / (hMm * hMm) * (1 - Math.pow((aMm * Math.SQRT2) / lMm, 0.6))
}

/** Bradbury warping-stress coefficient C from the ratio L/l (free length / l). */
const BRADBURY: [number, number][] = [
  [1, 0], [2, 0.04], [3, 0.175], [4, 0.44], [5, 0.72], [6, 0.92], [7, 1.03], [8, 1.075], [9, 1.08], [10, 1.075], [11, 1.05], [12, 1.0],
]
export function bradburyCoefficient(ratio: number): number {
  if (ratio <= BRADBURY[0][0]) return BRADBURY[0][1]
  if (ratio >= BRADBURY[BRADBURY.length - 1][0]) return 1.0
  for (let i = 0; i < BRADBURY.length - 1; i++) {
    const [r0, c0] = BRADBURY[i]
    const [r1, c1] = BRADBURY[i + 1]
    if (ratio >= r0 && ratio <= r1) return c0 + ((ratio - r0) / (r1 - r0)) * (c1 - c0)
  }
  return 1.0
}

/** Edge warping (temperature) stress (MPa): σ = C·E·α·ΔT/2. */
export function edgeWarpingStress(eMPa: number, alpha: number, deltaT: number, C: number): number {
  return (C * eMPa * alpha * deltaT) / 2
}

/** Recommended dowel-bar dimensions (mm) by slab thickness — IRC:58-2015 (indicative). */
export function recommendedDowel(hMm: number): { dia: number; length: number; spacing: number } {
  if (hMm <= 200) return { dia: 25, length: 360, spacing: 300 }
  if (hMm <= 230) return { dia: 30, length: 400, spacing: 300 }
  if (hMm <= 250) return { dia: 32, length: 450, spacing: 300 }
  if (hMm <= 280) return { dia: 36, length: 450, spacing: 300 }
  return { dia: 38, length: 500, spacing: 300 }
}

export interface TieBarResult {
  areaPerMetreMm2: number
  barDiameterMm: number
  spacingMm: number
  lengthMm: number
}

/** Tie-bar design (friction method, IRC:58). */
export function tieBarDesign(
  hMm: number,
  laneWidthM: number,
  opts?: { frictionCoeff?: number; steelStressMPa?: number; bondStressMPa?: number; barDiaMm?: number; unitWeightKnM3?: number },
): TieBarResult {
  const f = opts?.frictionCoeff ?? 1.5
  const sst = opts?.steelStressMPa ?? 200
  const tbd = opts?.bondStressMPa ?? 2.46
  const d = opts?.barDiaMm ?? 12
  const gamma = opts?.unitWeightKnM3 ?? 24
  const W = (hMm / 1000) * gamma // kN/m² slab weight
  const forcePerM = f * W * (laneWidthM / 2) * 1000 // N per metre length of joint
  const areaPerMetre = forcePerM / sst // mm²/m
  const aBar = (Math.PI * d * d) / 4
  const spacing = (aBar / areaPerMetre) * 1000 // mm
  const length = (sst * d) / (2 * tbd) // development length both sides
  return {
    areaPerMetreMm2: round(areaPerMetre, 1),
    barDiameterMm: d,
    spacingMm: Math.floor(spacing / 10) * 10,
    lengthMm: Math.ceil(length / 10) * 10,
  }
}

export interface Irc58Input {
  slabThicknessMm: number
  /** Single critical wheel/axle load on the slab (kN). */
  wheelLoadKn: number
  tyrePressureMPa?: number
  concreteEcMPa: number
  poisson?: number
  /** 90-day flexural strength / modulus of rupture (MPa). */
  modulusRuptureMPa: number
  kMPaPerM: number
  thermalCoefficient?: number
  temperatureDifferentialC: number
  slabLengthMm: number
  laneWidthMm: number
  /** Design axle repetitions producing this stress (for the CFD check). */
  axleRepetitions: number
  /** Optional FE/IITRIGID load flexural stress (MPa) — overrides Westergaard. */
  flexuralStressInputMPa?: number
}

export function irc58Design(inp: Irc58Input): DesignResult {
  const mu = inp.poisson ?? 0.15
  const alpha = inp.thermalCoefficient ?? 10e-6
  const p = inp.tyrePressureMPa ?? 0.8
  const h = inp.slabThicknessMm
  const pN = inp.wheelLoadKn * 1000

  const l = radiusOfRelativeStiffness(inp.concreteEcMPa, h, mu, inp.kMPaPerM)
  const a = contactRadius(pN, p)
  const b = equivalentRadius(a, h)
  const loadStress = inp.flexuralStressInputMPa ?? westergaardEdgeStress(pN, h, l, b)

  const C = bradburyCoefficient(inp.slabLengthMm / l)
  const tempStress = edgeWarpingStress(inp.concreteEcMPa, alpha, inp.temperatureDifferentialC, C)
  const combined = loadStress + tempStress
  const SR = combined / inp.modulusRuptureMPa
  const nAllow = concreteFatigueLife(SR)
  const cfd = nAllow === Infinity ? 0 : inp.axleRepetitions / nAllow
  const ok = cfd <= 1

  const tie = tieBarDesign(h, inp.laneWidthMm / 1000)
  const dowel = recommendedDowel(h)

  return {
    method: 'IRC:58-2015 (Rigid)',
    ok,
    sectionLabel: `${h} mm slab · SR ${round(SR, 2)}`,
    layers: [
      { role: 'PQC slab', material: `PCC (MR ${round(inp.modulusRuptureMPa, 2)} MPa)`, thickness: h, modulus: inp.concreteEcMPa },
      { role: 'Foundation', material: `k = ${round(inp.kMPaPerM)} MPa/m`, thickness: 0 },
    ],
    totalThickness: h,
    checks: [
      { label: 'Stress ratio SR', value: round(SR, 3), limit: 0.45, unit: '', status: SR < 0.45 ? 'pass' : SR < 0.55 ? 'warn' : 'fail', note: SR < 0.45 ? 'Infinite fatigue life' : 'Finite fatigue life' },
      { label: 'Cumulative fatigue damage', value: round(cfd, 3), limit: 1, unit: '', status: cfd <= 1 ? 'pass' : 'fail' },
    ],
    summary: {
      'Radius of rel. stiffness l (mm)': round(l, 1),
      'Load stress (MPa)': round(loadStress, 3),
      'Temperature stress (MPa)': round(tempStress, 3),
      'Combined edge stress (MPa)': round(combined, 3),
      'Stress ratio': round(SR, 3),
      'Allowable repetitions': nAllow === Infinity ? '∞' : round(nAllow, 0),
      'Tie bar': `${tie.barDiameterMm}mm @ ${tie.spacingMm}mm, L=${tie.lengthMm}mm`,
      'Dowel bar': `${dowel.dia}mm × ${dowel.length}mm @ ${dowel.spacing}mm`,
    },
    citations: [
      { code: 'IRC:58-2015', clause: 'Cl. 6 — stress & fatigue; Cl. 7 — joints' },
      { code: 'Westergaard', note: 'load-stress estimate (use IITRIGID for exact IRC:58 stress)' },
    ],
    warnings: [
      'Load flexural stress shown is a Westergaard edge-stress estimate; IRC:58-2015 uses FE (IITRIGID) regression — input that stress for an exact check.',
      ...(ok ? [] : ['Cumulative fatigue damage exceeds 1.0 — increase slab thickness or flexural strength.']),
    ],
  }
}
