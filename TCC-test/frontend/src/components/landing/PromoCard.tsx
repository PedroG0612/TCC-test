import { Link } from 'react-router-dom'
import { ArrowRight, Code2 } from 'lucide-react'

export function PromoCard() {
  return (
    <aside
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4E3FC] bg-gradient-to-b from-[#F1F6FF] via-[#E8F1FF] to-[#D9E7FF] p-6 shadow-[0_6px_24px_rgba(11,85,185,0.06)]"
      aria-label="Build your future with Appliety"
    >
      {/* Top copy + CTA */}
      <div className="relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0756D7] text-white shadow-[0_6px_16px_rgba(7,86,215,0.28)]">
          <Code2 className="h-6 w-6" strokeWidth={2.2} />
        </div>

        <h3 className="mt-5 text-[22px] font-bold leading-[1.2] tracking-tight text-[#101828]">
          Build your future with Appliety
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-[#596780]">
          Get personalized job recommendations, create alerts and never miss an
          opportunity.
        </p>

        <Link
          to="/register"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0756D7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(7,86,215,0.28)] transition-all hover:bg-[#0B55B9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0756D7] focus-visible:ring-offset-2"
        >
          <span>Create your account</span>
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>

      {/* Bottom illustration: Laptop displaying job UI + floating briefcase + soft blue shapes */}
      <div className="relative -mx-6 -mb-6 mt-8 pt-4 select-none" aria-hidden="true">
        {/* Soft curved decorative background waves */}
        <svg
          className="w-full h-auto block"
          viewBox="0 0 340 175"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 115C55 82 118 96 174 72C232 48 278 18 340 42V175H0V115Z"
            fill="#C7DCFF"
            fillOpacity="0.55"
          />
          <path
            d="M120 175C168 124 224 90 340 105V175H120Z"
            fill="#9EC1FF"
            fillOpacity="0.45"
          />

          {/* Laptop Screen Tilted Slightly */}
          <g transform="translate(46, 36) rotate(4)">
            {/* Bezel */}
            <rect
              x="0"
              y="0"
              width="172"
              height="112"
              rx="10"
              fill="#10213D"
            />
            {/* Inner screen */}
            <rect
              x="6"
              y="6"
              width="160"
              height="96"
              rx="6"
              fill="#FFFFFF"
            />
            {/* Top window bar */}
            <rect x="6" y="6" width="160" height="16" rx="4" fill="#EAF1FF" />
            <circle cx="15" cy="14" r="2.2" fill="#0756D7" />
            <rect x="22" y="12.5" width="38" height="3" rx="1.5" fill="#9DBBFA" />
            <rect x="134" y="11" width="24" height="6" rx="3" fill="#0756D7" />

            {/* Left mini sidebar inside screen */}
            <rect x="12" y="28" width="34" height="66" rx="4" fill="#F7F9FD" />
            <rect x="16" y="34" width="24" height="4" rx="2" fill="#C7DCFF" />
            <rect x="16" y="43" width="20" height="3.5" rx="1.75" fill="#DCE8FF" />
            <rect x="16" y="51" width="22" height="3.5" rx="1.75" fill="#DCE8FF" />

            {/* Job cards inside laptop screen */}
            <rect x="52" y="28" width="106" height="19" rx="4" fill="#F7F9FD" stroke="#E2E8F0" strokeWidth="1" />
            <rect x="57" y="33" width="9" height="9" rx="2.5" fill="#0756D7" />
            <rect x="71" y="33.5" width="44" height="3.5" rx="1.75" fill="#101828" fillOpacity="0.7" />
            <rect x="71" y="39.5" width="28" height="2.5" rx="1.25" fill="#94A3B8" />
            <rect x="130" y="34" width="22" height="7" rx="3.5" fill="#0756D7" />

            <rect x="52" y="51" width="106" height="19" rx="4" fill="#F7F9FD" stroke="#E2E8F0" strokeWidth="1" />
            <rect x="57" y="56" width="9" height="9" rx="2.5" fill="#3B82F6" />
            <rect x="71" y="56.5" width="48" height="3.5" rx="1.75" fill="#101828" fillOpacity="0.7" />
            <rect x="71" y="62.5" width="32" height="2.5" rx="1.25" fill="#94A3B8" />
            <rect x="130" y="57" width="22" height="7" rx="3.5" fill="#0756D7" />

            <rect x="52" y="74" width="106" height="19" rx="4" fill="#F7F9FD" stroke="#E2E8F0" strokeWidth="1" />
            <rect x="57" y="79" width="9" height="9" rx="2.5" fill="#0B55B9" />
            <rect x="71" y="79.5" width="40" height="3.5" rx="1.75" fill="#101828" fillOpacity="0.7" />
            <rect x="71" y="85.5" width="24" height="2.5" rx="1.25" fill="#94A3B8" />
            <rect x="130" y="80" width="22" height="7" rx="3.5" fill="#0756D7" />
          </g>

          {/* Laptop Keyboard Base */}
          <path
            d="M14 148H222L232 158C234 160 232.5 164 229 164H7C3.5 164 2 160 4 158L14 148Z"
            fill="#1D2E4D"
          />
          <rect x="92" y="151" width="48" height="3.5" rx="1.75" fill="#475569" />

          {/* Floating white card with blue briefcase */}
          <g transform="translate(184, 18) rotate(-4)">
            <rect
              x="0"
              y="0"
              width="78"
              height="68"
              rx="16"
              fill="#FFFFFF"
              stroke="#DCE8FF"
              strokeWidth="1.5"
            />
            {/* Briefcase icon */}
            <path
              d="M31 23V20C31 18.343 32.343 17 34 17H44C45.657 17 47 18.343 47 20V23"
              stroke="#0756D7"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <rect
              x="21"
              y="23"
              width="36"
              height="26"
              rx="5"
              fill="#0756D7"
            />
            <path
              d="M21 33C26.5 36.2 32.8 37.5 39 37.5C45.2 37.5 51.5 36.2 57 33"
              stroke="#EAF1FF"
              strokeWidth="2.2"
            />
            <rect x="36" y="34" width="6" height="5" rx="1.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>
    </aside>
  )
}
