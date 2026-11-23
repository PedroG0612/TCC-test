import { PARTNER_COMPANIES, PartnerLogoSvg } from './Icons'

export function PartnerLogos() {
  return (
    <section id="empresas" className="scroll-mt-20 border-t border-[#CBEBD8]/70 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="fade-up flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4A5A52]">
            Empresas parceiras que contratam pelo BrotoRH
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6">
            {PARTNER_COMPANIES.map((company) => (
              <PartnerLogoSvg
                key={company.name}
                partnerKey={company.key}
                name={company.name}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
