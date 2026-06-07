import * as XLSX from 'xlsx'
import type { DesignResult } from '@/lib/types'
import type { ProjectMeta } from '@/store/project'

export interface XlsxResult {
  title: string
  result: DesignResult
}

export interface XlsxOptions {
  meta: ProjectMeta
  overview: [string, string][]
  results: XlsxResult[]
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 40) || 'project'
}

function sheetName(base: string, used: Set<string>): string {
  let name = base.replace(/[\\/?*[\]:]/g, '').slice(0, 28) || 'Sheet'
  let candidate = name
  let i = 1
  while (used.has(candidate)) {
    candidate = `${name.slice(0, 26)}_${i}`
    i++
  }
  used.add(candidate)
  return candidate
}

export function exportProjectXLSX(opts: XlsxOptions) {
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()

  const overview: (string | number)[][] = [
    ['PaveWorks — Pavement Design'],
    [opts.meta.name],
    [`${opts.meta.location || ''}  ${opts.meta.date}`],
    [],
    ['Parameter', 'Value'],
    ...opts.overview,
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), sheetName('Overview', used))

  for (const r of opts.results) {
    const aoa: (string | number)[][] = [[r.result.method], [r.result.sectionLabel], [`Status: ${r.result.ok ? 'OK' : 'REVISE'}`], [], ['Result', 'Value']]
    for (const [k, v] of Object.entries(r.result.summary)) aoa.push([k, typeof v === 'number' ? v : String(v)])
    aoa.push([], ['Check', 'Value', 'Limit', 'Unit', 'Status'])
    for (const c of r.result.checks) aoa.push([c.label, c.value, c.limit ?? '', c.unit ?? '', c.status])
    if (r.result.warnings.length) {
      aoa.push([], ['Notes'])
      for (const w of r.result.warnings) aoa.push([w])
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName(r.title, used))
  }

  XLSX.writeFile(wb, `${sanitize(opts.meta.name)}-pavement-designs.xlsx`)
}
