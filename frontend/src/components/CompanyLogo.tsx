/**
 * Company logo display: real logo image when available, otherwise a clean
 * solid neutral fallback with the company's initials. No gradients.
 */
export function CompanyLogo({
  name,
  logo,
  size = 'md',
}: {
  name: string
  logo?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims =
    size === 'lg'
      ? 'h-16 w-16 rounded-2xl text-lg'
      : size === 'sm'
        ? 'h-10 w-10 rounded-lg text-xs'
        : 'h-12 w-12 rounded-xl text-sm'

  if (logo) {
    return (
      <div className={`${dims} flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white`}>
        <img src={logo} alt={name} className="h-full w-full object-contain p-1" />
      </div>
    )
  }
  return (
    <div className={`${dims} flex shrink-0 items-center justify-center bg-slate-100 font-bold text-slate-500`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}
