import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface PrimaryButtonProps {
  children: ReactNode
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
}

export function PrimaryButton({ children, loading = false, disabled = false, onClick, className }: PrimaryButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-500 text-[15px] font-semibold text-white',
        'transition-all hover:bg-accent-400 focus-visible:ring-2 focus-visible:ring-accent-300 active:bg-accent-600',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {loading && <span aria-hidden="true" className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  )
}