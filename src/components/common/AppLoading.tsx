import { useEffect, useState } from 'react'

export function AppLoading() {
  // Após 6s avisa que a conexão está lenta (não trava: o loading tem timeout próprio).
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex min-h-full items-center justify-center bg-abyss-900">
      <div
        role="status"
        aria-live="polite"
        aria-label="Carregando"
        className="flex flex-col items-center gap-4 animate-fade-in"
      >
        <span
          aria-hidden="true"
          className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-accent-500/30 border-t-accent-400"
        />
        <p className="text-sm text-slate-400">Carregando Concord…</p>
        {slow && (
          <p className="max-w-xs text-center text-xs text-slate-500">
            A conexão está demorando mais que o normal. Verifique sua internet.
          </p>
        )}
      </div>
    </div>
  )
}