interface EmptyStateProps {
  onCreateServer: () => void
  onInvite: () => void
}

/** Estado vazio da aplicação: nenhum servidor (nunca mostrar mocks). */
export function EmptyState({ onCreateServer, onInvite }: EmptyStateProps) {
  return (
    <main className="animate-fade-in flex min-w-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="animate-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-500/25 to-accent-600/10 text-4xl text-accent-300">
        ✦
      </div>

      <h1 className="text-2xl font-bold text-white">Você ainda não participa de nenhum servidor.</h1>
      <p className="max-w-md text-[15px] leading-relaxed text-slate-400">
        Crie seu primeiro servidor ou participe de um servidor através de um convite.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCreateServer}
          className="h-11 rounded-lg bg-accent-500 px-6 text-[15px] font-semibold text-white transition-all hover:bg-accent-400 focus-visible:ring-2 focus-visible:ring-accent-300 active:bg-accent-600"
        >
          Criar servidor
        </button>
        <button
          type="button"
          onClick={onInvite}
          className="h-11 rounded-lg border border-white/10 bg-abyss-700 px-6 text-[15px] font-medium text-slate-200 transition-all hover:border-accent-400 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-300"
        >
          Entrar com convite
        </button>
      </div>
    </main>
  )
}