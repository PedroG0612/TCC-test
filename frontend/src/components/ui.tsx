import type { ReactNode } from 'react'

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">🔍</div>
      <p className="font-semibold text-slate-800">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

export function Field({
  label, error, children, hint,
}: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function StatCard({ label, value, accent }: { label: string; value: ReactNode; accent?: 'green' | 'violet' }) {
  const ring = accent === 'violet' ? 'bg-accent-50 text-accent-700' : 'bg-brand-50 text-brand-700'
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ring}`}>
        <span className="text-lg font-bold">{typeof value === 'number' ? value : '•'}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  )
}
