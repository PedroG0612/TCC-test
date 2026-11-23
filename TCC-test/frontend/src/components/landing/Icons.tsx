import type { SVGProps } from 'react'

export function BrandLogo({
  dark = false,
  className = '',
}: {
  dark?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="10"
          fill={dark ? '#0B8F4D' : '#E8F8EF'}
          stroke={dark ? '#35BA77' : '#CBEBD8'}
          strokeWidth="1.5"
        />
        <path
          d="M18 27V15.5"
          stroke={dark ? '#FFFFFF' : '#064E2E'}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M18 19C18 13.8 13.7 10.5 9.5 10.5C9.5 15.2 12.8 19 18 19Z"
          fill={dark ? '#A3E4C0' : '#1DB954'}
          stroke={dark ? '#FFFFFF' : '#064E2E'}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M18 16.5C18 11.4 22.3 8.5 26.5 8.5C26.5 13.3 23.2 16.5 18 16.5Z"
          fill={dark ? '#FFFFFF' : '#0B8F4D'}
          stroke={dark ? '#FFFFFF' : '#064E2E'}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display text-xl font-extrabold tracking-tight ${
          dark ? 'text-white' : 'text-[#064E2E]'
        }`}
      >
        Broto<span className={dark ? 'text-[#6AD09C]' : 'text-[#0B8F4D]'}>RH</span>
      </span>
    </span>
  )
}

/* Custom Duotone SVG Icons (not Lucide defaults) */
export function SearchDuotoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" fill="#E8F8EF" stroke="#0B8F4D" strokeWidth="1.9" />
      <path d="M16 16L20.5 20.5" stroke="#064E2E" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  )
}

export function MapPinDuotoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21C12 21 18.5 15.2 18.5 9.8C18.5 6.04 15.59 3 12 3C8.41 3 5.5 6.04 5.5 9.8C5.5 15.2 12 21 12 21Z"
        fill="#E8F8EF"
        stroke="#0B8F4D"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.8" r="2.4" fill="#1DB954" stroke="#064E2E" strokeWidth="1.4" />
    </svg>
  )
}

export function CandidateDuotoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
      <circle cx="16" cy="11.5" r="3.6" fill="#1DB954" fillOpacity="0.28" stroke="#064E2E" strokeWidth="1.8" />
      <path
        d="M9.5 23.5C10.3 19.8 12.8 18 16 18C19.2 18 21.7 19.8 22.5 23.5"
        stroke="#0B8F4D"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CompanyDuotoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
      <path
        d="M9 24V11.5C9 10.67 9.67 10 10.5 10H17.5C18.33 10 19 10.67 19 11.5V24"
        fill="#1DB954"
        fillOpacity="0.22"
        stroke="#064E2E"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M19 15H22.2C22.92 15 23.5 15.58 23.5 16.3V24M7.5 24H24.5"
        stroke="#0B8F4D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12.5 14H15.5M12.5 17.5H15.5" stroke="#064E2E" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function StepIllustration({
  kind,
}: {
  kind: 'profile' | 'match' | 'apply' | 'company' | 'publish' | 'shortlist'
}) {
  if (kind === 'profile') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="38" height="38" rx="12" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
        <rect x="11" y="10" width="22" height="24" rx="4" fill="#FFFFFF" stroke="#064E2E" strokeWidth="1.7" />
        <circle cx="17.5" cy="17.5" r="2.6" fill="#1DB954" fillOpacity="0.35" stroke="#0B8F4D" strokeWidth="1.5" />
        <path d="M22.5 16.5H28.5M22.5 19.5H27M14.5 24.5H28.5M14.5 28H24" stroke="#064E2E" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'match') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="38" height="38" rx="12" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="8" fill="#FFFFFF" stroke="#0B8F4D" strokeWidth="1.8" />
        <path d="M16.8 20.2L19.1 22.5L23.5 17.8" stroke="#064E2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 26L31.5 31.5" stroke="#064E2E" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'apply') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="38" height="38" rx="12" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
        <path
          d="M12 22.2L30.5 13.5L25.5 31L20.8 24.5L12 22.2Z"
          fill="#1DB954"
          fillOpacity="0.28"
          stroke="#064E2E"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M20.8 24.5L30.5 13.5" stroke="#0B8F4D" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'company') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="38" height="38" rx="12" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
        <rect x="11" y="13" width="14" height="20" rx="2.5" fill="#FFFFFF" stroke="#064E2E" strokeWidth="1.7" />
        <path d="M25 19H31C31.8 19 32.5 19.7 32.5 20.5V33H10" stroke="#0B8F4D" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M15.5 18H20.5M15.5 22.5H20.5M15.5 27H20.5" stroke="#1DB954" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'publish') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="38" height="38" rx="12" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
        <rect x="11" y="12" width="22" height="19" rx="3.5" fill="#FFFFFF" stroke="#064E2E" strokeWidth="1.7" />
        <path d="M16 18.5H28M16 23H23.5" stroke="#0B8F4D" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="30" cy="27.5" r="5" fill="#1DB954" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M28 27.5H32M30 25.5V29.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="38" height="38" rx="12" fill="#E8F8EF" stroke="#CBEBD8" strokeWidth="1.2" />
      <circle cx="17.5" cy="18" r="3.5" fill="#1DB954" fillOpacity="0.3" stroke="#064E2E" strokeWidth="1.7" />
      <path d="M11.5 29C12.3 25.6 14.5 24 17.5 24C20.5 24 22.7 25.6 23.5 29" stroke="#064E2E" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M25.5 18.5L27.8 20.8L32.5 16" stroke="#0B8F4D" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3.5 8H12.5M9 4.5L12.5 8L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StarSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M10 2.2l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.18l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L10 2.2z" />
    </svg>
  )
}

export function CompanyMark({
  logoKey,
}: {
  logoKey: 'nativa' | 'cerrado' | 'folha' | 'semente' | 'pinheiro' | 'mata'
}) {
  switch (logoKey) {
    case 'nativa':
      return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <rect width="42" height="42" rx="11" fill="#E8F8EF" stroke="#CBEBD8" />
          <path d="M13 28V14L21 22L29 14V28" stroke="#064E2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="21" cy="14" r="2.2" fill="#1DB954" />
        </svg>
      )
    case 'cerrado':
      return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <rect width="42" height="42" rx="11" fill="#F0FAF4" stroke="#CBEBD8" />
          <circle cx="21" cy="21" r="8" stroke="#0B8F4D" strokeWidth="2.4" />
          <path d="M21 13V21L26.5 24.5" stroke="#064E2E" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'folha':
      return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <rect width="42" height="42" rx="11" fill="#E8F8EF" stroke="#CBEBD8" />
          <path d="M13 27C13 18.5 19.5 13 29 13C29 22 23.5 28.5 15 28.5" fill="#1DB954" fillOpacity="0.25" stroke="#064E2E" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 28L23 18" stroke="#0B8F4D" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'semente':
      return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <rect width="42" height="42" rx="11" fill="#F3FBF6" stroke="#CBEBD8" />
          <path d="M21 11C25.5 15 27.5 19.5 27.5 23.2C27.5 27 24.6 30 21 30C17.4 30 14.5 27 14.5 23.2C14.5 19.5 16.5 15 21 11Z" fill="#E8F8EF" stroke="#0B8F4D" strokeWidth="2.1" />
          <circle cx="21" cy="23.5" r="2.3" fill="#064E2E" />
        </svg>
      )
    case 'pinheiro':
      return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <rect width="42" height="42" rx="11" fill="#E8F8EF" stroke="#CBEBD8" />
          <path d="M21 11L29 24H13L21 11Z" fill="#1DB954" fillOpacity="0.25" stroke="#064E2E" strokeWidth="2" strokeLinejoin="round" />
          <path d="M21 24V31" stroke="#064E2E" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'mata':
      return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <rect width="42" height="42" rx="11" fill="#F0FAF4" stroke="#CBEBD8" />
          <rect x="13" y="13" width="7" height="16" rx="2" fill="#0B8F4D" fillOpacity="0.22" stroke="#064E2E" strokeWidth="1.9" />
          <rect x="22" y="17" width="7" height="12" rx="2" fill="#1DB954" fillOpacity="0.35" stroke="#0B8F4D" strokeWidth="1.9" />
        </svg>
      )
  }
}

export const PARTNER_COMPANIES = [
  { name: 'Cerrado Pay', tag: 'Fintech', key: 'cerrado' },
  { name: 'Floresta Digital', tag: 'Produto', key: 'folha' },
  { name: 'Pinheiro Cloud', tag: 'Infraestrutura', key: 'pinheiro' },
  { name: 'Semente Educação', tag: 'EdTech', key: 'semente' },
  { name: 'Mata Atlântica', tag: 'Healthtech', key: 'mata' },
  { name: 'Nativa Tecnologia', tag: 'Software', key: 'nativa' },
  { name: 'Folha Viva', tag: 'Logística', key: 'folha2' },
] as const

export function PartnerLogoSvg({
  partnerKey,
  name,
}: {
  partnerKey: (typeof PARTNER_COMPANIES)[number]['key']
  name: string
}) {
  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-transparent px-3.5 py-2.5 transition-all duration-200 hover:border-[#CBEBD8] hover:bg-[#E8F8EF]/55">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="text-slate-400 transition-colors duration-200 group-hover:text-[#0B8F4D]"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="26"
          height="26"
          rx="7"
          className="fill-slate-100 stroke-slate-300 transition-colors duration-200 group-hover:fill-[#E8F8EF] group-hover:stroke-[#0B8F4D]"
          strokeWidth="1.4"
        />
        {partnerKey === 'cerrado' && (
          <circle cx="14" cy="14" r="5.5" stroke="currentColor" strokeWidth="2.1" />
        )}
        {partnerKey === 'folha' && (
          <path d="M9 18C9 12.5 13 9 19 9C19 14.8 15.5 19 9 18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        )}
        {partnerKey === 'pinheiro' && (
          <path d="M14 7.5L20 18H8L14 7.5ZM14 18V21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {partnerKey === 'semente' && (
          <path d="M14 8C17 10.8 18.5 13.8 18.5 16.2C18.5 18.7 16.5 20.5 14 20.5C11.5 20.5 9.5 18.7 9.5 16.2C9.5 13.8 11 10.8 14 8Z" stroke="currentColor" strokeWidth="2" />
        )}
        {partnerKey === 'mata' && (
          <path d="M9.5 19V10M14 19V13M18.5 19V8.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        )}
        {partnerKey === 'nativa' && (
          <path d="M9 19V9.5L14 14.5L19 9.5V19" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {partnerKey === 'folha2' && (
          <path d="M8.5 15.5L12.5 11.5L15.5 14.5L19.5 10" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <span className="font-display text-sm font-bold tracking-tight text-slate-500 transition-colors duration-200 group-hover:text-[#064E2E] whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}
