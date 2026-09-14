import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { listOutgoingRequests } from '../../services/friends/friendService'
import type { Friend, RequestInfo as RequestInfoUI } from '../../types'
import { cn } from '../../utils/cn'

type FriendsTab = 'todos' | 'online' | 'solicitacoes' | 'pendentes'

/** Área principal de amigos (não modal): lista, solicitações e chat privado. */
export function FriendsPage() {
  const {
    friends,
    incomingRequests,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriendship,
    addFriend,
    openDm,
    unreadDms,
  } = useApp()
  const { user } = useAuth()

  const [tab, setTab] = useState<FriendsTab>('online')
  const [addOpen, setAddOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const online = useMemo(() => friends.filter((f) => f.status !== 'offline'), [friends])
  const list = tab === 'todos' ? friends : online

  async function withBusy<T>(id: string, action: () => Promise<T>, okMessage?: string): Promise<void> {
    if (busyId) return
    setBusyId(id)
    setNotice(null)
    try {
      await action()
      if (okMessage) setNotice(okMessage)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível concluir. Tente novamente.')
    } finally {
      setBusyId(null)
    }
  }

  const tabs: { id: FriendsTab; label: string; count?: number }[] = [
    { id: 'online', label: 'Online', count: online.length },
    { id: 'todos', label: 'Todos', count: friends.length },
    { id: 'solicitacoes', label: 'Solicitações', count: incomingRequests.length },
    { id: 'pendentes', label: 'Pendentes' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col bg-abyss-800">
      {/* Header da área */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-abyss-950/60 px-4">
        <span className="text-lg text-slate-400" aria-hidden="true">
          👥
        </span>
        <h1 className="text-[15px] font-bold text-white">Amigos</h1>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-abyss-600" />
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            aria-pressed={tab === entry.id}
            className={cn(
              'flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors',
              tab === entry.id ? 'bg-abyss-600 text-white' : 'text-slate-400 hover:bg-abyss-700 hover:text-slate-200',
            )}
          >
            {entry.label}
            {entry.id === 'solicitacoes' && entry.count && entry.count > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                {entry.count}
              </span>
            ) : null}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="ml-auto h-7 rounded-md bg-success-500 px-3 text-xs font-bold text-white transition-colors hover:bg-success-500/80"
        >
          + Adicionar amigo
        </button>
      </header>

      {notice && (
        <p role="status" className="mx-4 mt-3 rounded-lg bg-accent-500/10 px-3 py-2 text-sm text-accent-300">
          {notice}
        </p>
      )}

      <div className="animate-fade-slide min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'solicitacoes' ? (
          <RequestsPanel
            busyId={busyId}
            onAccept={(requestId) => withBusy(requestId, () => acceptRequest(requestId), 'Agora vocês são amigos ✓')}
            onDecline={(requestId) => withBusy(requestId, () => declineRequest(requestId))}
          />
        ) : tab === 'pendentes' ? (
          <PendingPanel busyId={busyId} onCancel={(requestId) => withBusy(requestId, () => cancelRequest(requestId), 'Solicitação cancelada ✓')} />
        ) : (
          <FriendList
            friends={list}
            unreadDms={unreadDms}
            busyId={busyId}
            onMessage={(friend) => void openDm(friend)}
            onRemove={(friend) => withBusy(friend.id, () => removeFriendship(friend.id), 'Amigo removido ✓')}
          />
        )}
      </div>

      {addOpen && user && (
        <AddFriendModal
          onClose={() => setAddOpen(false)}
          onSubmit={(username) => withBusy('add', () => addFriend(username), 'Solicitação enviada ✓')}
        />
      )}
    </div>
  )
}

// ---------- LISTA DE AMIGOS ----------

function statusInfo(friend: Friend): { label: string; dot: string } {
  if (friend.status === 'offline') return { label: 'offline', dot: 'bg-slate-500' }
  if (friend.status === 'idle') return { label: 'ausente', dot: 'bg-amber-500' }
  if (friend.status === 'dnd') return { label: 'não perturbe', dot: 'bg-danger-500' }
  return { label: 'online', dot: 'bg-success-500' }
}

