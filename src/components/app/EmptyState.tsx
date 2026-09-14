interface EmptyStateProps {
  onCreateServer: () => void
  onInvite: () => void
}

/** Estado vazio da aplicação: nenhum servidor (nunca mostrar mocks). */
export function EmptyState({ onCreateServer, onInvite }: EmptyStateProps) {
  return (
    <main className="animate-fade-in flex min-w-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="animate-float flex h-20 w-20 items-center justify-center rounded-[var(--radius-2xl)] bg-accent/10 text-4xl text-accent-300">
        ✦
      </div>

      <h1 className="text-2xl font-bold text-white">Você ainda não participa de nenhum servidor.</h1>
      <p className="max-w-md text-[15px] leading-relaxed text-slate-500">
        Crie seu primeiro servidor ou participe de um servidor através de um convite.
      </p>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCreateServer}
          className="h-11 rounded-[var(--radius-lg)] bg-accent px-6 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-300"
        >
          Criar servidor
        </button>
        <button
          type="button"
          onClick={onInvite}
          className="h-11 rounded-[var(--radius-lg)] border border-white/[0.08] bg-surface-3 px-6 text-[15px] font-medium text-slate-300 transition-all duration-150 hover:border-accent/30 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-300"
        >
          Entrar com convite
        </button>
      </div>
    </main>
  )
}