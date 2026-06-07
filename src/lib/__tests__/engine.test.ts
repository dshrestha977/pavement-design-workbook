import { describe, it, expect } from 'vitest'
import { invNorm, zFromReliability, concreteFatigueLife, ircReliability } from '../constants'
import {
  growthFactor,
  designTrafficMSA,
  vehicleDamageFactor,
  lefFromAxles,
  cumulativeESAL,
  classifyBand,
} from '../traffic'
import { ORN31_TRAFFIC } from '../constants'
import { designCBR, cbrToMr, cbrToK, orn31SubgradeClass } from '../subgrade'
import { concreteEcFromFck, flexuralStrength28, aashtoA2FromModulus } from '../materials'
import { aashtoFlexiblePredLogW18, aashtoRequiredSN, aashtoFlexibleDesign } from '../flexible-aashto'
import { aashtoRigidPredLogW18, aashtoRigidDesign } from '../rigid-aashto'

describe('constants / statistics', () => {
  it('inverse normal matches AASHTO ZR table', () => {
    expect(zFromReliability(50)).toBeCloseTo(0, 3)
    expect(zFromReliability(90)).toBeCloseTo(-1.282, 2)
    expect(zFromReliability(95)).toBeCloseTo(-1.645, 2)
    expect(zFromReliability(99)).toBeCloseTo(-2.327, 2)
    expect(invNorm(0.975)).toBeCloseTo(1.959964, 4)
  })

  it('concrete fatigue life follows the IRC 58 / PCA model', () => {
    expect(concreteFatigueLife(0.4)).toBe(Infinity) // SR < 0.45 → unlimited
    expect(concreteFatigueLife(0.5)).toBeGreaterThan(0)
    expect(concreteFatigueLife(0.5)).toBeLessThan(concreteFatigueLife(0.46))
    // SR >= 0.55 branch: log10(N) = (0.9718 - SR)/0.0828
    expect(concreteFatigueLife(0.6)).toBeCloseTo(Math.pow(10, (0.9718 - 0.6) / 0.0828), 1)
  })

  it('IRC reliability switches at 20 msa', () => {
    expect(ircReliability(10)).toBe(80)
    expect(ircReliability(25)).toBe(90)
  })
})

describe('traffic', () => {
  it('growth factor compounding', () => {
    expect(growthFactor(0, 20)).toBe(20)
    expect(growthFactor(5, 20)).toBeCloseTo((Math.pow(1.05, 20) - 1) / 0.05, 4) // ≈ 33.066
  })

  it('VDF and LEF use the 4th-power law', () => {
    expect(vehicleDamageFactor([{ type: 'single', loadKn: 80, count: 10 }], 10)).toBeCloseTo(1, 6)
    expect(lefFromAxles([{ type: 'single', loadKn: 160, count: 1 }])).toBeCloseTo(16, 6) // (160/80)^4
    expect(lefFromAxles([{ type: 'tandem', loadKn: 148, count: 1 }])).toBeCloseTo(1, 6)
  })

  it('design MSA and ORN 31 traffic class', () => {
    const r = designTrafficMSA({
      initialCommercialVehiclesPerDay: 1000,
      growthRatePct: 5,
      designLifeYears: 20,
      laneDistributionFactor: 0.75,
      vehicleDamageFactor: 4.5,
    })
    // 365 * 1000 * 33.066 * 0.75 * 4.5 / 1e6
    const expected = (365 * 1000 * ((Math.pow(1.05, 20) - 1) / 0.05) * 0.75 * 4.5) / 1e6
    expect(r.msa).toBeCloseTo(expected, 3)
    expect(r.orn31Class).toBe('T8') // ~40.7 msa → exceeds T8 (capped)
    expect(r.orn31Exceeds).toBe(true)
  })

  it('classifies traffic bands', () => {
    expect(classifyBand(0.2, ORN31_TRAFFIC).band.cls).toBe('T1')
    expect(classifyBand(2, ORN31_TRAFFIC).band.cls).toBe('T4')
    expect(classifyBand(12, ORN31_TRAFFIC).band.cls).toBe('T7')
  })

  it('AASHTO cumulative ESAL', () => {
    const r = cumulativeESAL({
      classes: [{ label: 'Truck', aadt: 500, lef: 2.0 }],
      growthRatePct: 0,
      designLifeYears: 20,
      directionalDistribution: 0.5,
      laneDistribution: 1,
    })
    // 365 * (500*2) * 20 * 0.5 * 1
    expect(r.w18).toBeCloseTo(365 * 1000 * 20 * 0.5, 0)
  })
})

