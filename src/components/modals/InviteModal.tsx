import { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { getOrCreateInviteCode } from '../../services/invites/inviteService'
import { sendServerInviteToFriend } from '../../services/friends/friendService'
import type { Friend, Server } from '../../types'
import { cn } from '../../utils/cn'

interface InviteModalProps {
  server: Server
  onClose: () => void
}

/**
 * Convidar pessoas: código do servidor (copiável), adicionar amigo por
 * @username e envio do convite direto para cada amigo.
 */
export function InviteModal({ server, onClose }: InviteModalProps) {
  const { friends, addFriend } = useApp()
  const { user } = useAuth()

  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(true)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [friendInput, setFriendInput] = useState('')
  const [friendBusy, setFriendBusy] = useState(false)
  const [friendMsg, setFriendMsg] = useState<string | null>(null)
  const [friendErr, setFriendErr] = useState<string | null>(null)

  const [sentTo, setSentTo] = useState<Record<string, 'sending' | 'sent'>>({})
  const [sendErr, setSendErr] = useState<string | null>(null)

  // Garante um código de convite do servidor (cria apenas se não houver).
  // codeLoading já inicia true e o modal remonta a cada abertura.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    getOrCreateInviteCode(server.id, user.uid)
      .then((c) => {
        if (!cancelled) setCode(c)
      })
      .catch(() => {
        if (!cancelled) setCodeError('Não foi possível gerar o convite. Tente novamente.')
      })
      .finally(() => {
        if (!cancelled) setCodeLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [server.id, user])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCodeError('Não foi possível copiar automaticamente. Selecione o código e copie manualmente.')
    }
  }

  async function handleAddFriend() {
    if (friendBusy) return
    const username = friendInput.trim().replace(/^@+/, '')
    if (!username) return
    setFriendBusy(true)
    setFriendErr(null)
    setFriendMsg(null)
    try {
      await addFriend(username)
      setFriendMsg(`Solicitação enviada para @${username} ✓`)
      setFriendInput('')
    } catch (err) {
      setFriendErr(err instanceof Error ? err.message : 'Não foi possível adicionar. Tente novamente.')
    } finally {
      setFriendBusy(false)
    }
  }

  async function handleSend(friend: Friend) {
    if (!user || !code) return
    setSentTo((prev) => ({ ...prev, [friend.id]: 'sending' }))
    setSendErr(null)
    try {
      await sendServerInviteToFriend({
        friend,
        serverId: server.id,
        serverName: server.name,
        code,
        fromUid: user.uid,
        fromName: user.displayName?.trim() || user.email?.split('@')[0] || 'Alguém',
      })
      setSentTo((prev) => ({ ...prev, [friend.id]: 'sent' }))
    } catch {
      setSentTo((prev) => {
        const next = { ...prev }
        delete next[friend.id]
        return next
      })
      setSendErr(`Não foi possível enviar para ${friend.displayName}. Tente novamente.`)
    }
  }
  return (
    <Modal title={`Convidar pessoas — ${server.name}`} onClose={onClose}>
      <div className="space-y-5">
        <section>
          <p className="text-[13px] font-medium text-slate-300">Código do convite</p>
          <p className="mt-0.5 text-xs text-slate-500">Quem tiver este código pode entrar no servidor.</p>
          {codeLoading ? (
            <div className="mt-2 h-12 animate-pulse rounded-lg bg-abyss-800" />
          ) : codeError ? (
            <p role="alert" className="mt-2 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
              {codeError}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <p
                aria-live="polite"
                className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg border border-white/10 bg-abyss-800 font-mono text-xl tracking-[0.3em] text-white"
              >
                {code}
              </p>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="h-12 shrink-0 rounded-lg bg-accent-500 px-4 text-sm font-semibold text-white transition-all hover:bg-accent-400 active:bg-accent-600"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}
        </section>

        <section>
          <p className="text-[13px] font-medium text-slate-300">Adicionar amigo</p>
          <div className="mt-2 flex gap-2">
            <input
              value={friendInput}
              onChange={(e) => {
                setFriendInput(e.target.value)
                setFriendMsg(null)
                setFriendErr(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAddFriend()
              }}
              placeholder="@username"
              aria-label="Nome de usuário do amigo"
              maxLength={32}
              className="h-10 min-w-0 flex-1 rounded-lg border border-abyss-600 bg-abyss-800 px-3 text-[15px] text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30"
            />
            <button
              type="button"
              disabled={friendBusy || !friendInput.trim()}
              onClick={() => void handleAddFriend()}
              className="h-10 shrink-0 rounded-lg border border-white/10 bg-abyss-700 px-4 text-sm font-medium text-slate-200 transition-all hover:border-accent-400 hover:text-white disabled:opacity-50"
            >
              {friendBusy ? '...' : 'Enviar'}
            </button>
          </div>
          {friendErr && (
            <p role="alert" className="mt-2 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
              {friendErr}
            </p>
          )}
          {friendMsg && (
            <p aria-live="polite" className="mt-2 rounded-lg bg-success-500/10 px-3 py-2 text-sm text-success-400">
              {friendMsg}
            </p>
          )}
        </section>

        <section>
          <p className="text-[13px] font-medium text-slate-300">Enviar para amigos</p>
          {friends.length === 0 ? (
            <p className="mt-2 rounded-lg bg-abyss-800 px-3 py-3 text-sm text-slate-400">
              Você ainda não tem amigos. Adicione pelo @username acima para enviar convites diretos.
            </p>
          ) : (
            <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
              {friends.map((friend) => {
                const state = sentTo[friend.id]
                return (
                  <li
                    key={friend.id}
                    className="animate-fade-in flex items-center gap-2.5 rounded-lg bg-abyss-800 px-3 py-2"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: friend.avatarColor }}
                    >
                      {friend.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-semibold text-white">{friend.displayName}</span>
                      <span className="block truncate text-xs text-slate-500">@{friend.username}</span>
                    </span>
                    <button
                      type="button"
                      disabled={!code || state !== undefined}
                      onClick={() => void handleSend(friend)}
                      className={cn(
                        'h-8 shrink-0 rounded-md px-3 text-xs font-semibold transition-all',
                        state === 'sent'
                          ? 'bg-success-500/20 text-success-400'
                          : 'bg-accent-500 text-white hover:bg-accent-400 disabled:opacity-50',
                      )}
                    >
                      {state === 'sending' ? 'Enviando…' : state === 'sent' ? '✓ Enviado' : 'Enviar'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {sendErr && (
            <p role="alert" className="mt-2 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
              {sendErr}
            </p>
          )}
        </section>
      </div>
    </Modal>
  )
}