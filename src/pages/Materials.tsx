import { useProject } from '@/store/project'
import { Section, NumberField, Stat, StatGrid, Button } from '@/components/ui'
import {
  aashtoA1FromModulus,
  aashtoA2FromModulus,
  aashtoA3FromModulus,
  concreteEcFromFck,
  flexuralStrength28,
  flexuralStrength90,
} from '@/lib/materials'
import { round } from '@/lib/units'
import { fmt } from '@/lib/format'

export default function MaterialsPage() {
  const m = useProject((s) => s.materials)
  const patch = useProject((s) => s.patch)

  function estimateCoefficients() {
    patch('materials', {
      a1: round(aashtoA1FromModulus(m.acModulus), 3),
      a2: round(aashtoA2FromModulus(m.baseModulus), 3),
      a3: round(aashtoA3FromModulus(m.subbaseModulus), 3),
    })
  }

  function deriveConcrete() {
    const fcr28 = flexuralStrength28(m.fck)
    patch('materials', {
      concreteEc: round(concreteEcFromFck(m.fck), 0),
      flexuralStrength: round(flexuralStrength90(fcr28), 2),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Materials &amp; moduli</h1>
        <p className="mt-1 text-sm text-muted">Layer moduli, AASHTO structural-layer coefficients and concrete strength.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Layer moduli (MPa)" desc="Resilient / elastic moduli of bound and unbound layers.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Bituminous (AC) modulus" unit="MPa" value={m.acModulus} onChange={(v) => patch('materials', { acModulus: v })} />
            <NumberField label="Granular base modulus" unit="MPa" value={m.baseModulus} onChange={(v) => patch('materials', { baseModulus: v })} />
            <NumberField label="Granular sub-base modulus" unit="MPa" value={m.subbaseModulus} onChange={(v) => patch('materials', { subbaseModulus: v })} />
          </div>
        </Section>

        <Section title="AASHTO layer coefficients" desc="Per inch (a₁, a₂, a₃) and drainage (m₂, m₃).">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="a₁ (surface)" value={m.a1} step={0.01} onChange={(v) => patch('materials', { a1: v })} />
            <NumberField label="a₂ (base)" value={m.a2} step={0.01} onChange={(v) => patch('materials', { a2: v })} />
            <NumberField label="a₃ (sub-base)" value={m.a3} step={0.01} onChange={(v) => patch('materials', { a3: v })} />
            <NumberField label="m₂ (base drainage)" value={m.m2} step={0.05} onChange={(v) => patch('materials', { m2: v })} />
            <NumberField label="m₃ (sub-base drainage)" value={m.m3} step={0.05} onChange={(v) => patch('materials', { m3: v })} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={estimateCoefficients}>Estimate a₁,a₂,a₃ from moduli</Button>
            <span className="text-xs text-muted">AASHTO 1993 nomograph regressions</span>
          </div>
        </Section>

        <Section title="Concrete (rigid)" desc="Characteristic strength, elastic modulus and flexural strength.">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="fck" unit="MPa" value={m.fck} onChange={(v) => patch('materials', { fck: v })} />
            <NumberField label="Elastic modulus Ec" unit="MPa" value={m.concreteEc} onChange={(v) => patch('materials', { concreteEc: v })} />
            <NumberField label="Flexural strength (90-day)" unit="MPa" value={m.flexuralStrength} step={0.1} onChange={(v) => patch('materials', { flexuralStrength: v })} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={deriveConcrete}>Derive Ec &amp; flexural strength from fck</Button>
            <span className="text-xs text-muted">IS 456 / IRC 58</span>
          </div>
        </Section>

        <Section title="Derived preview">
          <StatGrid cols={2}>
            <Stat label="a₂ from base modulus" value={fmt(aashtoA2FromModulus(m.baseModulus), 3)} />
            <Stat label="a₃ from sub-base modulus" value={fmt(aashtoA3FromModulus(m.subbaseModulus), 3)} />
            <Stat label="Ec from fck" value={fmt(concreteEcFromFck(m.fck), 0)} unit="MPa" />
            <Stat label="Flexural (90-day) from fck" value={fmt(flexuralStrength90(flexuralStrength28(m.fck)), 2)} unit="MPa" />
          </StatGrid>
        </Section>
      </div>
    </div>
  )
}
