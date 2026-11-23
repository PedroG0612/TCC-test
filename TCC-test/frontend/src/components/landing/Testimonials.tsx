import { TESTIMONIALS } from './landingData'
import { Testimonial } from './Testimonial'

export function Testimonials() {
  return (
    <section className="border-t border-[#CBEBD8]/70 bg-[#FAFDFB] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="fade-up max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0B8F4D]">
            Histórias reais
          </p>
          <h2
            className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#18221D] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Quem usa no dia a dia recomenda
          </h2>
          <p className="mt-3 text-base text-[#4A5A52]">
            Profissionais contratados e times de recrutamento que trocaram a ansiedade por
            processos transparentes.
          </p>
        </div>

        <div className="fade-up mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <Testimonial key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
