import { Link } from 'react-router-dom'
import { ApplietyLogo } from '../ApplietyLogo'

export function LandingFooter() {
  return (
    <footer className="mt-8 border-t border-[#E2E8F0] bg-[#F7F9FD]">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-3">
          {/* ESPAÇO DA LOGO NO FOOTER — componente definido em src/components/ApplietyLogo.tsx */}
          <Link to="/" className="focus:outline-none">
            <ApplietyLogo variant="vertical" size="md" />
          </Link>
          <p className="max-w-xs text-sm text-[#596780]">
            Intelligent job matching connecting emerging talent and leading technology teams.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-7 gap-y-2.5 text-sm font-medium text-[#596780]"
          aria-label="Footer navigation"
        >
          <Link to="/jobs" className="transition-colors hover:text-[#0756D7]">
            Browse jobs
          </Link>
          <Link to="/register?role=candidate" className="transition-colors hover:text-[#0756D7]">
            For candidates
          </Link>
          <Link to="/register?role=company" className="transition-colors hover:text-[#0756D7]">
            For companies
          </Link>
          <Link to="/login" className="transition-colors hover:text-[#0756D7]">
            Sign in
          </Link>
          <a
            href="/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-[#0756D7]"
          >
            API Docs
          </a>
        </nav>
      </div>

      <div className="border-t border-[#E2E8F0] bg-white py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-[#596780] sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Appliety. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-[#0756D7]">About</Link>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
