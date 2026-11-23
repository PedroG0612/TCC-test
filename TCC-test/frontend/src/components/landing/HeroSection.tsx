import { useState, type RefObject } from 'react'
import { TrendingUp } from 'lucide-react'
import heroPortrait from '../../assets/hero-professional.jpg'
import { SearchBar } from './SearchBar'

interface HeroSectionProps {
  searchInputRef: RefObject<HTMLInputElement>
  onSearch: (query: string, location: string) => void
}

export function HeroSection({ searchInputRef, onSearch }: HeroSectionProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Right-side angled light-blue geometric backdrop */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block"
        aria-hidden="true"
      >
        <div
          className="h-full w-full bg-gradient-to-br from-[#F0F5FF] via-[#E6EEFF] to-[#D9E7FF]"
          style={{ clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)' }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-10 sm:px-6 lg:px-8 lg:pt-12 lg:pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
          {/* Left column (~55% / 7 cols): Typography + space for overlapping SearchBar */}
          <div className="lg:col-span-7 lg:pr-6">
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-[#101828] sm:text-5xl lg:text-[3.5rem]">
              Find your next
              <span className="block text-[#0756D7]">opportunity.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#596780] sm:text-lg">
              Search through thousands of jobs from the best companies, and take the
              next step in your career.
            </p>

            {/* Desktop SearchBar spans across hero left into right edge cleanly */}
            <div className="mt-8 lg:w-[116%] lg:max-w-[780px]">
              <SearchBar inputRef={searchInputRef} onSearch={onSearch} />
            </div>
          </div>

          {/* Right column (~45% / 5 cols): Portrait + geometric blue shapes + floating card */}
          <div className="relative flex items-end justify-center lg:col-span-5 lg:justify-end">
            {/* Soft blue tilted accent square */}
            <div
              className="pointer-events-none absolute -left-2 bottom-24 hidden h-12 w-12 rotate-12 rounded-xl bg-[#C2D8FF]/75 sm:block"
              aria-hidden="true"
            />

            {/* Main visual stage */}
            <div className="relative h-[300px] w-full max-w-[440px] sm:h-[340px] lg:h-[360px]">
              {/* Vibrant diagonal cobalt-blue rounded geometric shape behind subject */}
              <div
                className="pointer-events-none absolute bottom-0 left-2 right-2 h-[74%] -rotate-6 rounded-[28px] bg-gradient-to-tr from-[#0B55B9] via-[#0756D7] to-[#2B78F6] shadow-[0_20px_50px_rgba(7,86,215,0.22)]"
                aria-hidden="true"
              />

              {/* Subtle secondary translucent light-blue shape */}
              <div
                className="pointer-events-none absolute right-2 top-3 h-28 w-28 rotate-12 rounded-2xl bg-[#D2E2FF]/70"
                aria-hidden="true"
              />

              {/* Realistic portrait of smiling young professional */}
              <div className="relative z-10 flex h-full w-full items-end justify-center overflow-hidden rounded-b-[24px]">
                {!imgError ? (
                  <img
                    src={heroPortrait}
                    alt="Smiling young professional looking ahead toward new career opportunities"
                    onError={() => setImgError(true)}
                    className="h-[96%] w-[86%] rounded-t-[26px] object-cover object-top shadow-sm"
                  />
                ) : (
                  <div className="flex h-[88%] w-[80%] flex-col items-center justify-center rounded-t-[26px] bg-[#EAF1FF] p-6 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0756D7] text-white">
                      <TrendingUp className="h-8 w-8" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-[#10213D]">
                      Grow your career with Appliety
                    </p>
                  </div>
                )}
              </div>

              {/* Floating tilted white career card */}
              <div className="absolute -right-1 bottom-12 z-20 flex -rotate-3 items-center gap-3 rounded-2xl border border-white/90 bg-white px-4 py-3 shadow-[0_16px_36px_rgba(16,33,61,0.14)] sm:right-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#0756D7]">
                  <TrendingUp className="h-5 w-5" strokeWidth={2.3} />
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-[#101828]">Grow your</p>
                  <p className="text-[13px] font-bold text-[#101828]">career</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[#596780]">with Appliety</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
