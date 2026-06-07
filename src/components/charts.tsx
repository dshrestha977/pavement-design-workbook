import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const ACCENT = '#f4b400'
const AXIS = '#94a3b8'
const GRID = '#64748b33'

const tooltipStyle = {
  background: '#0b1220',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

export function TrafficGrowthChart({
  initialCVPD,
  growthRatePct,
  years,
  laneFactor,
  vdf,
}: {
  initialCVPD: number
  growthRatePct: number
  years: number
  laneFactor: number
  vdf: number
}) {
  const r = growthRatePct / 100
  const n = Math.max(1, Math.round(years))
  const data = []
  for (let y = 1; y <= n; y++) {
    const gf = r > 0 ? (Math.pow(1 + r, y) - 1) / r : y
    const esa = 365 * initialCVPD * gf * laneFactor * vdf
    data.push({ year: y, msa: esa / 1e6 })
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: AXIS }} stroke="#64748b55" />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} stroke="#64748b55" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} msa`, 'Cumulative']} labelFormatter={(l) => `Year ${l}`} />
        <Area type="monotone" dataKey="msa" stroke={ACCENT} strokeWidth={2} fill="url(#trafficGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ComparisonBarChart({ data }: { data: { name: string; thickness: number }[] }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * 46)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} stroke="#64748b55" unit=" mm" />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: AXIS }} stroke="#64748b55" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} mm`, 'Thickness']} cursor={{ fill: '#64748b18' }} />
        <Bar dataKey="thickness" fill={ACCENT} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
