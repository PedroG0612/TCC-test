import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark } from 'lucide-react'
import { LandingJobCard, type LandingJobItem } from './LandingJobCard'
import { PromoCard } from './PromoCard'

interface FeaturedJobsProps {
  jobs: LandingJobItem[]
  loading: boolean
  showingSavedOnly: boolean
  activeCompany: string | null
  hasSampleFallback: boolean
  savedIds: Set<string>
  savingId: string | null
  onToggleSave: (job: LandingJobItem) => void
  onApply: (job: LandingJobItem) => void
  onResetFilters: () => void
}

export function FeaturedJobs({
  jobs,
  loading,
  showingSavedOnly,
  activeCompany,
  hasSampleFallback,
  savedIds,
  savingId,
  onToggleSave,
  onApply,
  onResetFilters,
}: FeaturedJobsProps) {
  const heading = showingSavedOnly
    ? 'Saved Jobs'
    : activeCompany
      ? `Jobs at ${activeCompany}`
      : 'Featured Jobs'

  return (
    <section id="featured-jobs" className="bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
          {/* Left column (~72%): Featured Jobs header + cards */}
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#101828]">
                  {heading}
                </h2>
                {hasSampleFallback && !showingSavedOnly && !activeCompany && (
                  <p className="mt-1 text-xs text-[#596780]">
                    Featured showcase listings — sign in or browse all open roles in the marketplace.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {(showingSavedOnly || activeCompany) && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="text-sm font-semibold text-[#596780] hover:text-[#101828]"
                  >
                    Show all featured
                  </button>
                )}
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0756D7] underline-offset-4 hover:underline"
                >
                  <span>See all jobs</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3.5" aria-label="Loading jobs">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-[88px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-[#F7F9FD]"
                  />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F7F9FD] px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#0756D7]">
                  <Bookmark className="h-5 w-5" />
                </span>
                <p className="mt-3 text-base font-bold text-[#101828]">
                  {showingSavedOnly
                    ? 'No saved jobs yet'
                    : `No featured preview roles found for ${activeCompany}`}
                </p>
                <p className="mt-1 max-w-md text-sm text-[#596780]">
                  {showingSavedOnly
                    ? 'Tap the bookmark icon on any role to keep track of opportunities you like.'
                    : 'Try searching the full job directory or view all featured roles.'}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-sm font-semibold text-[#101828] hover:bg-slate-50"
                  >
                    Back to featured jobs
                  </button>
                  <Link
                    to={activeCompany ? `/jobs?q=${encodeURIComponent(activeCompany)}` : '/jobs'}
                    className="rounded-full bg-[#0756D7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0B55B9]"
                  >
                    Search full directory
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {jobs.map((job) => (
                  <LandingJobCard
                    key={String(job.id)}
                    job={job}
                    isSaved={savedIds.has(String(job.id))}
                    saving={savingId === String(job.id)}
                    onToggleSave={onToggleSave}
                    onApply={onApply}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right column (~28%): Promotional Card */}
          <PromoCard />
        </div>
      </div>
    </section>
  )
}
