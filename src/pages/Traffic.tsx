import { useProject } from '@/store/project'
import { useDerived } from '@/store/derived'
import { Section, NumberField, Stat, StatGrid, Citations, InfoNote } from '@/components/ui'
import { TrafficGrowthChart } from '@/components/charts'
import { ircReliability } from '@/lib/constants'
import { fmt, fmtBig } from '@/lib/format'

export default function TrafficPage() {
  const traffic = useProject((s) => s.traffic)
  const patch = useProject((s) => s.patch)
  const d = useDerived()
  const reliability = ircReliability(d.traffic.msa)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Traffic analysis</h1>
        <p className="mt-1 text-sm text-muted">Cumulative design traffic in standard axles (ESAL / MSA) and ORN 31 traffic class.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Inputs" desc="Commercial-vehicle traffic and growth (IRC 37 / ORN method).">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Initial commercial vehicles / day" value={traffic.initialCVPD} onChange={(v) => patch('traffic', { initialCVPD: v })} hint="Both directions, at completion of construction" />
            <NumberField label="Traffic growth rate" unit="%" value={traffic.growthRatePct} onChange={(v) => patch('traffic', { growthRatePct: v })} />
            <NumberField label="Design life" unit="years" value={traffic.designLifeYears} onChange={(v) => patch('traffic', { designLifeYears: v })} />
            <NumberField label="Lane distribution factor D" value={traffic.laneDistributionFactor} onChange={(v) => patch('traffic', { laneDistributionFactor: v })} step={0.05} hint="Share of CVs in the design lane" />
            <NumberField label="Vehicle Damage Factor (VDF)" value={traffic.vdf} onChange={(v) => patch('traffic', { vdf: v })} step={0.1} hint="Standard axles per commercial vehicle" />
            <NumberField label="Directional distribution" value={traffic.directionalDistribution} onChange={(v) => patch('traffic', { directionalDistribution: v })} step={0.05} hint="For AASHTO ESAL split" />
          </div>
          <div className="mt-4">
            <InfoNote>
              IRC 37 design traffic: <span className="font-mono">N = 365·A·[((1+r)ⁿ−1)/r]·D·F</span>. Recommended reliability is{' '}
              <strong className="text-text">{reliability}%</strong> ({d.traffic.msa >= 20 ? '≥ 20 msa' : '< 20 msa'}).
            </InfoNote>
          </div>
        </Section>

        <Section title="Design traffic" desc="Live result, flows into all design methods.">
          <StatGrid cols={2}>
            <Stat label="Cumulative growth factor" value={fmt(d.traffic.growthFactor, 2)} />
            <Stat label="Cumulative standard axles" value={fmtBig(d.traffic.cumulativeESA)} unit="ESA" />
            <Stat label="Design traffic" value={fmt(d.traffic.msa, 2)} unit="msa" accent />
            <Stat label="ORN 31 traffic class" value={d.traffic.orn31Class + (d.traffic.orn31Exceeds ? ' (>T8)' : '')} accent />
          </StatGrid>
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Cumulative ESA over design life</div>
            <TrafficGrowthChart
              initialCVPD={traffic.initialCVPD}
              growthRatePct={traffic.growthRatePct}
              years={traffic.designLifeYears}
              laneFactor={traffic.laneDistributionFactor}
              vdf={traffic.vdf}
            />
          </div>
          <Citations items={[{ code: 'IRC:37-2018', clause: 'Cl. 5' }, { code: 'TRL ORN 31', clause: 'Traffic classes' }]} />
        </Section>
      </div>
    </div>
  )
}
