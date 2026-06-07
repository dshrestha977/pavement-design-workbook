import { useState } from 'react'
import { useProject } from '@/store/project'
import { useDerived } from '@/store/derived'
import { Section, NumberField, SelectField, Tabs, InfoNote } from '@/components/ui'
import { ResultView } from '@/components/ResultView'
import { aashtoFlexibleDesign } from '@/lib/flexible-aashto'
import { irc37Check } from '@/lib/flexible-irc37'
import { orn31Design } from '@/lib/flexible-orn31'
import { dorNepalDesign } from '@/lib/flexible-dor'
import { fmt } from '@/lib/format'

type Tab = 'dor' | 'orn31' | 'irc37' | 'aashto'

export default function FlexiblePage() {
  const [tab, setTab] = useState<Tab>('dor')
  const d = useDerived()
  const materials = useProject((s) => s.materials)
  const af = useProject((s) => s.aashtoFlex)
  const irc = useProject((s) => s.irc37)
  const patch = useProject((s) => s.patch)

  const aashto = aashtoFlexibleDesign({
    w18: Math.max(1, d.traffic.cumulativeESA),
    reliabilityPct: af.reliabilityPct,
    s0: af.s0,
    deltaPSI: af.p0 - af.pt,
    subgradeMrMPa: d.mr,
    baseMrMPa: materials.baseModulus,
    subbaseMrMPa: materials.subbaseModulus,
    a1: materials.a1,
    a2: materials.a2,
    a3: materials.a3,
    m2: materials.m2,
    m3: materials.m3,
    minSurfaceMm: af.minSurfaceMm,
    minBaseMm: af.minBaseMm,
    minSubbaseMm: af.minSubbaseMm,
  })
  const ircRes = irc37Check({
    msa: d.traffic.msa,
    epsilonTMicro: irc.epsilonT,
    epsilonVMicro: irc.epsilonV,
    bituminousModulusMPa: materials.acModulus,
    Va: irc.Va,
    Vbe: irc.Vbe,
    reliability: irc.reliability === 0 ? undefined : irc.reliability,
    section: { acMm: irc.acMm, baseMm: irc.baseMm, subbaseMm: irc.subbaseMm },
  })
  const orn = orn31Design({ cumulativeMsa: d.traffic.msa, designCBR: d.designCBR })
  const dor = dorNepalDesign({ msa: d.traffic.msa, designCBR: d.designCBR })

  const derivedNote = (
    <InfoNote>
      Using <strong className="text-text">{fmt(d.traffic.msa, 2)} msa</strong> ({d.traffic.orn31Class}) and design CBR{' '}
      <strong className="text-text">{fmt(d.designCBR, 1)}%</strong> ({d.ornSubgrade.cls}) from the Traffic and Subgrade tabs.
    </InfoNote>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Flexible pavement</h1>
        <p className="mt-1 text-sm text-muted">Design by Nepal DoR 2021, ORN 31, IRC 37-2018 or AASHTO 1993.</p>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'dor', label: 'Nepal DoR 2021' },
          { value: 'orn31', label: 'ORN 31' },
          { value: 'irc37', label: 'IRC 37-2018' },
          { value: 'aashto', label: 'AASHTO 93' },
        ]}
      />

      {tab === 'dor' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Nepal DoR 2021 — inputs">{derivedNote}<p className="mt-3 text-sm text-muted">This method derives its section from the design traffic and subgrade CBR. Adjust those in the Traffic and Subgrade tabs.</p></Section>
          <Section title="Design result"><ResultView result={dor} /></Section>
        </div>
      )}

      {tab === 'orn31' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="ORN 31 — inputs">{derivedNote}<p className="mt-3 text-sm text-muted">Catalogue design (Chart 1 — granular road base). Traffic class and subgrade class are determined automatically.</p></Section>
          <Section title="Design result"><ResultView result={orn} /></Section>
        </div>
      )}

      {tab === 'irc37' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="IRC 37-2018 — mechanistic check" desc="Strains εt, εv from IITPAVE layered-elastic analysis.">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="εt (tensile, bottom of AC)" unit="µε" value={irc.epsilonT} onChange={(v) => patch('irc37', { epsilonT: v })} />
              <NumberField label="εv (vertical, top of subgrade)" unit="µε" value={irc.epsilonV} onChange={(v) => patch('irc37', { epsilonV: v })} />
              <NumberField label="Air voids Va" unit="%" value={irc.Va} step={0.1} onChange={(v) => patch('irc37', { Va: v })} />
              <NumberField label="Effective bitumen Vbe" unit="%" value={irc.Vbe} step={0.1} onChange={(v) => patch('irc37', { Vbe: v })} />
              <SelectField label="Reliability" value={irc.reliability} onChange={(v) => patch('irc37', { reliability: v })} options={[{ value: 0, label: 'Auto (from msa)' }, { value: 80, label: '80%' }, { value: 90, label: '90%' }]} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <NumberField label="AC thickness" unit="mm" value={irc.acMm} onChange={(v) => patch('irc37', { acMm: v })} />
              <NumberField label="Base thickness" unit="mm" value={irc.baseMm} onChange={(v) => patch('irc37', { baseMm: v })} />
              <NumberField label="Sub-base thickness" unit="mm" value={irc.subbaseMm} onChange={(v) => patch('irc37', { subbaseMm: v })} />
            </div>
          </Section>
          <Section title="Design result"><ResultView result={ircRes} /></Section>
        </div>
      )}

      {tab === 'aashto' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="AASHTO 1993 — inputs" desc="Structural Number method.">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Reliability" unit="%" value={af.reliabilityPct} onChange={(v) => patch('aashtoFlex', { reliabilityPct: v })} />
              <NumberField label="Overall std. dev. S₀" value={af.s0} step={0.01} onChange={(v) => patch('aashtoFlex', { s0: v })} />
              <NumberField label="Initial serviceability p₀" value={af.p0} step={0.1} onChange={(v) => patch('aashtoFlex', { p0: v })} />
              <NumberField label="Terminal serviceability pt" value={af.pt} step={0.1} onChange={(v) => patch('aashtoFlex', { pt: v })} />
              <NumberField label="Min surface" unit="mm" value={af.minSurfaceMm} onChange={(v) => patch('aashtoFlex', { minSurfaceMm: v })} />
              <NumberField label="Min base" unit="mm" value={af.minBaseMm} onChange={(v) => patch('aashtoFlex', { minBaseMm: v })} />
            </div>
            <div className="mt-4">{derivedNote}</div>
          </Section>
          <Section title="Design result"><ResultView result={aashto} /></Section>
        </div>
      )}
    </div>
  )
}
