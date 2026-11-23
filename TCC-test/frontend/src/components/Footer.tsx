import { Link } from 'react-router-dom'
import { ApplietyLogo } from './ApplietyLogo'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div>
          <ApplietyLogo variant="vertical" size="md" />
          <p className="mt-2 text-sm text-slate-500">Oportunidades e talentos conectados.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <Link className="hover:text-brand-600" to="/jobs">Buscar vagas</Link>
          <Link className="hover:text-brand-600" to="/register">Criar conta</Link>
          <span className="text-slate-300">|</span>
          <a className="hover:text-brand-600" href="/api/docs/" target="_blank" rel="noreferrer">Documentação da API ↗</a>
          <span className="text-slate-300">|</span>
          <span>Privacidade</span>
          <span>Termos de uso</span>
          <span>Ajuda ↗</span>
        </nav>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Appliety — Recrutamento e marketplace de vagas
      </div>
    </footer>
  )
}
