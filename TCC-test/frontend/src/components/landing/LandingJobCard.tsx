import { Bookmark, Briefcase, Clock, MapPin } from 'lucide-react'
import { ApplietyLogo } from '../ApplietyLogo'
import { CompanyLogo } from '../CompanyLogo'

export interface LandingJobItem {
  id: string | number
  title: string
  companyName: string
  companyLogoUrl?: string | null
  location: string
  contractType: string
  workMode: string
  isSample?: boolean
  realJobId?: number
  verified?: boolean
}

interface LandingJobCardProps {
  job: LandingJobItem
  isSaved: boolean
  saving?: boolean
  onToggleSave: (job: LandingJobItem) => void
  onApply: (job: LandingJobItem) => void
}

function BrandMark({
  companyName,
  companyLogoUrl,
}: {
  companyName: string
  companyLogoUrl?: string | null
}) {
  if (companyLogoUrl) {
    return <CompanyLogo name={companyName} logo={companyLogoUrl} size="md" />
  }

  const key = companyName.trim().toLowerCase()

  if (key === 'appliety') {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
        <ApplietyLogo variant="icon" size="md" />
      </div>
    )
  }

  if (key === 'google') {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
        <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
          />
        </svg>
      </div>
    )
  }

  if (key === 'microsoft') {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
        <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="2" width="9.2" height="9.2" fill="#F25022" />
          <rect x="12.8" y="2" width="9.2" height="9.2" fill="#7FBA00" />
          <rect x="2" y="12.8" width="9.2" height="9.2" fill="#00A4EF" />
          <rect x="12.8" y="12.8" width="9.2" height="9.2" fill="#FFB900" />
        </svg>
      </div>
    )
  }

  if (key === 'amazon') {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
        <svg className="h-8 w-8" viewBox="0 0 36 24" fill="none" aria-hidden="true">
          <path
            d="M4 11.5C11.5 17 22.5 17.5 30.5 12"
            stroke="#FF9900"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M27.2 10.6L31.4 11.5L29.6 15.6"
            stroke="#FF9900"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  return <CompanyLogo name={companyName} logo={null} size="md" />
}

export function LandingJobCard({
  job,
  isSaved,
  saving = false,
  onToggleSave,
  onApply,
}: LandingJobCardProps) {
  return (
    <article className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(16,24,40,0.03)] transition-all duration-200 hover:border-[#0756D7]/35 hover:shadow-[0_10px_28px_rgba(11,85,185,0.08)] sm:flex-row sm:items-center">
      {/* Left + Center: Brand icon + Job Details */}
      <div className="flex min-w-0 items-start gap-4 sm:items-center">
        <BrandMark companyName={job.companyName} companyLogoUrl={job.companyLogoUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[16px] font-bold text-[#101828] transition-colors group-hover:text-[#0756D7]">
              {job.title}
            </h3>
            {job.isSample && (
              <span className="text-[11px] font-medium text-[#596780]">· Preview</span>
            )}
          </div>

          {/* Company + verified check */}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-sm font-medium text-[#596780]">{job.companyName}</span>
            {job.verified !== false && (
              <svg
                className="h-4 w-4 shrink-0 text-[#0756D7]"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-label="Verified company"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Inline metadata with · separators (Zero-pill discipline) */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#596780]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#596780]/80" strokeWidth={2} />
              {job.location}
            </span>
            <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-[#596780]/80" strokeWidth={2} />
              {job.contractType}
            </span>
            <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#596780]/80" strokeWidth={2} />
              {job.workMode}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Bookmark + Apply CTA */}
      <div className="flex items-center justify-end gap-3 shrink-0 sm:pl-2">
        <button
          type="button"
          onClick={() => onToggleSave(job)}
          disabled={saving}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0756D7] ${
            isSaved
              ? 'bg-[#EAF1FF] text-[#0756D7]'
              : 'text-[#596780] hover:bg-[#F7F9FD] hover:text-[#101828]'
          }`}
        >
          <Bookmark
            className="h-[18px] w-[18px]"
            strokeWidth={1.9}
            fill={isSaved ? 'currentColor' : 'none'}
          />
        </button>

        <button
          type="button"
          onClick={() => onApply(job)}
          className="rounded-full bg-[#0756D7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_10px_rgba(7,86,215,0.2)] transition-all hover:bg-[#0B55B9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0756D7] focus-visible:ring-offset-2 whitespace-nowrap"
        >
          Apply now
        </button>
      </div>
    </article>
  )
}
