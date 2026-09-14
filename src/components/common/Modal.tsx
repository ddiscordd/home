import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Modal base: backdrop com fade + card com escala suave. Fecha com Escape. */
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-[440px] max-w-full rounded-[var(--radius-xl)] border border-white/[0.08] bg-surface-2 p-6 shadow-lg',
          'animate-scale-in',
        )}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}