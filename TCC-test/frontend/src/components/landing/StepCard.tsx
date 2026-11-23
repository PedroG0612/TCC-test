import { StepIllustration } from './Icons'

export interface StepItem {
  number: string
  title: string
  description: string
  illustration: 'profile' | 'match' | 'apply' | 'company' | 'publish' | 'shortlist'
}

export function StepCard({ step }: { step: StepItem }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#CBEBD8] bg-[#FAFDFB] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0B8F4D] hover:bg-white hover:shadow-card">
      <div>
        <div className="flex items-center justify-between gap-4">
          <StepIllustration kind={step.illustration} />
          <span className="font-display text-2xl font-extrabold tracking-tight text-[#CBEBD8] tabular-nums">
            {step.number}
          </span>
        </div>

        <h3 className="mt-5 font-display text-lg font-bold text-[#18221D]">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#4A5A52]">
          {step.description}
        </p>
      </div>
    </div>
  )
}
