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
      <header className="flex items-center gap-2 border-b border-abyss-950/60 px-4 py-3">
        <span className="text-xl text-slate-500">#</span>
        <h2 className="text-[15px] font-bold text-white">{channel.name}</h2>
        {channel.topic && (
          <>
            <span className="hidden text-slate-600 sm:inline">|</span>
            <p className="hidden truncate text-[13px] text-slate-400 sm:block">{channel.topic}</p>
          </>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-start justify-end pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-abyss-600 text-2xl text-slate-300">
              #
            </div>
            <h3 className="mt-3 text-xl font-bold text-white">Boas-vindas ao #{channel.name}!</h3>
            <p className="mt-1 text-sm text-slate-400">Este é o começo do canal. Envie a primeira mensagem abaixo.</p>
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
                  <div className="h-px flex-1 bg-abyss-600/60" />
                  <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{group}</span>
                  <div className="h-px flex-1 bg-abyss-600/60" />
                </div>
              )}
              <div className="group flex gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-abyss-700/30">
                <Avatar user={user} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-white">
                      {user.displayName}
                    </span>
                    {user.role && (
                      <span className="rounded bg-abyss-600/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-300 uppercase">
                        {user.role}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
                    {message.edited && <span className="text-[11px] text-slate-500">(editado)</span>}
                  </div>
                  <p className="mt-0.5 text-[15px] leading-relaxed break-words text-slate-200">{message.content}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 pb-5">
        <div className="flex items-center gap-1 rounded-lg bg-abyss-700/60 px-2 py-2">
          <button
            type="button"
            title="Anexar arquivo"
            onClick={() => window.alert('Anexos: em breve (mock).')}
            className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-slate-400 transition-colors hover:bg-abyss-600 hover:text-white"
          >
            +
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Conversar em #${channel.name}`}
            className="min-w-0 flex-1 bg-transparent px-2 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            title="Emoji"
            onClick={() => setDraft((d) => `${d}🙂`)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-slate-400 transition-colors hover:bg-abyss-600 hover:text-white"
          >
            ☺
          </button>
          <button
            type="button"
            title="Enviar"
            onClick={submit}
            disabled={!draft.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-500 text-white transition-all hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
