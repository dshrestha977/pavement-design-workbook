import { Section, InfoNote } from '@/components/ui'

const METHODS = [
  {
    code: 'Nepal DoR 2021',
    title: 'Guidelines for the Design of Flexible Pavement (2nd Rev.)',
    body: 'Nepal Department of Roads guideline built on IRC 37-2018, ORN 31 and Road Note 3. Selects a low-volume (surface-dressing) or IRC 37 track from the design traffic.',
  },
  {
    code: 'TRL ORN 31',
    title: 'Overseas Road Note 31 — structural catalogue',
    body: 'Traffic classes T1–T8 (cumulative ESA) × subgrade classes S1–S6 (CBR) select layer thicknesses from a catalogue (Chart 1 — granular road base shown). Widely used in Nepal.',
  },
  {
    code: 'IRC 37-2018',
    title: 'Flexible pavements — mechanistic-empirical',
    body: 'Design traffic N = 365·A·[((1+r)ⁿ−1)/r]·D·F (msa). Verified against fatigue Nf = C·k·(1/εt)^3.89·(1/MR)^0.854 and rutting Nr = k·(1/εv)^4.5337, with strains from IITPAVE.',
  },
  {
    code: 'IRC 58-2015',
    title: 'Plain jointed rigid pavements',
    body: 'Radius of relative stiffness, Westergaard load stress (or IITRIGID FE input), Bradbury temperature warping stress, concrete fatigue (stress ratio) and cumulative fatigue damage, with dowel- and tie-bar design.',
  },
  {
    code: 'AASHTO 1993',
    title: 'Flexible (SN) & rigid (slab) design',
    body: 'Empirical equations solved for the structural number SN (flexible) and slab thickness D (rigid) from W18, reliability ZR, S0, ΔPSI and subgrade support (MR / k).',
  },
]

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Methods &amp; about</h1>
        <p className="mt-1 text-sm text-muted">Standards implemented, key relationships and references.</p>
      </div>

      <InfoNote>
        <strong className="text-text">Disclaimer.</strong> PaveWorks is a design aid. Equation-based outputs (AASHTO SN/D,
        IRC 37 fatigue/rutting, IRC 58 stress &amp; CFD, traffic, MR, k) are computed exactly; catalogue thicknesses (ORN 31,
        DoR) are indicative and must be confirmed against the official charts/software (IITPAVE, IITRIGID) and the governing
        standard before construction.
      </InfoNote>

      <div className="grid gap-6 lg:grid-cols-2">
        {METHODS.map((m) => (
          <Section key={m.code} title={m.code} desc={m.title}>
            <p className="text-sm text-muted">{m.body}</p>
          </Section>
        ))}
      </div>

      <Section title="References">
        <ul className="space-y-1.5 text-sm text-muted">
          <li>• AASHTO. Guide for Design of Pavement Structures, 1993.</li>
          <li>• IRC:37-2018. Guidelines for the Design of Flexible Pavements. Indian Roads Congress.</li>
          <li>• IRC:58-2015. Guidelines for the Design of Plain Jointed Rigid Pavements for Highways.</li>
          <li>• TRL. Overseas Road Note 31 — A Guide to the Structural Design of Bitumen-surfaced Roads in Tropical and Sub-tropical Countries.</li>
          <li>• DoR Nepal. Guidelines for the Design of Flexible Pavement, 2nd Revision, 2021.</li>
          <li>• IS:456 — concrete modulus and flexural-strength relationships.</li>
        </ul>
      </Section>
    </div>
  )
}
