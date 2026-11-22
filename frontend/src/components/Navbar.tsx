import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HOME: Record<string, string> = {
  candidate: '/dashboard',
  company: '/company/dashboard',
  admin: '/admin/dashboard',
}

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const navItems = user
    ? [
        { to: ROLE_HOME[user.role] ?? '/dashboard', label: 'Dashboard' },
        ...(user.role === 'candidate' ? [{ to: '/jobs', label: 'Find jobs' }] : []),
        ...(user.role === 'company' ? [{ to: '/company/jobs', label: 'My vacancies' }] : []),
        ...(user.role === 'admin' ? [{ to: '/admin/users', label: 'Users' }] : []),
      ]
    : [
        { to: '/jobs', label: 'Find jobs' },
        { to: '/about', label: 'About' },
      ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 text-lg font-extrabold text-white">
            A
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Appliety
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to={user.role === 'candidate' ? '/profile' : user.role === 'company' ? '/company/profile' : '/admin/profile'} className="btn-ghost">
                {user.first_name || user.username}
              </Link>
              <button onClick={handleLogout} className="btn-outline">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {open ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
