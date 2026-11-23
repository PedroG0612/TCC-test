import { useState } from 'react'

export const LANDING_LOGO_SRC = '/logo.png'

interface ApplietyLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  wordmarkCase?: 'lower' | 'upper'
}

export function ApplietyLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
}: ApplietyLogoProps) {
  const [imgError, setImgError] = useState(false)

  const boxDims =
    variant === 'icon'
      ? size === 'lg'
        ? 'h-14 w-14 rounded-xl'
        : size === 'sm'
          ? 'h-10 w-10 rounded-lg'
          : 'h-12 w-12 rounded-xl'
      : variant === 'vertical'
        ? size === 'lg'
          ? 'h-32 w-36'
          : size === 'sm'
            ? 'h-24 w-28'
            : 'h-28 w-32'
        : size === 'lg'
          ? 'h-20 w-24'
          : size === 'sm'
            ? 'h-14 w-16'
            : 'h-[70px] w-[82px]'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden select-none ${boxDims} ${className}`}
    >
      {!imgError ? (
        <img
          src={LANDING_LOGO_SRC}
          alt="Appliety"
          onError={() => setImgError(true)}
          className="h-full w-full scale-[2.15] object-contain"
        />
      ) : (
        <span className="text-xs font-bold text-[#0B55B9]">appliety</span>
      )}
    </span>
  )
}
