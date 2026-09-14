import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import type { DmMessage, Friend } from '../../types'
import { cn } from '../../utils/cn'

interface DmChatProps {
  friend: Friend
}

/**
 * Conversa privada 1:1 em tempo real (dms/{convId}).
 * Apenas os dois participantes têm acesso (rules do RTDB).
 */
export function DmChat({ friend }: DmChatProps) {
  const { dmMessages, sendDm, closeDm, uid } = useApp()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Rolagem automática para a mensagem mais recente.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [dmMessages.length])

  const statusLabel =
    friend.status === 'offline'
      ? 'offline'
      : friend.status === 'idle'
        ? 'ausente'
        : friend.status === 'dnd'
          ? 'não perturbe'
          : 'online'

  async function submit() {
    const content = draft.trim()
    if (!content || busy) return
    setBusy(true)
    setError(null)
    try {
      await sendDm(content)
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-2">
      {/* Header do chat privado */}
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/[0.055] px-4">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: friend.avatarColor }}
          aria-hidden="true"
        >
          {friend.displayName.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-bold text-white">{friend.displayName}</span>
          <span className="block truncate text-xs text-slate-500">
            @{friend.username} · {statusLabel}
          </span>
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={closeDm}
            title="Fechar conversa"
            aria-label="Fechar conversa"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-abyss-600 hover:text-white"
          >
            ✕
          </button>
        </span>
      </header>

      {/* Mensagens (ordem cronológica) */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {dmMessages.length === 0 ? (
          <div className="animate-fade-in flex h-full flex-col items-center justify-center gap-2 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{ backgroundColor: friend.avatarColor }}
              aria-hidden="true"
            >
              {friend.displayName.charAt(0).toUpperCase()}
            </span>
            <p className="text-[15px] font-bold text-white">Esta é a sua conversa com {friend.displayName}</p>
            <p className="max-w-xs text-sm text-slate-500">
              Só vocês dois podem ver as mensagens desta conversa.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {dmMessages.map((message, index) => (
              <DmRow
                key={message.id}
                message={message}
                index={index}
                mine={message.senderId === uid}
                friendColor={friend.avatarColor}
              />
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="mx-4 mb-2 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
          {error}
        </p>
      )}

      {/* Composer: Enter = enviar · Shift+Enter = nova linha */}
      <form
        className="mx-4 mb-4"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <div className="flex items-end gap-2 rounded-xl bg-abyss-700 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-accent-400/40">
          <button type="button" title="Anexar" aria-label="Anexar" className="pb-1.5 text-lg text-slate-400 transition-colors hover:text-white">
            📎
          </button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void submit()
              }
            }}
            rows={1}
            maxLength={2000}
            aria-label={`Mensagem para ${friend.displayName}`}
            placeholder={`Conversar com ${friend.displayName}`}
            className="max-h-32 min-h-6 flex-1 resize-none bg-transparent py-1 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button type="button" title="Emoji" aria-label="Emoji" className="pb-1.5 text-lg text-slate-400 transition-colors hover:text-white">
            😊
          </button>
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            title="Enviar"
            aria-label="Enviar mensagem"
            className={cn(
              'pb-1.5 text-lg transition-colors',
              draft.trim() ? 'text-accent-400 hover:text-accent-300' : 'cursor-not-allowed text-slate-600',
            )}
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  )
}

function DmRow({
  message,
  index,
  mine,
  friendColor,
}: {
  message: DmMessage
  index: number
  mine: boolean
  friendColor: string
}) {
  const when =
    typeof message.createdAt === 'number'
      ? new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : ''
  return (
    <li
      className="animate-fade-up flex items-start gap-2.5"
      style={{ animationDelay: `${Math.min(index * 25, 150)}ms` }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: mine ? '#5865f2' : friendColor }}
        aria-hidden="true"
      >
        {mine ? 'V' : 'A'}
      </span>
      <span className="min-w-0 leading-snug">
        <span className="flex items-baseline gap-2">
          <span className={cn('text-[14px] font-bold', mine ? 'text-accent-300' : 'text-slate-200')}>
            {mine ? 'Você' : ''}
          </span>
          {when && <span className="text-[11px] text-slate-600">{when}</span>}
        </span>
        <span className="block whitespace-pre-wrap break-words text-[15px] text-slate-300">{message.content}</span>
      </span>
    </li>
  )
}