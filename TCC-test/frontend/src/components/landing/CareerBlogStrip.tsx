import { useState } from 'react'
import { CAREER_ARTICLES, type CareerArticle } from './landingData'
import { ArrowRightIcon } from './Icons'

export function CareerBlogStrip() {
  const [selected, setSelected] = useState<CareerArticle | null>(null)

  return (
    <section id="conteudos" className="scroll-mt-20 border-t border-[#CBEBD8]/70 bg-[#FAFDFB] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0B8F4D]">
              Blog &amp; Guias práticos
            </p>
            <h2
              className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#18221D] sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Conteúdos para sua próxima etapa
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#4A5A52]">
            Leituras curtas e diretas sobre currículo, entrevistas e contratação consciente.
          </p>
        </div>

        <div className="fade-up mt-8 grid gap-5 md:grid-cols-3">
          {CAREER_ARTICLES.map((article) => (
            <article
              key={article.id}
              className="flex flex-col justify-between rounded-2xl border border-[#CBEBD8] bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0B8F4D] hover:shadow-card-hover"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-md bg-[#E8F8EF] px-2.5 py-0.5 font-semibold text-[#064E2E]">
                    {article.category}
                  </span>
                  <span className="text-[#4A5A52]">{article.readTime}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug text-[#18221D]">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4A5A52]">
                  {article.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(article)}
                className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#0B8F4D] transition-colors hover:text-[#064E2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8F4D]"
              >
                Ler guia
                <ArrowRightIcon />
              </button>
            </article>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#064E2E]/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-dialog-title"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#CBEBD8] bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-md bg-[#E8F8EF] px-2.5 py-1 text-xs font-semibold text-[#064E2E]">
                {selected.category} · {selected.readTime}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-2.5 py-1 text-sm font-semibold text-[#4A5A52] hover:bg-slate-100 hover:text-[#18221D]"
                aria-label="Fechar artigo"
              >
                Fechar ✕
              </button>
            </div>

            <h3
              id="article-dialog-title"
              className="mt-4 font-display text-2xl font-extrabold leading-tight text-[#18221D]"
            >
              {selected.title}
            </h3>

            <div className="mt-5 space-y-3.5 text-sm leading-relaxed text-[#32423A] sm:text-base">
              {selected.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
