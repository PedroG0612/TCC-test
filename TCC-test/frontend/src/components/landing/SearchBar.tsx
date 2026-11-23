import { useState, type FormEvent, type RefObject } from 'react'
import { ChevronDown, MapPin, Search } from 'lucide-react'

const LOCATION_OPTIONS = [
  'Any location',
  'São Paulo, SP',
  'Rio de Janeiro, RJ',
  'Belo Horizonte, MG',
  'Curitiba, PR',
  'Florianópolis, SC',
  'Remote',
]

interface SearchBarProps {
  inputRef?: RefObject<HTMLInputElement>
  initialQuery?: string
  initialLocation?: string
  onSearch: (query: string, location: string) => void
}

export function SearchBar({
  inputRef,
  initialQuery = '',
  initialLocation = '',
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(query.trim(), location)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-20 flex w-full flex-col gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_14px_40px_rgba(16,33,61,0.08)] md:flex-row md:items-center md:rounded-full md:p-2 md:pl-5"
      role="search"
      aria-label="Job search"
    >
      {/* Keyword input */}
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5 md:px-0">
        <Search className="h-5 w-5 shrink-0 text-[#596780]" strokeWidth={2} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for jobs (e.g. Frontend Developer, Data Scientist...)"
          aria-label="Search for jobs"
          className="w-full min-w-0 bg-transparent text-[15px] text-[#101828] placeholder-[#596780]/80 focus:outline-none"
        />
      </div>

      {/* Hairline divider */}
      <span
        className="hidden h-7 w-px shrink-0 bg-[#E2E8F0] md:block"
        aria-hidden="true"
      />

      {/* Location selector */}
      <div className="relative flex items-center gap-2 border-t border-[#E2E8F0] px-2 pt-2 pb-1 md:w-52 md:border-t-0 md:px-3 md:py-0">
        <MapPin className="h-[18px] w-[18px] shrink-0 text-[#596780]" strokeWidth={2} />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Select location"
          className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-[#101828] focus:outline-none"
        >
          {LOCATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt === 'Any location' ? '' : opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596780]"
          strokeWidth={2}
        />
      </div>

      {/* Primary blue CTA */}
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-[#0756D7] px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(7,86,215,0.28)] transition-all hover:bg-[#0B55B9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0756D7] focus-visible:ring-offset-2 md:rounded-full"
      >
        Search
      </button>
    </form>
  )
}
