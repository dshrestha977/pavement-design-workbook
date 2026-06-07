import { describe, it, expect } from 'vitest'
import { irc37CFactor, irc37AllowableFatigue, irc37AllowableRutting, irc37Check } from '../flexible-irc37'
import { orn31Design } from '../flexible-orn31'
import { dorNepalDesign } from '../flexible-dor'
import {
  radiusOfRelativeStiffness,
  equivalentRadius,
  bradburyCoefficient,
  westergaardEdgeStress,
  tieBarDesign,
  irc58Design,
} from '../rigid-irc58'
import { flexibleAsphaltOverlay, rigidAsphaltOverlay, effectiveSN } from '../combined'

describe('IRC:37-2018 flexible (M-E)', () => {
  it('C factor matches the IRC worked example (Va=3, Vbe=10.2)', () => {
    const C = irc37CFactor(3, 10.2)
    expect(C).toBeCloseTo(Math.pow(10, 4.84 * (10.2 / 13.2 - 0.69)), 4) // ≈2.52
  })

  it('allowable life decreases with strain', () => {
    const C = irc37CFactor(3, 11.5)
    expect(irc37AllowableFatigue(150, 3000, 90, C)).toBeGreaterThan(irc37AllowableFatigue(250, 3000, 90, C))
    expect(irc37AllowableRutting(300, 90)).toBeGreaterThan(irc37AllowableRutting(450, 90))
  })

  it('check flags failure when strains are too high for the traffic', () => {
    const low = irc37Check({ msa: 5, epsilonTMicro: 120, epsilonVMicro: 250, bituminousModulusMPa: 3000 })
    const high = irc37Check({ msa: 50, epsilonTMicro: 300, epsilonVMicro: 500, bituminousModulusMPa: 3000 })
    expect(low.ok).toBe(true)
    expect(high.ok).toBe(false)
  })
})

describe('ORN 31 catalogue', () => {
  it('reproduces the documented T3/S3 anchor (200 base / 225 sub-base)', () => {
    const r = orn31Design({ cumulativeMsa: 1.0, designCBR: 5 })
    expect(r.summary['Traffic class']).toBe('T3')
    expect(r.summary['Subgrade class']).toBe('S3')
    expect(r.summary['Road base (mm)']).toBe(200)
    expect(r.summary['Sub-base (mm)']).toBe(225)
  })

  it('uses structural surfacing and warns for T7/T8', () => {
    const r = orn31Design({ cumulativeMsa: 12, designCBR: 10 })
    expect(r.summary['Traffic class']).toBe('T7')
    expect(r.warnings.join(' ')).toMatch(/T7\/T8/)
  })
})

describe('Nepal DoR 2021 flexible', () => {
  it('selects the low-volume track below 2 msa', () => {
    const r = dorNepalDesign({ msa: 1, designCBR: 8 })
    expect(r.summary['Track']).toBe('Low-volume roads')
  })
  it('selects the IRC:37 track above 2 msa and scales with traffic', () => {
    const a = dorNepalDesign({ msa: 5, designCBR: 8 })
    const b = dorNepalDesign({ msa: 25, designCBR: 8 })
    expect(a.summary['Track']).toBe('IRC:37-2018')
    expect(Number(b.summary['Bituminous (mm)'])).toBeGreaterThan(Number(a.summary['Bituminous (mm)']))
  })
})

describe('IRC:58-2015 rigid', () => {
  it('radius of relative stiffness is in the expected range', () => {
    const l = radiusOfRelativeStiffness(30000, 250, 0.15, 80)
    expect(l).toBeGreaterThan(780)
    expect(l).toBeLessThan(900)
  })
  it('Bradbury coefficient table', () => {
    expect(bradburyCoefficient(8)).toBeCloseTo(1.075, 3)
    expect(bradburyCoefficient(1)).toBe(0)
    expect(bradburyCoefficient(20)).toBe(1.0)
  })
  it('equivalent radius and edge stress are positive', () => {
    const b = equivalentRadius(150, 250)
    expect(b).toBeGreaterThan(0)
    const s = westergaardEdgeStress(50000, 250, 800, b)
    expect(s).toBeGreaterThan(0)
  })
  it('tie bar design returns a sensible spacing', () => {
    const t = tieBarDesign(250, 3.5)
    expect(t.areaPerMetreMm2).toBeGreaterThan(0)
    expect(t.spacingMm).toBeGreaterThan(0)
  })
  it('full design produces a stress ratio and CFD check', () => {
    const r = irc58Design({
      slabThicknessMm: 280,
      wheelLoadKn: 80,
      concreteEcMPa: 30000,
      modulusRuptureMPa: 4.5,
      kMPaPerM: 80,
      temperatureDifferentialC: 13,
      slabLengthMm: 4500,
      laneWidthMm: 3500,
      axleRepetitions: 1e5,
    })
    expect(Number(r.summary['Stress ratio'])).toBeGreaterThan(0)
    expect(r.checks.some((c) => c.label === 'Cumulative fatigue damage')).toBe(true)
  })
})

describe('combined / overlay', () => {
  it('flexible AC overlay from SN deficiency', () => {
    const r = flexibleAsphaltOverlay({ snRequired: 5.0, snEffective: 3.5, overlayLayerCoeff: 0.44 })
    expect(Number(r.summary['SN deficiency'])).toBeCloseTo(1.5, 2)
    expect(r.totalThickness).toBeGreaterThan(0)
  })
  it('rigid AC overlay from thickness deficiency', () => {
    const r = rigidAsphaltOverlay({ slabRequiredMm: 280, slabEffectiveMm: 220 })
    expect(r.totalThickness).toBeGreaterThan(0)
  })
  it('effective SN from existing layers', () => {
    const sn = effectiveSN([{ thicknessMm: 100, coeff: 0.44 }, { thicknessMm: 200, coeff: 0.14 }])
    expect(sn).toBeGreaterThan(0)
  })
})
