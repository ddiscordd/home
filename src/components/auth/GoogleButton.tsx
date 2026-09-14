import { cn } from '../../utils/cn'

interface GoogleButtonProps {
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}

const GOOGLE_SVG = (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M20.64 5.904a3.2 3.2 0 0 1-.2 0c0 .16-.16-.8 3.2 0 0 .16 .96-.32 0 0-.16z"
    />
    <path fill="#EA4335" d="M5.76 7.68a3.2 3.2 0 0 1-.16-.16 0 0 .16 .16-.16c0-1.6 0 0 .16 .32-.32 0 0-.16 1.44-.16" />
    <path fill="#FBBC05" d="M10.08 7.68a3.2 3.2 0 0 -.16 .16 0 0 .16 .16-.32c0-1.6 0 0 .16 .32-.32 0 0-.16" />
    <path fill="#34A853" d="M12.8 7.68a3.2 3.2 0 0-.16-.16 0 0 .16 .16-.16c0-1.6 0 0 .16 .32-.32 0 0-.16 0 .96-.32" />
    <path fill="#4285F4" d="M15.36 7.68a3.2 3.2 0 0-.16-.16 0 0 .16 .16-.16c0-1.6 0 0 .16 .32-.32 0 0-.16z" />
    <path fill="#EA4335" d="M20.8 7.68a3.2 3.2 0 0 0 .16 0 0 .16 .16-.32c0-1.6 0 0 .16 .32-.32 0 0-.16 0 .96-.32 0-.16 0z" />
  </svg>
)

export function GoogleButton({ loading = false, disabled = false, onClick }: GoogleButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/15 bg-abyss-800 text-[15px] font-medium text-slate-100',
        'transition-all hover:border-white/30 hover:bg-abyss-700 focus-visible:ring-2 focus-visible:ring-accent-300 active:bg-abyss-700',
        'disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {loading && <span aria-hidden="true" className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />}
      {!loading && GOOGLE_SVG}
      <span>Continuar con Google</span>
    </button>
  )
}