function FriendList({
  friends,
  unreadDms,
  busyId,
  onMessage,
  onRemove,
}: {
  friends: Friend[]
  unreadDms: Record<string, boolean>
  busyId: string | null
  onMessage: (friend: Friend) => void
  onRemove: (friend: Friend) => void
}) {
  if (friends.length === 0) {
    return (
      <div className="animate-fade-up flex h-full flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl" aria-hidden="true">
          ✦
        </span>
        <p className="text-[15px] font-bold text-white">Nenhum amigo por aqui ainda</p>
        <p className="max-w-xs text-sm text-slate-500">
          Use “Adicionar amigo” e procure por um @username. Quando a pessoa aceitar, ela aparece aqui.
        </p>
      </div>
    )
  }

  const groups = [
    { label: 'Online', list: friends.filter((f) => f.status !== 'offline') },
    { label: 'Offline', list: friends.filter((f) => f.status === 'offline') },
  ]

  return (
    <div className="space-y-5">
      {groups.map((group) =>
        group.list.length > 0 ? (
          <div key={group.label}>
            <p className="px-1 pb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {group.label} — {group.list.length}
            </p>
            <ul className="space-y-0.5">
              {group.list.map((friend, index) => {
                const info = statusInfo(friend)
                const hasUnread = unreadDms[friend.id] === true
                return (
                  <li
                    key={friend.id}
                    className="animate-fade-up group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-abyss-700/50"
                    style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
                  >
                    <span className="relative shrink-0">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: friend.avatarColor }}
                        aria-hidden="true"
                      >
                        {friend.displayName.charAt(0).toUpperCase()}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-[3px] border-abyss-800',
                          info.dot,
                        )}
                      />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-semibold text-slate-200">{friend.displayName}</span>
                        {hasUnread && (
                          <span
                            className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white"
                            aria-label="Mensagens não lidas"
                          >
                            •
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        @{friend.username} · {info.label}
                      </span>
                    </span>
                    <span className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => onMessage(friend)}
                        title={`Conversar com ${friend.displayName}`}
                        aria-label={`Conversar com ${friend.displayName}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-abyss-600 hover:text-white disabled:opacity-50"
                      >
                        ✉
                      </button>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => onRemove(friend)}
                        title={`Remover ${friend.displayName}`}
                        aria-label={`Remover ${friend.displayName}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-danger-500 hover:text-white disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  )
}

// ---------- SOLICITAÇÕES (recebidas) ----------

function RequestsPanel({
  busyId,
  onAccept,
  onDecline,
}: {
  busyId: string | null
  onAccept: (requestId: string) => void
  onDecline: (requestId: string) => void
}) {
  const { incomingRequests } = useApp()
  if (incomingRequests.length === 0) {
    return (
      <div className="animate-fade-up flex h-full flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl" aria-hidden="true">
          ✉
        </span>
        <p className="text-[15px] font-bold text-white">Nenhuma solicitação pendente</p>
        <p className="max-w-xs text-sm text-slate-500">
          Quando alguém te enviar uma solicitação de amizade, ela aparece aqui.
        </p>
      </div>
    )
  }
  return (
    <ul className="space-y-1">
      {incomingRequests.map((request, index) => (
        <li
          key={request.id}
          className="animate-fade-up flex items-center gap-2.5 rounded-lg bg-abyss-700/40 px-3 py-2.5"
          style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: request.avatarColor }}
            aria-hidden="true"
          >
            {request.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-white">{request.name}</span>
            <span className="block truncate text-xs text-slate-500">
              quer ser seu amigo · @{request.username}
            </span>
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => onAccept(request.id)}
              className="h-8 rounded-md bg-success-500 px-3 text-xs font-bold text-white transition-colors hover:bg-success-500/80 disabled:opacity-50"
            >
              {busyId === request.id ? '...' : 'Aceitar'}
            </button>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => onDecline(request.id)}
              aria-label={`Recusar solicitação de ${request.name}`}
              className="h-8 w-8 rounded-md text-slate-300 transition-colors hover:bg-danger-500 hover:text-white disabled:opacity-50"
            >
              ✕
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------- PENDENTES (enviadas por mim) ----------

function PendingPanel({
  busyId,
  onCancel,
}: {
  busyId: string | null
  onCancel: (requestId: string) => void
}) {
  const { uid } = useApp()
  const [outgoing, setOutgoing] = useState<RequestInfoUI[] | null>(null)

  // Carrega as solicitações enviadas quando a aba abre (com cleanup).
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    void listOutgoingRequests(uid)
      .then((list) => {
        if (!cancelled) setOutgoing(list)
      })
      .catch(() => {
        if (!cancelled) setOutgoing([])
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  if (outgoing === null) return <p className="text-sm text-slate-500">Carregando...</p>
  if (outgoing.length === 0) {
    return (
      <div className="animate-fade-up flex h-full flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl" aria-hidden="true">
          ⌛
        </span>
        <p className="text-[15px] font-bold text-white">Nenhuma solicitação enviada</p>
        <p className="max-w-xs text-sm text-slate-500">
          Solicitações que você enviou e ainda não foram respondidas aparecem aqui.
        </p>
      </div>
    )
  }
  return (
    <ul className="space-y-1">
      {outgoing.map((request, index) => (
        <li
          key={request.id}
          className="animate-fade-up flex items-center gap-2.5 rounded-lg bg-abyss-700/40 px-3 py-2.5"
          style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: request.avatarColor }}
            aria-hidden="true"
          >
            {request.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-white">{request.name}</span>
            <span className="block truncate text-xs text-slate-500">
              aguardando resposta · @{request.username}
            </span>
          </span>
          <button
            type="button"
            disabled={busyId !== null}
            onClick={() => onCancel(request.id)}
            className="ml-auto h-8 shrink-0 rounded-md border border-white/10 px-3 text-xs font-medium text-slate-300 transition-colors hover:border-danger-400 hover:text-danger-300 disabled:opacity-50"
          >
            {busyId === request.id ? '...' : 'Cancelar'}
          </button>
        </li>
      ))}
    </ul>
  )
}

// ---------- ADICIONAR AMIGO (modal) ----------

function AddFriendModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (username: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMessage, setOkMessage] = useState<string | null>(null)

  async function handleSend() {
    if (busy) return
    const username = value.trim().replace(/^@+/, '')
    if (!username) {
      setError('Digite o nome de usuário.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(username)
      setOkMessage(`Solicitação enviada para @${username} ✓`)
      setValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addfriend-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="animate-modal-in w-[420px] max-w-full rounded-xl border border-white/10 bg-abyss-800 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="addfriend-title" className="text-[15px] font-bold text-white">
            Adicionar amigo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-abyss-700 hover:text-white"
          >
            ✕
          </button>
        </div>
        <label
          htmlFor="addfriend-input"
          className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase"
        >
          Digite o nome de usuário
        </label>
        <input
          id="addfriend-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
            setOkMessage(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleSend()
          }}
          maxLength={24}
          placeholder="@nomeusuario"
          autoFocus
          aria-label="Nome de usuário do amigo"
          className="h-10 w-full rounded-lg border border-abyss-600 bg-abyss-800 px-3 text-[15px] text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30"
        />
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
            {error}
          </p>
        )}
        {okMessage && (
          <p role="status" className="mt-3 rounded-lg bg-success-500/10 px-3 py-2 text-sm text-success-400">
            {okMessage}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-abyss-700 hover:text-white"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={busy || !value.trim()}
            className="h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 disabled:opacity-50"
          >
            {busy ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </div>
    </div>
  )
}