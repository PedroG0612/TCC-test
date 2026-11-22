import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Job } from '../types'
import { JobCard } from '../components/JobCard'
import { Spinner } from '../components/ui'

export function Landing() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.get('/jobs/', { params: { page_size: 6 } })
      .then(({ data }) => setJobs(data.results))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-700">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="badge bg-white/15 text-white ring-1 ring-inset ring-white/25">
              ✦ Smart matching for your career
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Find your next opportunity with{' '}
              <span className="bg-gradient-to-r from-brand-200 to-accent-200 bg-clip-text text-transparent">
                intelligent matching
              </span>
            </h1>
            <p className="mt-4 text-lg text-brand-50/90">
              Appliety connects companies and candidates through a modern marketplace
              with compatibility scoring, powerful search and application tracking.
            </p>
            <form
              className="mt-8 flex max-w-xl gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                window.location.href = `/jobs?q=${encodeURIComponent(query)}`
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, skill or company…"
                className="input flex-1 !rounded-full !border-0 !bg-white/95 text-slate-900 shadow-lg"
              />
              <button type="submit" className="btn-primary !rounded-full !px-6">
                Search
              </button>
            </form>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register?role=candidate" className="btn bg-white text-brand-700 hover:bg-brand-50">
                I'm a candidate
              </Link>
              <Link to="/register?role=company" className="btn border border-white/40 bg-white/10 text-white hover:bg-white/20">
                I'm hiring
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured opportunities</h2>
            <p className="mt-1 text-sm text-slate-500">Fresh vacancies from our partner companies</p>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No vacancies published yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">How Appliety works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: '🧑‍💼', title: 'Create your profile', text: 'Tell us about your skills, experience and goals — or publish your first vacancy in minutes.' },
              { icon: '🎯', title: 'Get matched', text: 'Our matching engine compares profiles and vacancies to surface the most compatible opportunities.' },
              { icon: '📈', title: 'Track everything', text: 'Apply, follow statuses in real time and export reports — all in one place.' },
            ].map((step) => (
              <div key={step.title} className="card p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-2xl">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
