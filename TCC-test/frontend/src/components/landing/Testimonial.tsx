import { useState } from 'react'
import type { LandingTestimonial } from './landingData'
import { StarSolidIcon } from './Icons'

export function Testimonial({ item }: { item: LandingTestimonial }) {
  const [imgError, setImgError] = useState(false)

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#CBEBD8] bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-[#0B8F4D] hover:shadow-card-hover">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 text-[#1DB954]" aria-label={`${item.rating} de 5 estrelas`}>
            {Array.from({ length: item.rating }).map((_, idx) => (
              <StarSolidIcon key={idx} />
            ))}
          </div>
          <span className="rounded-md bg-[#E8F8EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#064E2E]">
            {item.type}
          </span>
        </div>

        <blockquote className="mt-4 text-sm leading-relaxed text-[#32423A] sm:text-[15px]">
          “{item.quote}”
        </blockquote>
      </div>

      <footer className="mt-6 flex items-center gap-3.5 border-t border-slate-100 pt-4">
        {!imgError ? (
          <img
            src={item.photo}
            alt={`Retrato de ${item.name}`}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-12 w-12 shrink-0 rounded-full border border-[#CBEBD8] object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F8EF] font-display text-sm font-bold text-[#064E2E]">
            {item.initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-[#18221D]">
            {item.name}
          </p>
          <p className="truncate text-xs text-[#4A5A52]">
            {item.role} · <span className="font-semibold text-[#0B8F4D]">{item.company}</span>
          </p>
        </div>
      </footer>
    </article>
  )
}
