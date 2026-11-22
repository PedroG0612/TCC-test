import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 font-extrabold text-white">A</span>
            <span className="text-lg font-extrabold text-slate-900">Appliety</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            The smart job marketplace connecting companies and candidates through intelligent matching.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link className="hover:text-brand-600" to="/jobs">Find jobs</Link></li>
            <li><Link className="hover:text-brand-600" to="/register">Create account</Link></li>
            <li><Link className="hover:text-brand-600" to="/about">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">API</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><a className="hover:text-brand-600" href="/api/docs/" target="_blank" rel="noreferrer">Swagger docs</a></li>
            <li><a className="hover:text-brand-600" href="/api/schema/" target="_blank" rel="noreferrer">OpenAPI schema</a></li>
            <li><a className="hover:text-brand-600" href="/admin/" target="_blank" rel="noreferrer">Django admin</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Appliety — Recruitment & job marketplace
      </div>
    </footer>
  )
}
