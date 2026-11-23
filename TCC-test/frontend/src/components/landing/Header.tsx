import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { ApplietyLogo } from '../ApplietyLogo'
import { useAuth } from '../../context/AuthContext'

export type LandingNavTab = 'jobs' | 'companies' | 'saved' | 'alerts'

interface HeaderProps {
  activeTab: LandingNavTab
  onSelectTab: (tab: LandingNavTab) => void
  onFocusSearch: () => void
  savedCount: number
}

const NAV_ITEMS: { id: LandingNavTab; label: string }[] = [
  { id: 'jobs', label: 'Jobs' },
  { id: 'companies', label: 'Companies' },
  { id: 'saved', label: 'Saved' },
  { id: 'alerts', label: 'Alerts' },
]

export function Header({
  activeTab,
  onSelectTab,
  onFocusSearch,
  savedCount,
}: HeaderProps) {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const dashboardPath =
    user?.role === 'company'
      ? '/company/dashboard'
      : user?.role === 'admin'
        ? '/admin/dashboard'
        : '/home'

  const displayName = user
    ? user.role === 'company'
      ? user.company_profile?.company_name ?? user.first_name ?? user.username
      : user.first_name || user.username
    : ''

  const handleNavClick = (tab: LandingNavTab) => {
    onSelectTab(tab)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* ESPAÇO DA LOGO NO HEADER — componente definido em src/components/ApplietyLogo.tsx */}
        <Link
          to="/"
          onClick={() => onSelectTab('jobs')}
          className="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0756D7] rounded-lg"
          aria-label="Appliety Home"
        >
          <ApplietyLogo variant="horizontal" size="md" />
        </Link>

        {/* Center: Clean horizontal navigation with active blue underline */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative flex h-20 items-center gap-1.5 text-sm font-semibold transition-colors focus:outline-none ${
                  isActive
                    ? 'text-[#101828]'
                    : 'text-[#596780] hover:text-[#101828]'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'saved' && savedCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EAF1FF] px-1.5 text-[11px] font-bold text-[#0756D7]">
                    {savedCount}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full bg-[#0756D7]"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: Search trigger + Auth CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onFocusSearch}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#596780] transition-colors hover:bg-[#EAF1FF] hover:text-[#0756D7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0756D7]"
            aria-label="Search jobs"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          <span className="h-5 w-px bg-[#E2E8F0]" aria-hidden="true" />

          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/jobs"
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#101828] transition-colors hover:bg-[#F7F9FD]"
              >
                Explore all
              </Link>
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0756D7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0B55B9]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span>Dashboard</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:border-[#0756D7]/40 hover:bg-[#F7F9FD]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-[#0756D7] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(7,86,215,0.22)] transition-all hover:bg-[#0B55B9]"
              >
                Create account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onFocusSearch}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#596780] hover:bg-[#EAF1FF] hover:text-[#0756D7]"
            aria-label="Search jobs"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#101828] hover:bg-[#F7F9FD]"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EAF1FF] text-[#0756D7]'
                      : 'text-[#596780] hover:bg-[#F7F9FD] hover:text-[#101828]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === 'saved' && savedCount > 0 && (
                    <span className="rounded-full bg-[#0756D7] px-2 py-0.5 text-xs font-bold text-white">
                      {savedCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#E2E8F0] pt-4">
            {user ? (
              <Link
                to={dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-[#0756D7] px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Go to Dashboard ({displayName})
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#101828]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-[#0756D7] px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
