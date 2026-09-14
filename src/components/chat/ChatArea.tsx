import { useEffect, useRef, useState } from 'react'
import type { Channel, Message, User } from '../../types'
import { Avatar } from '../common/Avatar'
import { formatTime } from '../../utils/format'

interface ChatAreaProps {
  channel: Channel
  messages: Message[]
  /** Mapa id → usuário (membros reais + usuário autenticado). */
  usersById: Record<string, User>
  /** Fallback caso uma mensagem referencie usuário fora do mapa. */
  fallbackUser: User | null
  onSend: (content: string) => void
}

function groupLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(date, today)) return 'Hoje'
  if (sameDay(date, yesterday)) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function ChatArea({ channel, messages, usersById, fallbackUser, onSend }: ChatAreaProps) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [channel.id, messages.length])

  function submit() {
    if (!draft.trim()) return
    onSend(draft)
    setDraft('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header do canal */}
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/[0.055] px-4">
        <span className="text-lg text-slate-500">#</span>
        <h2 className="text-[15px] font-semibold text-white">{channel.name}</h2>
        {channel.topic && (
          <>
            <span className="mx-1 h-4 w-px bg-white/[0.08]" />
            <p className="truncate text-[13px] text-slate-500">{channel.topic}</p>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" title="Pesquisar" className="icon-button">🔍</button>
          <button type="button" title="Fixar mensagens" className="icon-button">📌</button>
        </div>
      </header>

      {/* Área de mensagens */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-start justify-end pb-8">
            <div className="animate-scale-in flex h-16 w-16 items-center justify-center rounded-[20px] bg-accent/15 text-2xl text-accent-300">
              #
            </div>
            <h3 className="animate-fade-slide mt-4 text-xl font-bold text-white">
              Boas-vindas ao #{channel.name}!
            </h3>
            <p className="animate-fade-slide mt-1.5 text-[14px] text-slate-500">
              Este é o começo do canal. Envie a primeira mensagem abaixo.
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const user = usersById[message.userId] ?? fallbackUser
          if (!user) return null
          const group = groupLabel(message.createdAt)
          const prev = index > 0 ? messages[index - 1] : null
          const showDivider = !prev || groupLabel(prev.createdAt) !== group
          return (
            <div key={message.id}>
              {showDivider && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.055]" />
                  <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{group}</span>
                  <div className="h-px flex-1 bg-white/[0.055]" />
                </div>
              )}
              <div className="group/message animate-message-in relative flex gap-3 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.025]">
                <Avatar user={user} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[14px] font-medium text-white hover:underline cursor-pointer">
                      {user.displayName}
                    </span>
                    {user.role && (
                      <span className="rounded-[var(--radius-sm)] bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-300 uppercase">
                        {user.role}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
                    {message.edited && <span className="text-[11px] text-slate-600">(editado)</span>}
                  </div>
                  <p className="mt-0.5 text-[15px] leading-relaxed break-words text-slate-300">{message.content}</p>
                </div>
                {/* Ações da mensagem no hover */}
                <div className="absolute right-2 -top-3 hidden items-center gap-0.5 rounded-[var(--radius-md)] border border-white/[0.08] bg-surface-2 px-1 py-0.5 opacity-0 shadow-sm transition-all duration-150 group-hover/message:flex group-hover/message:opacity-100">
                  <button type="button" title="Reagir" className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white">😊</button>
                  <button type="button" title="Responder" className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white">↩</button>
                  <button type="button" title="Mais" className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-slate-400 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white">⋯</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-1">
        <div
          className={`flex items-center gap-1 rounded-[var(--radius-lg)] border px-3 py-2 transition-all duration-200 ${
            focused
              ? 'border-accent/30 bg-surface-3 shadow-[0_0_0_2px_var(--accent-glow)]'
              : 'border-white/[0.055] bg-surface-3'
          }`}
        >
          <button
            type="button"
            title="Anexar arquivo"
            onClick={() => window.alert('Anexos: em breve (mock).')}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-slate-500 transition-all duration-150 hover:bg-white/[0.06] hover:text-slate-300"
          >
            +
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Mensagem para #${channel.name}`}
            className="min-w-0 flex-1 bg-transparent px-2 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            title="Emoji"
            onClick={() => setDraft((d) => `${d}🙂`)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-slate-500 transition-all duration-150 hover:bg-white/[0.06] hover:text-slate-300"
          >
            ☺
          </button>
          <button
            type="button"
            title="Enviar"
            onClick={submit}
            disabled={!draft.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent text-white transition-all duration-150 hover:bg-accent-hover hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
