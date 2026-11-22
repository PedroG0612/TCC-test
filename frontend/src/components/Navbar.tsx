import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { AppNotification, NotificationPage } from '../types'

// Inline outline icons (same Heroicons-style stroke approach as Messages/Conexões).
const ICON_PATHS: Record<string, string> = {
  home: 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  inbox: 'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z',
  chat: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
  users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  briefcase: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z',
  sparkles: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
  building: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
}

function iconFor(to: string): string {
  if (to === '/' || to === '/home' || to === '/profile' || to === '/admin/profile') return 'home'
  if (to === '/jobs') return 'search'
  if (to === '/applications' || to === '/company/applications') return 'inbox'
  if (to === '/messages') return 'chat'
  if (to === '/connections') return 'users'
  if (to === '/matching' || to === '/company/matching') return 'sparkles'
  if (to === '/company/dashboard' || to === '/company/profile') return 'building'
  if (to.startsWith('/admin')) return 'chart'
  if (to.startsWith('/register')) return 'building'
  return 'briefcase'
}

function NavIcon({ to }: { to: string }) {
  const d = ICON_PATHS[iconFor(to)] ?? ICON_PATHS.briefcase
  return (
    <span className="flex h-7 w-7 items-center justify-center">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
    </span>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days} d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotificationPage | null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    api.get<NotificationPage>('/notifications/', { params: { page_size: 10 } })
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Poll unread count lightly; full list loads when the panel opens.
  useEffect(() => {
    if (!user) return
    load(true)
    const t = setInterval(() => load(true), 60_000)
    return () => clearInterval(t)
  }, [user, load])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null
  const unread = data?.unread_count ?? 0

  const openNotif = async (n: AppNotification) => {
    if (!n.is_read) {
      api.post(`/notifications/${n.id}/read/`).catch(() => {})
      setData((d) => d && {
        ...d,
        unread_count: Math.max(0, d.unread_count - 1),
        results: d.results.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      })
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    await api.post('/notifications/read-all/').catch(() => {})
    load(true)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        aria-label="Notificações"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notificações</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-semibold text-brand-600 hover:underline">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && !data ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Carregando…</p>
            ) : !data || data.results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma notificação.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.results.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotif(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${n.is_read ? '' : 'bg-brand-50/50'}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-slate-200' : 'bg-brand-500'}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                          {n.text}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {n.type_display} · {timeAgo(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const navItems = user
    ? [
        { to: '/home', label: 'Início' },
        ...(user.role === 'candidate'
          ? [
              { to: '/jobs', label: 'Buscar vagas' },
              { to: '/applications', label: 'Minhas candidaturas' },
              { to: '/messages', label: 'Mensagens' },
              { to: '/connections', label: 'Conexões' },
            ]
          : user.role === 'company'
            ? [
                { to: '/company/dashboard', label: 'Painel de vagas' },
                { to: '/company/applications', label: 'Candidaturas' },
                { to: '/company/matching', label: 'Matching' },
              ]
            : [
                { to: '/admin/dashboard', label: 'Painel' },
                { to: '/admin/users', label: 'Usuários' },
                { to: '/admin/jobs', label: 'Vagas' },
                { to: '/admin/applications', label: 'Candidaturas' },
                { to: '/admin/reports', label: 'Relatórios' },
              ]),
      ]
    : [
        { to: '/', label: 'Início' },
        { to: '/jobs', label: 'Buscar vagas' },
        { to: '/register?role=company', label: 'Para empresas' },
      ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setOpen(false)
  }

  const profileTo = user
    ? user.role === 'candidate'
      ? '/profile'
      : user.role === 'company'
        ? '/company/profile'
        : '/admin/profile'
    : '/login'

  const displayName = user
    ? user.role === 'company'
      ? user.company_profile?.company_name ?? user.first_name ?? user.username
      : user.first_name || user.username
    : ''

  const identityAvatar =
    user?.role === 'candidate'
      ? user.candidate_profile?.photo_url
      : user?.role === 'company'
        ? user.company_profile?.logo_url
        : null

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to={user ? '/home' : '/'} className="flex shrink-0 items-center">
          <img src="/logo.png" alt="Appliety" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                  isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <NavIcon to={item.to} />
                  <span className={`text-[11px] font-semibold leading-tight ${isActive ? 'text-brand-700' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && <span className="h-0.5 w-6 rounded-full bg-brand-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to={profileTo} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-slate-100">
                {identityAvatar ? (
                  <img src={identityAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-32 truncate text-sm font-semibold text-slate-800">{displayName}</span>
              </Link>
              <NotificationBell />
              <button onClick={handleLogout} className="btn-outline">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Entrar ↗</Link>
              <Link to="/register" className="btn-primary">Cadastrar</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {user && <NotificationBell />}
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <NavIcon to={item.to} />
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to={profileTo} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Meu perfil
                </Link>
                <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Entrar</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white">Cadastrar</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
