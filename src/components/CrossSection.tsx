import type { PavementLayer } from '@/lib/types'
import { fmt } from '@/lib/format'

function colorFor(role: string): { fill: string; text: string } {
  const r = role.toLowerCase()
  if (r.includes('pqc') || r.includes('slab') || r.includes('concrete')) return { fill: '#d8dee9', text: '#0b1220' }
  if (r.includes('overlay')) return { fill: '#2b3442', text: '#e5e7eb' }
  if (r.includes('surfac') || r.includes('bitumin') || r.includes('asphalt') || r.includes('wearing') || r === 'surface (ac)')
    return { fill: '#1b2330', text: '#e5e7eb' }
  if (r.includes('sub-base') || r.includes('subbase') || r.includes('gsb') || r.includes('sub base'))
    return { fill: '#9aa6b6', text: '#0b1220' }
  if (r.includes('base') || r.includes('wmm') || r.includes('granular')) return { fill: '#6b7787', text: '#ffffff' }
  if (r.includes('capping')) return { fill: '#b08968', text: '#ffffff' }
  if (r.includes('existing')) return { fill: '#55606f', text: '#ffffff' }
  return { fill: '#8d6e63', text: '#ffffff' } // subgrade / foundation
}

export function CrossSection({ layers, title }: { layers: PavementLayer[]; title?: string }) {
  const structural = layers.filter((l) => l.thickness > 0)
  const subgrade = layers.find((l) => l.thickness === 0)
  const total = structural.reduce((s, l) => s + l.thickness, 0) || 1

  const W = 360
  const padX = 14
  const barW = 188
  const barX = padX
  const pxPerMm = Math.min(0.55, 250 / total)
  const subgradeBand = 46
  const H = total * pxPerMm + subgradeBand + 8

  let y = 4
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      {title && <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Pavement cross-section">
        <defs>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#8d6e63" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#6f5648" strokeWidth="3" />
          </pattern>
        </defs>
        {structural.map((l, i) => {
          const h = Math.max(7, l.thickness * pxPerMm)
          const c = colorFor(l.role)
          const rect = (
            <g key={i}>
              <rect x={barX} y={y} width={barW} height={h} fill={c.fill} stroke="#0b122055" strokeWidth="0.5" />
              {h >= 16 && (
                <text x={barX + barW / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={c.text}>
                  {l.thickness} mm
                </text>
              )}
              <text x={barX + barW + 10} y={y + Math.min(h / 2 + 4, 14)} fontSize="11" fill="rgb(var(--text))">
                {l.role}
                {l.modulus ? ` · ${fmt(l.modulus, 0)} MPa` : ''}
              </text>
              {h < 16 && (
                <text x={barX + barW + 10} y={y + Math.min(h / 2 + 4, 14) + 12} fontSize="10" fill="rgb(var(--muted))">
                  {l.thickness} mm
                </text>
              )}
            </g>
          )
          y += h
          return rect
        })}
        {/* lane marking on top surface */}
        <line x1={barX + 18} y1={5.5} x2={barX + barW - 18} y2={5.5} stroke="#f4b400" strokeWidth="1.4" strokeDasharray="10 8" />
        {/* subgrade */}
        <rect x={barX} y={y} width={barW} height={subgradeBand} fill="url(#hatch)" />
        <text x={barX + barW / 2} y={y + subgradeBand / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
          Subgrade
        </text>
        {subgrade && (
          <text x={barX + barW + 10} y={y + subgradeBand / 2 + 4} fontSize="11" fill="rgb(var(--muted))">
            {subgrade.material}
          </text>
        )}
      </svg>
      <div className="mt-1 text-right text-xs text-muted">
        Total structural thickness: <span className="font-mono font-semibold text-text">{total} mm</span>
      </div>
    </div>
  )
}
