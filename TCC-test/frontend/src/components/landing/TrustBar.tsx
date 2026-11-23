interface TrustBarProps {
  onSelectCompany: (companyName: string) => void
  activeCompany: string | null
}

export function TrustBar({ onSelectCompany, activeCompany }: TrustBarProps) {
  const companies = [
    {
      name: 'Google',
      render: (
        <span className="text-[19px] font-semibold tracking-tight">Google</span>
      ),
    },
    {
      name: 'Microsoft',
      render: (
        <span className="inline-flex items-center gap-1.5 text-[17px] font-semibold tracking-tight">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <rect x="1" y="1" width="8" height="8" rx="0.6" />
            <rect x="11" y="1" width="8" height="8" rx="0.6" />
            <rect x="1" y="11" width="8" height="8" rx="0.6" />
            <rect x="11" y="11" width="8" height="8" rx="0.6" />
          </svg>
          Microsoft
        </span>
      ),
    },
    {
      name: 'Meta',
      render: (
        <span className="inline-flex items-center gap-1.5 text-[17px] font-semibold tracking-tight">
          <svg className="h-4 w-5 shrink-0" viewBox="0 0 28 18" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
            <path d="M5.5 14C2.5 14 1.5 11.4 2.3 8.2C3.1 4.9 5.3 3 7.5 3C10.3 3 12.2 6.8 14 9.5C15.8 6.8 17.7 3 20.5 3C22.7 3 24.9 4.9 25.7 8.2C26.5 11.4 25.5 14 22.5 14C19.6 14 17.4 10.6 14 6.5C10.6 10.6 8.4 14 5.5 14Z" />
          </svg>
          Meta
        </span>
      ),
    },
    {
      name: 'Amazon',
      render: (
        <span className="inline-flex flex-col items-center leading-none">
          <span className="text-[18px] font-bold lowercase tracking-tight">amazon</span>
          <svg className="-mt-0.5 h-2 w-12" viewBox="0 0 48 10" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M6 2C16 8 30 8 40 2.5" strokeLinecap="round" />
            <path d="M36.5 1.8L41 2.4L39.2 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ),
    },
    {
      name: 'Apple',
      render: (
        <span className="inline-flex items-center gap-1" title="Apple">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
          </svg>
          <span className="sr-only">Apple</span>
        </span>
      ),
    },
    {
      name: 'Santander',
      render: (
        <span className="inline-flex items-center gap-1.5 text-[16px] font-semibold tracking-tight">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.3 2.2c.4 1.6-.6 2.9-1.5 4.1-.9 1.2-1.7 2.4-1.1 4.1.2.5.1.9-.3 1.1-.4.2-.9 0-1.1-.4-.8-1.7-.4-3.6.6-5.2.9-1.4 2-2.6 3.4-3.7zm3.4 2.8c.3 1.5-.6 2.7-1.4 3.9-.8 1.2-1.5 2.2-1 3.7.2.4 0 .9-.4 1-.4.2-.9 0-1-.4-.7-1.6-.3-3.2.6-4.7.8-1.3 1.9-2.4 3.2-3.5zm3.3 9.4c0 3.3-3.1 6-7 6s-7-2.7-7-6c0-1.7.8-3.3 2.2-4.4-.2 1.2.2 2.5 1.2 3.4 1 .9 2.4 1.3 3.8 1.1 1.7-.2 3.1-1.3 3.7-2.8.8-1.9.1-3.9-1.2-5.1 2.6 1.2 4.3 4.1 4.3 7.8z" />
          </svg>
          Santander
        </span>
      ),
    },
    {
      name: 'iFood',
      render: (
        <span className="inline-flex flex-col items-center leading-none">
          <span className="text-[18px] font-extrabold italic tracking-tight">ifood</span>
          <svg className="-mt-0.5 h-2 w-9" viewBox="0 0 36 8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 2C13 7 23 7 30 2.5" strokeLinecap="round" />
            <path d="M27.5 1.8L31 2.4L29.2 5.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ),
    },
  ]

  return (
    <section
      id="trusted-companies"
      className="border-b border-[#E2E8F0] bg-white"
      aria-label="Trusted by leading companies"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <p className="shrink-0 text-sm font-semibold text-[#596780]">
          Trusted by leading companies
        </p>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[#64748B]">
          {companies.map((c) => {
            const isSelected = activeCompany === c.name
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => onSelectCompany(c.name)}
                className={`transition-colors hover:text-[#101828] focus:outline-none focus-visible:text-[#0756D7] ${
                  isSelected ? 'text-[#0756D7]' : ''
                }`}
                title={`Filter or search jobs at ${c.name}`}
              >
                {c.render}
              </button>
            )
          })}

          <span className="hidden h-4 w-px bg-[#E2E8F0] sm:inline-block" aria-hidden="true" />
          <span className="text-sm font-medium text-[#596780]">and more...</span>
        </div>
      </div>
    </section>
  )
}
