import { Link } from 'react-router-dom'
import type { Job } from '../types'
import { CATEGORY_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS, label } from '../lib/labels'
import { StatusBadge } from './StatusBadge'
import { CompanyLogo } from './CompanyLogo'

export function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null
  const fmt = (v: string) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: job.currency || 'BRL', maximumFractionDigits: 0 })
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`
  return job.salary_min ? `A partir de ${fmt(job.salary_min)}` : `Até ${fmt(job.salary_max!)}`
}

export function JobCard({ job, showStatus = false }: { job: Job; showStatus?: boolean }) {
  const salary = formatSalary(job)
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="card group flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompanyLogo name={job.company_name} logo={job.company_logo} />
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{job.title}</h3>
            <p className="text-sm text-slate-500">{job.company_name}</p>
          </div>
        </div>
        {showStatus && <StatusBadge status={job.status} />}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>📍 {job.location}</span>
        <span>{label(WORK_MODE_LABELS, job.work_mode)}</span>
        <span>{label(JOB_TYPE_LABELS, job.job_type)}</span>
        <span className="badge bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
          {label(CATEGORY_LABELS, job.category)}
        </span>
        {salary && <span className="font-medium text-brand-700">{salary}</span>}
      </div>

      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => (
            <span key={s.id} className="badge bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
              {s.name}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="badge bg-slate-100 text-slate-500">+{job.skills.length - 5}</span>
          )}
        </div>
      )}
    </Link>
  )
}
