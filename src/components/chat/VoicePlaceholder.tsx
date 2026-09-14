import type { Channel } from '../../types'

interface VoicePlaceholderProps {
  channel: Channel
}

/** Sala de voz visual (conexão real de voz vem numa etapa futura). */
export function VoicePlaceholder({ channel }: VoicePlaceholderProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.055] px-4">
        <span aria-hidden="true" className="text-xl text-slate-500">
          🔊
        </span>
        <h2 className="text-[15px] font-bold text-white">{channel.name}</h2>
        <span className="hidden text-slate-600 sm:inline">|</span>
        <p className="hidden truncate text-[13px] text-slate-400 sm:block">Sala de voz</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="animate-float flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-500/25 to-accent-600/10 text-3xl text-accent-300">
          🔊
        </div>
        <h3 className="text-lg font-bold text-white">{channel.name}</h3>
        <p className="max-w-xs text-sm text-slate-400">
          A conexão de voz em tempo real será ativada em uma etapa futura do projeto.
        </p>
        <button
          type="button"
          className="mt-2 h-10 rounded-lg bg-success-500 px-5 text-sm font-semibold text-white transition-all hover:bg-success-500/80 focus-visible:ring-2 focus-visible:ring-success-500"
        >
          Entrar na sala
        </button>
      </div>
    </div>
  )
}