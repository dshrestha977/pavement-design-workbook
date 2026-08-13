import { useState } from 'react'
import { useProject } from '@/store/project'
import { useAllResults } from '@/store/results'
import { Section, Stat, StatGrid, Button } from '@/components/ui'
import { ResultView } from '@/components/ResultView'
import { ComparisonBarChart } from '@/components/charts'
import { FileDown, FileSpreadsheet, Download } from 'lucide-react'

export default function ResultsPage() {
  const meta = useProject((s) => s.meta)
  const R = useAllResults()
  const [busy, setBusy] = useState<'pdf' | 'xlsx' | null>(null)

  // jsPDF, xlsx and html2canvas are ~600 kB and only needed once someone
  // exports, so they load on demand instead of in the initial bundle.
  async function exportPDF() {
    setBusy('pdf')
    try {
      const { exportProjectPDF } = await import('@/lib/export/pdf')
      exportProjectPDF({ meta, overview: R.overview, results: R.all })
    } finally {
      setBusy(null)
    }
  }

  async function exportXLSX() {
    setBusy('xlsx')
    try {
      const { exportProjectXLSX } = await import('@/lib/export/xlsx')
      exportProjectXLSX({ meta, overview: R.overview, results: R.all })
    } finally {
      setBusy(null)
    }
  }

  const comparison = R.flexible
    .filter((x) => x.result.totalThickness > 0)
    .map((x) => ({ name: x.title.replace('Flexible — ', ''), thickness: x.result.totalThickness }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Results &amp; report</h1>
          <p className="mt-1 text-sm text-muted">All designs side by side. Export a report or spreadsheet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportPDF}>
            <FileDown size={16} /> {busy === 'pdf' ? 'Preparing…' : 'Export PDF'}
          </Button>
          <Button variant="ghost" onClick={exportXLSX}>
            <FileSpreadsheet size={16} /> {busy === 'xlsx' ? 'Preparing…' : 'Export Excel'}
          </Button>
        </div>
      </div>

      <Section title="Design overview">
        <StatGrid cols={3}>
          {R.overview.map(([k, v]) => (
            <Stat key={k} label={k} value={v} />
          ))}
        </StatGrid>
      </Section>

      <Section title="Flexible methods — total thickness comparison" desc="Catalogue/SN methods (IRC 37 shown for the entered trial section).">
        <ComparisonBarChart data={comparison} />
      </Section>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Flexible pavement</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {R.flexible.map((r) => (
            <Section key={r.title} title={r.title.replace('Flexible — ', '')}>
              <ResultView result={r.result} />
            </Section>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Rigid pavement</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {R.rigid.map((r) => (
            <Section key={r.title} title={r.title.replace('Rigid — ', '')}>
              <ResultView result={r.result} />
            </Section>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Combined / overlay</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {R.combined.map((r) => (
            <Section key={r.title} title={r.title.replace('Combined — ', '')}>
              <ResultView result={r.result} />
            </Section>
          ))}
        </div>
      </div>

      <Section title="Standalone Excel workbook" desc="A self-contained .xlsx workbook with live formulas for offline use.">
        <p className="mb-3 text-sm text-muted">
          A self-contained workbook covering traffic, CBR, moduli and all design methods with built-in formulas and
          solver tables — usable entirely in Excel, no app required.
        </p>
        <a className="btn-ghost inline-flex" href="/downloads/Pavement-Design-Workbook.xlsx" download>
          <Download size={16} /> Download Pavement-Design-Workbook.xlsx
        </a>
      </Section>
    </div>
  )
}
