import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowRightIcon } from './Icons'

export function CTA() {
  const { user } = useAuth()

  const candidateTarget = user ? '/jobs' : '/register?role=candidate'
  const companyTarget =
    user?.role === 'company' ? '/company/jobs/new' : '/register?role=company'

  return (
    <section className="relative overflow-hidden bg-[#064E2E] bg-dark-texture py-16 text-white sm:py-20">
      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A3E4C0]">
            Comece gratuitamente
          </p>
          <h2
            className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Pronto para dar o próximo passo?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#E8F8EF]/85 sm:text-lg">
            Crie seu currículo para encontrar vagas abertas ou publique sua oportunidade para
            conectar seu time com profissionais qualificados.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              to={candidateTarget}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1DB954] px-6 py-3.5 text-sm font-bold text-[#042D1B] shadow-lg transition-all hover:bg-[#35BA77] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#064E2E] sm:w-auto"
            >
              Cadastrar currículo grátis
              <ArrowRightIcon />
            </Link>
            <Link
              to={companyTarget}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#A3E4C0]/55 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#064E2E] sm:w-auto"
            >
              Publicar vaga
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
