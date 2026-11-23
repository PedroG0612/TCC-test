import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompanyMark, MapPinDuotoneIcon, SearchDuotoneIcon } from './Icons'

export function Hero() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [imgError, setImgError] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    if (city.trim()) params.set('location', city.trim())
    const qs = params.toString()
    navigate(qs ? `/jobs?${qs}` : '/jobs')
  }

  return (
    <section className="relative overflow-hidden bg-[#FAFDFB] bg-subtle-grain pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
      {/* Subtle organic sage-mint background shape (non-neon, calm daylight feel) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-20 h-[440px] w-[520px] rounded-[46%_54%_38%_62%/48%_42%_58%_52%] bg-[#E8F8EF] opacity-90"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-4 h-72 w-72 rounded-[60%_40%_55%_45%/45%_55%_45%_55%] bg-[#E8F8EF]/70"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        {/* Left: Editorial message + functional search bar + grounded metrics */}
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#CBEBD8] bg-[#E8F8EF] px-3.5 py-1 text-xs font-semibold text-[#064E2E]">
            Portal de empregos para empresas e talentos no Brasil
          </p>

          <h1
            className="mt-5 font-display font-extrabold tracking-tight text-[#18221D]"
            style={{
              fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)',
              lineHeight: 1.07,
              textWrap: 'balance',
            }}
          >
            Sua próxima oportunidade começa{' '}
            <span className="text-[#0B8F4D]">com conexões reais</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4A5A52] sm:text-lg">
            Conectamos profissionais que buscam crescimento a empresas que valorizam
            processos seletivos claros, salário transparente e retorno humano.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 rounded-2xl border border-[#CBEBD8] bg-white p-2 shadow-[0_8px_28px_rgba(6,78,46,0.08)]"
            aria-label="Buscar oportunidades de emprego"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 focus-within:bg-[#FAFDFB]">
                <SearchDuotoneIcon className="shrink-0" />
                <span className="sr-only">Cargo ou palavra-chave</span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Cargo ou palavra-chave"
                  className="w-full bg-transparent text-sm font-medium text-[#18221D] placeholder:text-slate-400 focus:outline-none"
                />
              </label>

              <div className="hidden h-7 w-px bg-[#CBEBD8] sm:block" aria-hidden="true" />

              <label className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 focus-within:bg-[#FAFDFB]">
                <MapPinDuotoneIcon className="shrink-0" />
                <span className="sr-only">Cidade ou modelo remoto</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade (ex.: São Paulo, Remoto)"
                  className="w-full bg-transparent text-sm font-medium text-[#18221D] placeholder:text-slate-400 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                className="whitespace-nowrap shrink-0 rounded-xl bg-[#0B8F4D] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#08723D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8F4D] focus-visible:ring-offset-2"
              >
                Buscar vagas
              </button>
            </div>
          </form>

          {/* Real platform stats */}
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-[#CBEBD8]/80 pt-6 sm:max-w-lg sm:gap-6">
            <div>
              <dt className="text-xs font-medium text-[#4A5A52] sm:text-sm">vagas ativas</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-[#064E2E] tabular-nums sm:text-2xl">
                +12.000
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#4A5A52] sm:text-sm">candidatos</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-[#064E2E] tabular-nums sm:text-2xl">
                +48.000
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#4A5A52] sm:text-sm">empresas</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-[#064E2E] tabular-nums sm:text-2xl">
                +3.200
              </dd>
            </div>
          </dl>
        </div>

        {/* Right: Real photography + realistic product job card preview */}
        <div className="relative lg:col-span-5">
          <div className="relative overflow-hidden rounded-tl-[2.5rem] rounded-tr-2xl rounded-br-[2.5rem] rounded-bl-2xl border border-[#CBEBD8] bg-[#E8F8EF] shadow-[0_18px_48px_rgba(6,78,46,0.12)]">
            {!imgError ? (
              <img
                src="/images/hero-workplace.jpg"
                alt="Profissionais colaborando em mesa de trabalho iluminada por luz natural e plantas"
                onError={() => setImgError(true)}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-[#E8F8EF] p-8 text-center">
                <p className="font-display text-lg font-bold text-[#064E2E]">
                  Equipes reais, vagas verificadas
                </p>
                <p className="mt-1 text-sm text-[#4A5A52]">
                  Contratações transparentes do primeiro contato à proposta final.
                </p>
              </div>
            )}
          </div>

          {/* Floating authentic job preview card */}
          <div className="relative z-10 mx-4 -mt-12 rounded-2xl border border-[#CBEBD8] bg-white p-4 shadow-[0_14px_34px_rgba(6,78,46,0.14)] sm:mx-0 sm:mt-0 sm:w-[320px] sm:absolute sm:-bottom-6 sm:-left-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <CompanyMark logoKey="nativa" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-[#18221D]">
                    Designer de Produto Pleno
                  </p>
                  <p className="truncate text-xs text-[#4A5A52]">
                    Nativa Tecnologia · São Paulo / Remoto
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Urgente
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <span className="font-semibold text-[#064E2E] tabular-nums">
                R$ 8.500 – R$ 11.000
              </span>
              <span className="rounded-md bg-[#E8F8EF] px-2 py-0.5 font-semibold text-[#0B8F4D]">
                CLT · Remoto
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
