import { useProject } from '@/store/project'
import { useDerived } from '@/store/derived'
import { Section, NumberField, Tabs, InfoNote } from '@/components/ui'
import { ResultView } from '@/components/ResultView'
import { aashtoRequiredSN } from '@/lib/flexible-aashto'
import { aashtoRigidDesign } from '@/lib/rigid-aashto'
import { flexibleAsphaltOverlay, rigidAsphaltOverlay } from '@/lib/combined'
import { mpaToPsi } from '@/lib/units'
import { fmt } from '@/lib/format'

export default function CombinedPage() {
  const d = useDerived()
  const materials = useProject((s) => s.materials)
  const af = useProject((s) => s.aashtoFlex)
  const ar = useProject((s) => s.aashtoRigid)
  const c = useProject((s) => s.combined)
  const patch = useProject((s) => s.patch)

  const snRequired = aashtoRequiredSN(Math.max(1, d.traffic.cumulativeESA), af.reliabilityPct, af.s0, af.p0 - af.pt, mpaToPsi(d.mr))
  const flexOverlay = flexibleAsphaltOverlay({ snRequired, snEffective: c.snEffective, overlayLayerCoeff: c.overlayCoeff })

  const rigidReq = aashtoRigidDesign({
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
  }).totalThickness
  const rigidOverlay = rigidAsphaltOverlay({ slabRequiredMm: rigidReq, slabEffectiveMm: c.slabEffectiveMm })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Combined / overlay design</h1>
        <p className="mt-1 text-sm text-muted">Strengthening overlays for existing pavements (AASHTO 1993 overlay method).</p>
      </div>

      <Tabs value={c.mode} onChange={(v) => patch('combined', { mode: v })} tabs={[{ value: 'flexible', label: 'AC overlay / flexible' }, { value: 'rigid', label: 'AC overlay / rigid' }]} />

      {c.mode === 'flexible' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="AC overlay over flexible pavement">
            <InfoNote>
              Required SN for future traffic = <strong className="text-text">{fmt(snRequired, 2)}</strong> (AASHTO, from {fmt(d.traffic.msa, 2)} msa &amp; MR {fmt(d.mr, 0)} MPa).
            </InfoNote>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField label="Effective SN of existing pavement" value={c.snEffective} step={0.1} onChange={(v) => patch('combined', { snEffective: v })} hint="From condition survey / FWD" />
              <NumberField label="Overlay layer coefficient a" value={c.overlayCoeff} step={0.01} onChange={(v) => patch('combined', { overlayCoeff: v })} />
            </div>
          </Section>
          <Section title="Overlay result"><ResultView result={flexOverlay} /></Section>
        </div>
      )}

      {c.mode === 'rigid' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="AC overlay over rigid pavement">
            <InfoNote>
              Required slab for future traffic = <strong className="text-text">{fmt(rigidReq, 0)} mm</strong> (AASHTO rigid).
            </InfoNote>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField label="Effective existing slab thickness" unit="mm" value={c.slabEffectiveMm} onChange={(v) => patch('combined', { slabEffectiveMm: v })} hint="From condition survey / NDT" />
            </div>
          </Section>
          <Section title="Overlay result"><ResultView result={rigidOverlay} /></Section>
        </div>
      )}
    </div>
  )
}
