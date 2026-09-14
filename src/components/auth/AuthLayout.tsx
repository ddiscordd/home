import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface AuthLayoutProps {
  children: ReactNode
}

/** Fondo + card compartidos por Login y Registro. Sombras/glow suaves, solo CSS. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-bg relative flex min-h-full items-center justify-center overflow-hidden px-4">
      {/* Brillo decorativo muy sutil (no esencial, respeta prefers-reduced-motion) */}
      <div aria-hidden="true" className="auth-glow auth-glow--a" />
      <div aria-hidden="true" className="auth-glow auth-glow--b" />

      <div
        className={cn(
          'auth-card relative w-[420px] max-w-full rounded-2xl border border-white/10 bg-abyss-850/80 p-8 shadow-2xl backdrop-blur-md',
          'animate-fade-up',
        )}
      >
        {children}
      </div>
    </div>
  )
}