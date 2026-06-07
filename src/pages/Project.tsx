import { useProject } from '@/store/project'
import { useDerived } from '@/store/derived'
import { Section, TextField, SelectField, Stat, InfoNote, Field } from '@/components/ui'
import { fmt } from '@/lib/format'

const ROAD_CLASSES = [
  'National Highway',
  'Strategic Road (SRN)',
  'Feeder Road',
  'Urban Road',
  'District Road',
  'Rural / Low-volume Road',
]

export default function ProjectPage() {
  const meta = useProject((s) => s.meta)
  const patch = useProject((s) => s.patch)
  const reset = useProject((s) => s.reset)
  const d = useDerived()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Pavement Design Workbook</h1>
        <p className="mt-1 text-sm text-muted">
          One-stop design for Nepal — traffic, CBR, moduli and Flexible / Rigid / Combined pavements using DoR 2021,
          ORN 31, IRC 37-2018, IRC 58-2015 and AASHTO 1993.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Design traffic" value={fmt(d.traffic.msa, 2)} unit="msa" accent />
        <Stat label="ORN 31 class" value={d.traffic.orn31Class} />
        <Stat label="Design CBR" value={fmt(d.designCBR, 1)} unit="%" />
        <Stat label="Subgrade MR" value={fmt(d.mr, 0)} unit="MPa" />
        <Stat label="k-value" value={fmt(d.k, 0)} unit="MPa/m" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Project details" desc="These appear on the printable report.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Project name" value={meta.name} onChange={(v) => patch('meta', { name: v })} />
              <TextField label="Client / Agency" value={meta.client} onChange={(v) => patch('meta', { client: v })} placeholder="e.g. Department of Roads" />
              <TextField label="Location" value={meta.location} onChange={(v) => patch('meta', { location: v })} />
              <TextField label="Designer" value={meta.designer} onChange={(v) => patch('meta', { designer: v })} />
              <Field label="Date">
                <input type="date" className="input" value={meta.date} onChange={(e) => patch('meta', { date: e.target.value })} />
              </Field>
              <SelectField
                label="Road class"
                value={meta.roadClass}
                onChange={(v) => patch('meta', { roadClass: v })}
                options={ROAD_CLASSES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div className="mt-4">
              <Field label="Notes">
                <textarea
                  className="input min-h-[80px]"
                  value={meta.notes}
                  onChange={(e) => patch('meta', { notes: e.target.value })}
                  placeholder="Design assumptions, references, remarks…"
                />
              </Field>
            </div>
            <div className="mt-4">
              <button className="btn-quiet" onClick={() => { if (confirm('Reset all inputs to defaults?')) reset() }}>
                Reset workbook to defaults
              </button>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <InfoNote>
            <strong className="text-text">Workflow</strong>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted">
              <li>Enter traffic → design ESAL / MSA</li>
              <li>Enter CBR samples → design CBR, MR, k</li>
              <li>Set material moduli & coefficients</li>
              <li>Design Flexible, Rigid or Combined</li>
              <li>Open Results → export PDF / Excel</li>
            </ol>
          </InfoNote>
          <Section title="Standards covered">
            <ul className="space-y-1.5 text-sm text-muted">
              <li>• Nepal DoR 2021 — Flexible Pavement Guidelines</li>
              <li>• TRL Overseas Road Note 31 (catalogue)</li>
              <li>• IRC 37-2018 — Flexible (M-E)</li>
              <li>• IRC 58-2015 — Rigid (jointed)</li>
              <li>• AASHTO 1993 — Flexible & Rigid</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}
