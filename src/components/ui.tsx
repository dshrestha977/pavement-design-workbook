import type { ReactNode } from 'react'
import clsx from 'clsx'
import { CheckCircle2, XCircle, AlertTriangle, Minus } from 'lucide-react'
import type { CheckStatus, DesignCheck, Citation } from '@/lib/types'
import { fmt } from '@/lib/format'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('card', className)}>{children}</div>
}

export function Section({
  title,
  desc,
  right,
  children,
}: {
  title: string
  desc?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="card-pad animate-fade-in">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  )
}

export function Field({
  label,
  unit,
  hint,
  children,
}: {
  label: string
  unit?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="label">
        {label}
        {unit && <span className="font-normal normal-case text-muted/70"> ({unit})</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted/70">{hint}</p>}
    </div>
  )
}

export function NumberField(props: {
  label: string
  value: number
  onChange: (n: number) => void
  unit?: string
  step?: number
  min?: number
  max?: number
  hint?: string
}) {
  return (
    <Field label={props.label} unit={props.unit} hint={props.hint}>
      <input
        type="number"
        className="input font-mono"
        value={Number.isFinite(props.value) ? props.value : ''}
        step={props.step ?? 'any'}
        min={props.min}
        max={props.max}
        onChange={(e) => props.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      />
    </Field>
  )
}

export function TextField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        type="text"
        className="input"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </Field>
  )
}

export function SelectField<T extends string | number>(props: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  hint?: string
}) {
  return (
    <Field label={props.label} hint={props.hint}>
      <select
        className="select"
        value={String(props.value)}
        onChange={(e) => {
          const opt = props.options.find((o) => String(o.value) === e.target.value)
          if (opt) props.onChange(opt.value)
        }}
      >
        {props.options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function Stat({ label, value, unit, accent }: { label: string; value: ReactNode; unit?: string; accent?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={clsx('stat-value', accent && 'text-accent')}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted">{unit}</span>}
      </div>
    </div>
  )
}

export function StatGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={clsx(
        'grid gap-3',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-2 sm:grid-cols-3',
        cols === 4 && 'grid-cols-2 sm:grid-cols-4',
      )}
    >
      {children}
    </div>
  )
}

const STATUS_MAP: Record<CheckStatus, { cls: string; Icon: typeof CheckCircle2; txt: string }> = {
  pass: { cls: 'badge-ok', Icon: CheckCircle2, txt: 'Pass' },
  fail: { cls: 'badge-danger', Icon: XCircle, txt: 'Fail' },
  warn: { cls: 'badge-warn', Icon: AlertTriangle, txt: 'Review' },
  na: { cls: 'badge-muted', Icon: Minus, txt: '—' },
}

export function StatusBadge({ status, children }: { status: CheckStatus; children?: ReactNode }) {
  const { cls, Icon, txt } = STATUS_MAP[status]
  return (
    <span className={cls}>
      <Icon size={13} />
      {children ?? txt}
    </span>
  )
}

export function ChecksList({ checks }: { checks: DesignCheck[] }) {
  if (checks.length === 0) return null
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {checks.map((c, i) => (
        <div key={i} className="flex items-center justify-between gap-3 bg-surface-2/40 px-4 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text">{c.label}</div>
            {c.note && <div className="truncate text-xs text-muted">{c.note}</div>}
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="font-mono text-sm text-muted">
              {fmt(c.value)}
              {c.limit !== undefined && <span className="text-muted/60"> / {fmt(c.limit)}</span>}
              {c.unit ? ` ${c.unit}` : ''}
            </span>
            <StatusBadge status={c.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Citations({ items }: { items: Citation[] }) {
  if (!items.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((c, i) => (
        <span key={i} className="badge-muted" title={c.note}>
          {c.code}
          {c.clause ? ` · ${c.clause}` : ''}
        </span>
      ))}
    </div>
  )
}

export function Warnings({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((w, i) => (
        <li key={i} className="flex gap-2 text-xs text-muted">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
          <span>{w}</span>
        </li>
      ))}
    </ul>
  )
}

export function Button({
  children,
  onClick,
  variant = 'accent',
  className,
  type,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'accent' | 'ghost' | 'quiet'
  className?: string
  type?: 'button' | 'submit'
}) {
  const v = variant === 'accent' ? 'btn-accent' : variant === 'ghost' ? 'btn-ghost' : 'btn-quiet'
  return (
    <button type={type ?? 'button'} className={clsx(v, className)} onClick={onClick}>
      {children}
    </button>
  )
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-text/90">
      {children}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2/50 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === t.value ? 'bg-accent text-slate-950 shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
