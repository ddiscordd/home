import { useState } from 'react'
import { Modal } from '../common/Modal'
import { PrimaryButton } from '../auth/PrimaryButton'
import { useApp } from '../../contexts/AppContext'
import type { PendingInvite } from '../../types'

interface JoinServerModalProps {
  onClose: () => void
}

/** Entrar em servidor por código + lista de convites recebidos de amigos. */
export function JoinServerModal({ onClose }: JoinServerModalProps) {
  const { pendingInvites, joinByCode, acceptInvite, dismissInvite } = useApp()

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  async function handleJoin() {
    if (busy) return
    if (!code.trim()) {
      setError('Digite o código do convite.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await joinByCode(code)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar no servidor. Tente novamente.')
      setBusy(false)
    }
  }

  /** Aceita: entra no servidor E remove a notificação (via acceptInvite). */
  async function handleAccept(invite: PendingInvite) {
    if (acceptingId) return
    setAcceptingId(invite.id)
    setError(null)
    try {
      await acceptInvite(invite)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aceitar o convite. Tente novamente.')
      setAcceptingId(null)
    }
  }

  async function handleDismiss(inviteId: string) {
    if (dismissingId) return
    setDismissingId(inviteId)
    try {
      await dismissInvite(inviteId)
    } catch {
      setError('Não foi possível descartar o convite. Tente novamente.')
    } finally {
      setDismissingId(null)
    }
  }

  return (
    <Modal title="Entrar com convite" onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void handleJoin()
        }}
      >
        <label htmlFor="invite-code" className="mb-1.5 block text-[13px] font-medium text-slate-300">
          Código do convite
        </label>
        <div className="flex gap-2">
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EX: A7K2M9Q"
            maxLength={10}
            autoFocus
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-lg border border-abyss-600 bg-abyss-800 px-3 font-mono text-lg tracking-widest text-white uppercase outline-none transition-all placeholder:text-slate-500 placeholder:tracking-normal focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30"
          />
          <PrimaryButton loading={busy} onClick={() => void handleJoin()} className="w-auto px-5">
            Entrar
          </PrimaryButton>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
            {error}
          </p>
        )}
      </form>

      <div className="mt-5">
        <p className="mb-2 text-[13px] font-medium text-slate-300">Convites recebidos</p>
        {pendingInvites.length === 0 ? (
          <p className="rounded-lg bg-abyss-800 px-3 py-3 text-sm text-slate-400">
            Você não tem convites pendentes. Convites enviados por amigos aparecem aqui.
          </p>
        ) : (
          <ul className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="animate-fade-in flex items-center gap-2.5 rounded-lg bg-abyss-800 px-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500/20 text-sm text-accent-300"
                >
                  ✦
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-semibold text-white">{invite.serverName}</span>
                  <span className="block truncate text-xs text-slate-500">Enviado por {invite.fromName}</span>
                </span>
                <button
                  type="button"
                  disabled={acceptingId !== null || dismissingId !== null}
                  onClick={() => void handleAccept(invite)}
                  className="h-8 shrink-0 rounded-md bg-accent-500 px-3 text-xs font-semibold text-white transition-all hover:bg-accent-400 disabled:opacity-50"
                >
                  {acceptingId === invite.id ? 'Entrando…' : 'Aceitar'}
                </button>
                <button
                  type="button"
                  disabled={acceptingId !== null || dismissingId !== null}
                  onClick={() => void handleDismiss(invite.id)}
                  aria-label={`Descartar convite para ${invite.serverName}`}
                  className="h-8 w-8 shrink-0 rounded-md text-slate-400 transition-colors hover:bg-abyss-600 hover:text-white disabled:opacity-50"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}