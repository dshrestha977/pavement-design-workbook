import { useState } from 'react'
import { useProject } from '@/store/project'
import { useDerived } from '@/store/derived'
import { Section, NumberField, Tabs, InfoNote } from '@/components/ui'
import { ResultView } from '@/components/ResultView'
import { aashtoRigidDesign } from '@/lib/rigid-aashto'
import { irc58Design } from '@/lib/rigid-irc58'
import { fmt } from '@/lib/format'

type Tab = 'irc58' | 'aashto'

export default function RigidPage() {
  const [tab, setTab] = useState<Tab>('irc58')
  const d = useDerived()
  const materials = useProject((s) => s.materials)
  const ar = useProject((s) => s.aashtoRigid)
  const i58 = useProject((s) => s.irc58)
  const patch = useProject((s) => s.patch)

  const aashto = aashtoRigidDesign({
    w18: Math.max(1, d.traffic.cumulativeESA),
    reliabilityPct: ar.reliabilityPct,
    s0: ar.s0,
    p0: ar.p0,
    pt: ar.pt,
    modulusRuptureMPa: materials.flexuralStrength,
    concreteEcMPa: materials.concreteEc,
    kMPaPerM: d.k,
    loadTransferJ: ar.J,
    drainageCd: ar.Cd,
  })
  const irc = irc58Design({
    slabThicknessMm: i58.slabThicknessMm,
    wheelLoadKn: i58.wheelLoadKn,
    tyrePressureMPa: i58.tyrePressureMPa,
    concreteEcMPa: materials.concreteEc,
    modulusRuptureMPa: materials.flexuralStrength,
    kMPaPerM: d.k,
    temperatureDifferentialC: i58.deltaT,
    slabLengthMm: i58.slabLengthMm,
    laneWidthMm: i58.laneWidthMm,
    axleRepetitions: i58.axleRepetitions,
    flexuralStressInputMPa: i58.feStress != null && i58.feStress > 0 ? i58.feStress : undefined,
  })

  const foundationNote = (
    <InfoNote>
      Foundation k = <strong className="text-text">{fmt(d.k, 0)} MPa/m</strong> (from design CBR {fmt(d.designCBR, 1)}%), concrete flexural strength{' '}
      <strong className="text-text">{fmt(materials.flexuralStrength, 2)} MPa</strong>. Edit on the Subgrade / Materials tabs.
    </InfoNote>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Rigid pavement</h1>
        <p className="mt-1 text-sm text-muted">Plain jointed concrete pavement by IRC 58-2015 or AASHTO 1993.</p>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'irc58', label: 'IRC 58-2015' }, { value: 'aashto', label: 'AASHTO 93' }]} />

      {tab === 'irc58' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="IRC 58-2015 — inputs" desc="Stress + cumulative fatigue damage for a trial slab.">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Trial slab thickness" unit="mm" value={i58.slabThicknessMm} onChange={(v) => patch('irc58', { slabThicknessMm: v })} />
              <NumberField label="Critical wheel/axle load" unit="kN" value={i58.wheelLoadKn} onChange={(v) => patch('irc58', { wheelLoadKn: v })} />
              <NumberField label="Tyre pressure" unit="MPa" value={i58.tyrePressureMPa} step={0.05} onChange={(v) => patch('irc58', { tyrePressureMPa: v })} />
              <NumberField label="Temperature differential ΔT" unit="°C" value={i58.deltaT} step={0.5} onChange={(v) => patch('irc58', { deltaT: v })} />
              <NumberField label="Slab length (joint spacing)" unit="mm" value={i58.slabLengthMm} onChange={(v) => patch('irc58', { slabLengthMm: v })} />
              <NumberField label="Lane width" unit="mm" value={i58.laneWidthMm} onChange={(v) => patch('irc58', { laneWidthMm: v })} />
              <NumberField label="Axle repetitions (this group)" value={i58.axleRepetitions} onChange={(v) => patch('irc58', { axleRepetitions: v })} />
              <NumberField label="FE load stress (IITRIGID, optional)" unit="MPa" value={i58.feStress ?? 0} step={0.05} onChange={(v) => patch('irc58', { feStress: v > 0 ? v : null })} hint="0 = use Westergaard estimate" />
            </div>
            <div className="mt-4">{foundationNote}</div>
          </Section>
          <Section title="Design result"><ResultView result={irc} /></Section>
        </div>
      )}

      {tab === 'aashto' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="AASHTO 1993 — inputs" desc="Solves required slab thickness D.">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Reliability" unit="%" value={ar.reliabilityPct} onChange={(v) => patch('aashtoRigid', { reliabilityPct: v })} />
              <NumberField label="Overall std. dev. S₀" value={ar.s0} step={0.01} onChange={(v) => patch('aashtoRigid', { s0: v })} />
              <NumberField label="Terminal serviceability pt" value={ar.pt} step={0.1} onChange={(v) => patch('aashtoRigid', { pt: v })} />
              <NumberField label="Load transfer J" value={ar.J} step={0.1} onChange={(v) => patch('aashtoRigid', { J: v })} hint="3.2 doweled · 2.7 tied shoulder · 3.8 undoweled" />
              <NumberField label="Drainage Cd" value={ar.Cd} step={0.05} onChange={(v) => patch('aashtoRigid', { Cd: v })} hint="0.80–1.20" />
            </div>
            <div className="mt-4">{foundationNote}</div>
          </Section>
          <Section title="Design result"><ResultView result={aashto} /></Section>
        </div>
      )}
    </div>
  )
}
