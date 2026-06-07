import type { DesignResult } from '@/lib/types'
import { Stat, StatGrid, ChecksList, Citations, Warnings, StatusBadge } from './ui'
import { CrossSection } from './CrossSection'
import { fmt } from '@/lib/format'

export function ResultView({ result, showSection = true }: { result: DesignResult; showSection?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">{result.method}</div>
          <div className="text-lg font-semibold text-text">{result.sectionLabel}</div>
        </div>
        <StatusBadge status={result.ok ? 'pass' : 'fail'}>{result.ok ? 'OK' : 'Revise'}</StatusBadge>
      </div>

      {showSection && result.layers.length > 0 && <CrossSection layers={result.layers} />}

      <StatGrid cols={2}>
        {Object.entries(result.summary).map(([k, v]) => (
          <Stat key={k} label={k} value={typeof v === 'number' ? fmt(v) : v} />
        ))}
      </StatGrid>

      <ChecksList checks={result.checks} />
      <Citations items={result.citations} />
      <Warnings items={result.warnings} />
    </div>
  )
}
