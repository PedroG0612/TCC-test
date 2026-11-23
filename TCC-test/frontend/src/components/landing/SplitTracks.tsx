import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowRightIcon, CandidateDuotoneIcon, CompanyDuotoneIcon } from './Icons'

export function SplitTracks() {
  const { user } = useAuth()

  const companyTarget =
    user?.role === 'company' ? '/company/jobs/new' : '/register?role=company'

  return (
    <section className="border-y border-[#CBEBD8]/70 bg-white py-14 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
        {/* Track 1: Candidate */}
        <article className="fade-up group relative flex flex-col justify-between rounded-2xl border border-[#CBEBD8] bg-[#FAFDFB] p-7 transition-all duration-200 hover:-translate-y-1 hover:border-[#0B8F4D] hover:bg-[#E8F8EF]/45 hover:shadow-card-hover sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-4">
              <CandidateDuotoneIcon />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0B8F4D]">
                Para quem busca
              </span>
            </div>

            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#18221D]">
              Sou candidato
            </h2>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#4A5A52] sm:text-base">
              Cadastre seu currículo uma única vez, descubra vagas compatíveis com sua
              experiência e acompanhe o retorno das empresas em tempo real.
            </p>
          </div>

          <div className="mt-7">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B8F4D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-[#08723D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8F4D] focus-visible:ring-offset-2"
            >
              Encontrar vagas
              <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </article>

        {/* Track 2: Company */}
        <article className="fade-up group relative flex flex-col justify-between rounded-2xl border border-[#CBEBD8] bg-[#064E2E] p-7 text-white transition-all duration-200 hover:-translate-y-1 hover:border-[#1DB954] hover:shadow-card-hover sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-4">
              <CompanyDuotoneIcon />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A3E4C0]">
                Para quem contrata
              </span>
            </div>

            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-white">
              Sou empresa
            </h2>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#E8F8EF]/85 sm:text-base">
              Publique vagas em poucos minutos, organize candidaturas por competências
              reais e conduza entrevistas com muito mais agilidade.
            </p>
          </div>

          <div className="mt-7">
            <Link
              to={companyTarget}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-5 py-3 text-sm font-semibold text-[#042D1B] shadow-sm transition-all group-hover:bg-[#35BA77] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#064E2E]"
            >
              Publicar vaga
              <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
