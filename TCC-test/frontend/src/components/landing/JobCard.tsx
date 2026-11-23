import { Link } from 'react-router-dom'
import type { LandingJob } from './landingData'
import { ArrowRightIcon, CompanyMark } from './Icons'

export function JobCard({ job }: { job: LandingJob }) {
  const destination = job.liveJobId
    ? `/jobs/${job.liveJobId}`
    : `/jobs?q=${encodeURIComponent(job.searchQuery)}`

  return (
    <Link
      to={destination}
      className="group flex flex-col justify-between rounded-2xl border border-[#CBEBD8] bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-[#0B8F4D] hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8F4D]"
    >
      <div>
        {/* Top row: company mark + optional urgent indicator */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyMark logoKey={job.logoKey} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#0B8F4D]">
                {job.company}
              </p>
              <p className="truncate text-xs text-[#4A5A52]">
                {job.area} · {job.level}
              </p>
            </div>
          </div>

          {job.urgent && (
            <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              Urgente
            </span>
          )}
        </div>

        {/* Job Title */}
        <h3 className="mt-4 font-display text-lg font-bold leading-snug text-[#18221D] transition-colors group-hover:text-[#0B8F4D]">
          {job.title}
        </h3>

        {/* Metadata line: location · model · contract */}
        <p className="mt-1.5 text-sm text-[#4A5A52]">
          {job.location}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-[#CBEBD8] bg-[#E8F8EF] px-2.5 py-0.5 text-xs font-semibold text-[#064E2E]">
            {job.model}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {job.contract}
          </span>
        </div>
      </div>

      {/* Footer: Salary + subtle arrow */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
        <span className="text-sm font-bold text-[#18221D] tabular-nums">
          {job.salary}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B8F4D] transition-transform duration-150 group-hover:translate-x-0.5">
          Ver vaga
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}
