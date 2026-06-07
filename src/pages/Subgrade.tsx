import { useState } from 'react'
import { useProject } from '@/store/project'
import { useDerived } from '@/store/derived'
import { Section, NumberField, SelectField, Stat, StatGrid, Field, Citations, InfoNote } from '@/components/ui'
import { recommendedPercentile } from '@/lib/subgrade'
import { fmt } from '@/lib/format'

export default function SubgradePage() {
  const subgrade = useProject((s) => s.subgrade)
  const patch = useProject((s) => s.patch)
  const setSamples = useProject((s) => s.setSamples)
  const d = useDerived()
  const [raw, setRaw] = useState(subgrade.samples.join(', '))

  function applyRaw(v: string) {
    setRaw(v)
    const nums = v
      .split(/[\s,]+/)
      .map((x) => parseFloat(x))
      .filter((n) => isFinite(n) && n > 0)
    setSamples(nums)
  }

  const recPct = recommendedPercentile(d.traffic.msa)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Subgrade &amp; CBR</h1>
        <p className="mt-1 text-sm text-muted">Design CBR from test samples, resilient modulus MR, modulus of subgrade reaction k and ORN 31 subgrade class.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Inputs">
          <Field label="Soaked CBR test samples (%)" hint="Comma- or space-separated values">
            <textarea className="input min-h-[70px] font-mono" value={raw} onChange={(e) => applyRaw(e.target.value)} placeholder="4, 5, 5, 6, 7, 8" />
          </Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Design-CBR method"
              value={subgrade.method}
              onChange={(v) => patch('subgrade', { method: v })}
              options={[{ value: 'percentile', label: 'Percentile (exceedance)' }, { value: 'mean', label: 'Mean of samples' }]}
            />
            {subgrade.method === 'percentile' && (
              <NumberField label="Exceedance percentile" unit="%" value={subgrade.percentile} onChange={(v) => patch('subgrade', { percentile: v })} hint={`Recommended ≈ ${recPct}% for ${fmt(d.traffic.msa, 1)} msa`} />
            )}
            <SelectField
              label="MR – CBR correlation"
              value={subgrade.mrCorrelation}
              onChange={(v) => patch('subgrade', { mrCorrelation: v })}
              options={[{ value: 'irc', label: 'IRC 37 (17.6·CBR^0.64)' }, { value: 'aashto', label: 'AASHTO (1500·CBR psi)' }]}
            />
            <NumberField label="Manual design-CBR override" unit="%" value={subgrade.manualCBR ?? 0} onChange={(v) => patch('subgrade', { manualCBR: v > 0 ? v : null })} hint="0 = use samples above" />
          </div>
        </Section>

        <Section title="Design subgrade" desc="Flows into every design method.">
          <StatGrid cols={2}>
            <Stat label="Design CBR" value={fmt(d.designCBR, 1)} unit="%" accent />
            <Stat label="Source" value={d.cbrSource} />
            <Stat label="Resilient modulus MR" value={fmt(d.mr, 0)} unit="MPa" />
            <Stat label="k-value (rigid)" value={fmt(d.k, 0)} unit="MPa/m" />
            <Stat label="ORN 31 subgrade class" value={`${d.ornSubgrade.cls}`} accent />
            <Stat label="ORN class range" value={d.ornSubgrade.label} />
          </StatGrid>
          <div className="mt-4">
            <InfoNote>
              MR = 17.6·CBR<sup>0.64</sup> (IRC, CBR&gt;5); k interpolated from IRC 58 Table 2. Use the percentile method for higher-volume roads.
            </InfoNote>
          </div>
          <Citations items={[{ code: 'IRC:37-2018', clause: 'Cl. 6' }, { code: 'IRC:58-2015', clause: 'Table 2 (k)' }, { code: 'TRL ORN 31', clause: 'S1–S6' }]} />
        </Section>
      </div>
    </div>
  )
}
