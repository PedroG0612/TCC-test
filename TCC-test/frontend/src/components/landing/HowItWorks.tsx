import { useState } from 'react'
import { StepCard, type StepItem } from './StepCard'

const CANDIDATE_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Crie seu perfil',
    description:
      'Organize suas experiências, competências e preferências de modelo de trabalho em menos de cinco minutos.',
    illustration: 'profile',
  },
  {
    number: '02',
    title: 'Encontre vagas compatíveis',
    description:
      'Veja oportunidades alinhadas ao seu momento com faixa salarial clara e critérios transparentes.',
    illustration: 'match',
  },
  {
    number: '03',
    title: 'Candidate-se com 1 clique',
    description:
      'Envie sua candidatura sem preencher formulários repetitivos e acompanhe cada avanço no painel.',
    illustration: 'apply',
  },
]

const COMPANY_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Cadastre sua empresa',
    description:
      'Apresente sua equipe, cultura, benefícios e localidade em uma página pública pronta para atrair talentos.',
    illustration: 'company',
  },
  {
    number: '02',
    title: 'Publique a vaga',
    description:
      'Defina competências essenciais e desejáveis, faixa salarial e modelo de contratação em poucos cliques.',
    illustration: 'publish',
  },
  {
    number: '03',
    title: 'Receba candidatos qualificados',
    description:
      'Analise perfis com evidências reais do currículo, envie mensagens e avance etapas sem planilhas soltas.',
    illustration: 'shortlist',
  },
]

export function HowItWorks() {
  const [audience, setAudience] = useState<'candidates' | 'companies'>('candidates')
  const steps = audience === 'candidates' ? CANDIDATE_STEPS : COMPANY_STEPS

  return (
    <section id="como-funciona" className="scroll-mt-20 border-t border-[#CBEBD8]/70 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="fade-up flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0B8F4D]">
              Como funciona
            </p>
            <h2
              className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#18221D] sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Simples do primeiro clique à contratação
            </h2>
          </div>

          {/* Interactive audience toggle tabs */}
          <div
            role="tablist"
            aria-label="Alternar passo a passo entre candidatos e empresas"
            className="inline-flex rounded-xl border border-[#CBEBD8] bg-[#E8F8EF]/70 p-1 self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'candidates'}
              onClick={() => setAudience('candidates')}
              className={`whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                audience === 'candidates'
                  ? 'bg-[#0B8F4D] text-white shadow-sm'
                  : 'text-[#064E2E] hover:bg-white/70'
              }`}
            >
              Para candidatos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'companies'}
              onClick={() => setAudience('companies')}
              className={`whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                audience === 'companies'
                  ? 'bg-[#0B8F4D] text-white shadow-sm'
                  : 'text-[#064E2E] hover:bg-white/70'
              }`}
            >
              Para empresas
            </button>
          </div>
        </div>

        <div className="fade-up mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={`${audience}-${step.number}`} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
