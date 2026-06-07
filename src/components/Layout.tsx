import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Truck,
  Mountain,
  Boxes,
  Route,
  SquareStack,
  Combine,
  FileText,
  Info,
  Moon,
  Sun,
} from 'lucide-react'
import { useProject } from '@/store/project'

const NAV = [
  { to: '/', label: 'Project', icon: LayoutDashboard, end: true },
  { to: '/traffic', label: 'Traffic', icon: Truck },
  { to: '/subgrade', label: 'Subgrade & CBR', icon: Mountain },
  { to: '/materials', label: 'Materials', icon: Boxes },
  { to: '/flexible', label: 'Flexible', icon: Route },
  { to: '/rigid', label: 'Rigid', icon: SquareStack },
  { to: '/combined', label: 'Combined / Overlay', icon: Combine },
  { to: '/results', label: 'Results & Report', icon: FileText },
  { to: '/about', label: 'Methods & About', icon: Info },
]

function Logo() {
  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0B1220" />
      <polygon points="26,7 38,7 51,57 13,57" fill="#334155" />
      <g fill="#F4B400">
        <rect x="30.6" y="11" width="2.8" height="7" rx="1" />
        <rect x="30.2" y="24" width="3.6" height="8.5" rx="1.2" />
        <rect x="29.6" y="40" width="4.8" height="11" rx="1.4" />
      </g>
    </svg>
  )
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-border bg-surface md:w-60">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-3 md:px-5">
        <Logo />
        <div className="hidden leading-tight md:block">
          <div className="font-bold text-text">PaveWorks</div>
          <div className="text-[10px] uppercase tracking-wider text-muted">Pavement Design</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2 md:p-3">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            title={n.label}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition md:px-3',
                isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <n.icon size={18} className="shrink-0" />
            <span className="hidden md:inline">{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="hidden border-t border-border p-3 text-[10px] leading-relaxed text-muted md:block">
        Nepal DoR · ORN 31 · IRC 37/58 · AASHTO 93
      </div>
    </aside>
  )
}

function Topbar() {
  const name = useProject((s) => s.meta.name)
  const patch = useProject((s) => s.patch)
  const theme = useProject((s) => s.theme)
  const toggleTheme = useProject((s) => s.toggleTheme)
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-6">
      <input
        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-text outline-none placeholder:text-muted"
        value={name}
        placeholder="Project name"
        onChange={(e) => patch('meta', { name: e.target.value })}
        aria-label="Project name"
      />
      <div className="flex items-center gap-2">
        <NavLink to="/results" className="btn-accent hidden sm:inline-flex">
          <FileText size={16} />
          Report
        </NavLink>
        <button className="btn-ghost px-2.5" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}

export function Layout() {
  const theme = useProject((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-muted sm:px-6">
          PaveWorks — comprehensive pavement design workbook for Nepal. Verify all designs against the governing
          standard before construction.
        </footer>
      </div>
    </div>
  )
}
