/** Aggregates every design across all methods for the Results page and exports. */
import { useProject } from './project'
import { useDerived } from './derived'
import { aashtoFlexibleDesign, aashtoRequiredSN } from '@/lib/flexible-aashto'
import { irc37Check } from '@/lib/flexible-irc37'
import { orn31Design } from '@/lib/flexible-orn31'
import { dorNepalDesign } from '@/lib/flexible-dor'
import { aashtoRigidDesign } from '@/lib/rigid-aashto'
import { irc58Design } from '@/lib/rigid-irc58'
import { flexibleAsphaltOverlay, rigidAsphaltOverlay } from '@/lib/combined'
import { mpaToPsi } from '@/lib/units'
import { fmt } from '@/lib/format'
import type { DesignResult } from '@/lib/types'

export interface NamedResult {
  title: string
  result: DesignResult
}

export interface AllResults {
  overview: [string, string][]
  flexible: NamedResult[]
  rigid: NamedResult[]
  combined: NamedResult[]
  all: NamedResult[]
}

export function useAllResults(): AllResults {
  const d = useDerived()
  const m = useProject((s) => s.materials)
  const af = useProject((s) => s.aashtoFlex)
  const ar = useProject((s) => s.aashtoRigid)
  const irc = useProject((s) => s.irc37)
  const i58 = useProject((s) => s.irc58)
  const c = useProject((s) => s.combined)
  const meta = useProject((s) => s.meta)
  const traffic = useProject((s) => s.traffic)

  const w18 = Math.max(1, d.traffic.cumulativeESA)

  const dor = dorNepalDesign({ msa: d.traffic.msa, designCBR: d.designCBR })
  const orn = orn31Design({ cumulativeMsa: d.traffic.msa, designCBR: d.designCBR })
  const ircRes = irc37Check({
    msa: d.traffic.msa,
    epsilonTMicro: irc.epsilonT,
    epsilonVMicro: irc.epsilonV,
    bituminousModulusMPa: m.acModulus,
    Va: irc.Va,
    Vbe: irc.Vbe,
    reliability: irc.reliability === 0 ? undefined : irc.reliability,
    section: { acMm: irc.acMm, baseMm: irc.baseMm, subbaseMm: irc.subbaseMm },
  })
  const aashtoF = aashtoFlexibleDesign({
    w18,
    reliabilityPct: af.reliabilityPct,
    s0: af.s0,
    deltaPSI: af.p0 - af.pt,
    subgradeMrMPa: d.mr,
    baseMrMPa: m.baseModulus,
    subbaseMrMPa: m.subbaseModulus,
    a1: m.a1,
    a2: m.a2,
    a3: m.a3,
    m2: m.m2,
    m3: m.m3,
    minSurfaceMm: af.minSurfaceMm,
    minBaseMm: af.minBaseMm,
    minSubbaseMm: af.minSubbaseMm,
  })
  const aashtoR = aashtoRigidDesign({
    w18,
    reliabilityPct: ar.reliabilityPct,
    s0: ar.s0,
    p0: ar.p0,
    pt: ar.pt,
    modulusRuptureMPa: m.flexuralStrength,
    concreteEcMPa: m.concreteEc,
    kMPaPerM: d.k,
    loadTransferJ: ar.J,
    drainageCd: ar.Cd,
  })
  const irc58Res = irc58Design({
    slabThicknessMm: i58.slabThicknessMm,
    wheelLoadKn: i58.wheelLoadKn,
    tyrePressureMPa: i58.tyrePressureMPa,
    concreteEcMPa: m.concreteEc,
    modulusRuptureMPa: m.flexuralStrength,
    kMPaPerM: d.k,
    temperatureDifferentialC: i58.deltaT,
    slabLengthMm: i58.slabLengthMm,
    laneWidthMm: i58.laneWidthMm,
    axleRepetitions: i58.axleRepetitions,
    flexuralStressInputMPa: i58.feStress != null && i58.feStress > 0 ? i58.feStress : undefined,
  })
  const snReq = aashtoRequiredSN(w18, af.reliabilityPct, af.s0, af.p0 - af.pt, mpaToPsi(d.mr))
  const combinedRes =
    c.mode === 'flexible'
      ? flexibleAsphaltOverlay({ snRequired: snReq, snEffective: c.snEffective, overlayLayerCoeff: c.overlayCoeff })
      : rigidAsphaltOverlay({ slabRequiredMm: aashtoR.totalThickness, slabEffectiveMm: c.slabEffectiveMm })

  const overview: [string, string][] = [
    ['Road class', meta.roadClass],
    ['Designer', meta.designer || '—'],
    ['Design life (years)', String(traffic.designLifeYears)],
    ['Design traffic (msa)', fmt(d.traffic.msa, 2)],
    ['ORN 31 traffic class', d.traffic.orn31Class],
    ['Cumulative standard axles (ESA)', fmt(d.traffic.cumulativeESA, 0)],
    ['Design CBR (%)', `${fmt(d.designCBR, 1)} (${d.ornSubgrade.cls})`],
    ['Subgrade MR (MPa)', fmt(d.mr, 0)],
    ['k-value (MPa/m)', fmt(d.k, 0)],
  ]

  const flexible: NamedResult[] = [
    { title: 'Flexible — Nepal DoR 2021', result: dor },
    { title: 'Flexible — ORN 31', result: orn },
    { title: 'Flexible — IRC 37-2018', result: ircRes },
    { title: 'Flexible — AASHTO 93', result: aashtoF },
  ]
  const rigid: NamedResult[] = [
    { title: 'Rigid — IRC 58-2015', result: irc58Res },
    { title: 'Rigid — AASHTO 93', result: aashtoR },
  ]
  const combined: NamedResult[] = [
    { title: `Combined — ${c.mode === 'flexible' ? 'AC overlay (flexible)' : 'AC overlay (rigid)'}`, result: combinedRes },
  ]

  return { overview, flexible, rigid, combined, all: [...flexible, ...rigid, ...combined] }
}
