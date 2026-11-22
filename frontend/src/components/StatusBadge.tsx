const LABELS: Record<string, string> = {
  applied: 'Applied',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
}

const STYLES: Record<string, string> = {
  applied: 'bg-brand-50 text-brand-700 ring-brand-200',
  under_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  shortlisted: 'bg-accent-50 text-accent-700 ring-accent-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  hired: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  published: 'bg-brand-600 text-white ring-brand-600',
  closed: 'bg-slate-700 text-white ring-slate-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ring-1 ring-inset ${STYLES[status] ?? STYLES.draft}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
