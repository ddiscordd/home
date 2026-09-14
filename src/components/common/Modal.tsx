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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
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
          'w-[440px] max-w-full rounded-2xl border border-white/10 bg-abyss-850 p-6 shadow-2xl',
          'animate-fade-up',
        )}
      >
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}