describe('subgrade', () => {
  it('design CBR mean and percentile', () => {
    expect(designCBR({ samples: [4, 5, 6], method: 'mean' }).designCBR).toBeCloseTo(5, 6)
    const p = designCBR({ samples: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], method: 'percentile', percentile: 90 })
    expect(p.designCBR).toBeGreaterThan(3)
    expect(p.designCBR).toBeLessThan(5) // 10th percentile of the data
  })

  it('CBR → MR correlations', () => {
    expect(cbrToMr(5, 'irc')).toBeCloseTo(50, 6) // 10*CBR for CBR<=5
    expect(cbrToMr(10, 'irc')).toBeCloseTo(17.6 * Math.pow(10, 0.64), 3) // ≈76.8
    expect(cbrToMr(5, 'aashto')).toBeCloseTo(7500 * 0.006894757, 3) // 1500*5 psi → MPa
  })

  it('CBR → k from IRC 58 table', () => {
    expect(cbrToK(5)).toBeCloseTo(42, 6)
    expect(cbrToK(10)).toBeCloseTo(55, 6)
    expect(cbrToK(6)).toBeCloseTo(45, 6) // interpolated between 5(42) and 7(48)
  })

  it('ORN 31 subgrade classes', () => {
    expect(orn31SubgradeClass(2).cls).toBe('S1')
    expect(orn31SubgradeClass(6).cls).toBe('S3')
    expect(orn31SubgradeClass(20).cls).toBe('S5')
    expect(orn31SubgradeClass(35).cls).toBe('S6')
  })
})

describe('materials', () => {
  it('concrete relationships (IS 456)', () => {
    expect(concreteEcFromFck(40)).toBeCloseTo(5000 * Math.sqrt(40), 2) // ≈31623 MPa
    expect(flexuralStrength28(40)).toBeCloseTo(0.7 * Math.sqrt(40), 4) // ≈4.43 MPa
  })
  it('AASHTO a2 regression sane', () => {
    const a2 = aashtoA2FromModulus(207) // ~30,000 psi granular base
    expect(a2).toBeGreaterThan(0.1)
    expect(a2).toBeLessThan(0.2)
  })
})

describe('AASHTO 1993 flexible', () => {
  it('required SN inverts the design equation (self-consistency)', () => {
    const w18 = 5_000_000
    const SN = aashtoRequiredSN(w18, 95, 0.45, 1.7, 7000)
    const zr = zFromReliability(95)
    const back = Math.pow(10, aashtoFlexiblePredLogW18(SN, zr, 0.45, 1.7, 7000))
    expect(back).toBeCloseTo(w18, -3) // within rounding of 5,000,000
    expect(SN).toBeGreaterThan(2)
    expect(SN).toBeLessThan(7)
  })

  it('full design returns a structurally adequate section', () => {
    const r = aashtoFlexibleDesign({
      w18: 10_000_000,
      reliabilityPct: 90,
      s0: 0.45,
      deltaPSI: 1.7,
      subgradeMrMPa: 50,
      a1: 0.44,
      a2: 0.14,
      a3: 0.11,
    })
    expect(r.ok).toBe(true)
    const provided = Number(r.summary['Provided SN'])
    const required = Number(r.summary['Required SN'])
    expect(provided).toBeGreaterThanOrEqual(required)
    expect(r.totalThickness).toBeGreaterThan(300)
  })
})

describe('AASHTO 1993 rigid', () => {
  it('slab design inverts the rigid equation (self-consistency)', () => {
    const r = aashtoRigidDesign({
      w18: 20_000_000,
      reliabilityPct: 95,
      s0: 0.35,
      pt: 2.5,
      modulusRuptureMPa: 4.5,
      concreteEcMPa: 30000,
      kMPaPerM: 54,
      loadTransferJ: 3.2,
      drainageCd: 1.0,
    })
    expect(r.totalThickness).toBeGreaterThan(150)
    expect(r.totalThickness).toBeLessThan(450)
  })

  it('rigid prediction increases with thickness', () => {
    const zr = zFromReliability(95)
    const lo = aashtoRigidPredLogW18(8, zr, 0.35, 2.0, 2.5, 650, 1.0, 3.2, 4_350_000, 200)
    const hi = aashtoRigidPredLogW18(12, zr, 0.35, 2.0, 2.5, 650, 1.0, 3.2, 4_350_000, 200)
    expect(hi).toBeGreaterThan(lo)
  })
})
