import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onValue, ref } from 'firebase/database'
import { useAuth } from './AuthContext'
import { firebaseDb } from '../lib/firebase'
import { getUserProfile, setOnboardingCompleted, type UserProfile } from '../services/users/userProfileService'
import { joinServerByCode } from '../services/invites/inviteService'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  dismissPendingInvite,
  listFriends,
  listIncomingRequests,
  removeFriend,
  sendFriendRequest,
} from '../services/friends/friendService'
import {
  conversationIdBetween,
  ensureConversation,
  getDmReadAt,
  markDmRead,
  sendDmMessage,
  watchConversationMessages,
} from '../services/dm/dmService'
import {
  createChannel as dbCreateChannel,
  createServer as dbCreateServer,
  listMemberUsers,
  listServerCategories,
  listServerChannels,
  listUserServers,
} from '../services/servers/serverService'
import type {
  AppStatus,
  Channel,
  ChannelCategory,
  ChannelType,
  DmMessage,
  Friend,
  MainView,
  PendingInvite,
  RequestInfo,
  Server,
  User,
} from '../types'

interface AppContextValue {
  uid: string | null
  status: AppStatus
  profile: UserProfile | null
  servers: Server[]
  activeServerId: string
  activeServer: Server | null
  channels: Channel[]
  categories: ChannelCategory[]
  members: User[]
  error: string | null
  selectServer: (serverId: string) => void
  createServer: (input: { name: string; icon?: string }) => Promise<void>
  createChannel: (input: { name: string; type: ChannelType; categoryId: string | null }) => Promise<void>
  completeOnboarding: () => Promise<void>
  completeOnboardingAndCreateServer: (input: { name: string; icon?: string }) => Promise<void>
  pendingInvites: PendingInvite[]
  friends: Friend[]
  /** Envia solicitação de amizade por @username. */
  addFriend: (username: string) => Promise<void>
  /** Remove a amizade dos dois lados. */
  removeFriendship: (friendUid: string) => Promise<void>
  /** Solicitações de amizade recebidas (tempo real). */
  incomingRequests: RequestInfo[]
  refreshRequests: () => Promise<void>
  acceptRequest: (requestId: string) => Promise<void>
  declineRequest: (requestId: string) => Promise<void>
  cancelRequest: (requestId: string) => Promise<void>
  /** Conversa privada em tempo real. */
  mainView: MainView
  setMainView: (view: MainView) => void
  activeDm: Friend | null
  openDm: (friend: Friend) => Promise<void>
  closeDm: () => void
  dmMessages: DmMessage[]
  sendDm: (content: string) => Promise<void>
  unreadDms: Record<string, boolean>
  /** Configurações (overlay interno). */
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  joinByCode: (code: string) => Promise<void>
  acceptInvite: (invite: PendingInvite) => Promise<void>
  dismissInvite: (notifId: string) => Promise<void>
  clearError: () => void
  retryBoot: () => void
  /** Recarrega o perfil do usuário (ex.: após trocar o username). */
  refreshProfile: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid ?? null

  const [status, setStatus] = useState<AppStatus>('AUTH_LOADING')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [servers, setServers] = useState<Server[]>([])
  const [activeServerId, setActiveServerId] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [categories, setCategories] = useState<ChannelCategory[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  /** Permite reexecutar o boot (ex.: botão "Tentar novamente" do estado ERROR). */
  const [bootNonce, setBootNonce] = useState(0)
  /** Convites de servidor recebidos de amigos (tempo real). */
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  /** Lista de amigos (carregada no boot, atualizada ao adicionar). */
  const [friends, setFriends] = useState<Friend[]>([])
  /** Solicitações de amizade recebidas (tempo real). */
  const [incomingRequests, setIncomingRequests] = useState<RequestInfo[]>([])
  /** Vista principal: servidor ou área de amigos. */
  const [mainView, setMainViewState] = useState<MainView>('server')
  /** Conversa privada aberta (amigo selecionado). */
  const [activeDm, setActiveDm] = useState<Friend | null>(null)
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([])
  /** Conversas com mensagens não lidas (convId → true). */
  const [unreadDms, setUnreadDms] = useState<Record<string, boolean>>({})
  /** Overlay de configurações. */
  const [settingsOpen, setSettingsOpen] = useState(false)
// 1) Carrega perfil + servidores quando autenticar (boot único).
  useEffect(() => {
    if (authLoading) {
      setStatus('AUTH_LOADING')
      return
    }
    if (!uid) {
      setProfile(null)
      setServers([])
      setStatus('AUTHENTICATED')
      return
    }
    let cancelled = false
    // uid com tipo garantido (narrowing não atravessa closures async).
    const myUid: string = uid
    async function boot() {
      setStatus('LOADING_SERVER')
      setError(null)
      try {
        const p = await getUserProfile(myUid)
        if (cancelled) return
        setProfile(p)
        // Amigos carregados no boot; falha não bloqueia a aplicação.
        listFriends(myUid)
          .then((list) => {
            if (!cancelled) setFriends(list)
          })
          .catch(() => undefined)
        if (!p || p.onboardingCompleted !== true) {
          setStatus('ONBOARDING')
          return
        }
        const userServers = await listUserServers(myUid)
        if (cancelled) return
        setServers(userServers)
        const first = userServers[0]
        if (!first) {
          setStatus('EMPTY_STATE')
          return
        }
        setActiveServerId(first.id)
        await loadServerData(first.id)
        if (!cancelled) setStatus('SERVER_SELECTED')
      } catch (err) {
        if (!cancelled) {
          // Mensagem amigável vinda da camada de banco (timeout/permissão) ou genérica.
          setError(
            err instanceof Error && err.message
              ? err.message
              : 'Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.',
          )
          setStatus('ERROR')
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, authLoading, bootNonce])

  // 2) Listener único dos convites recebidos (com cleanup — nunca vaza listener).
  useEffect(() => {
    if (!uid) {
      setPendingInvites([])
      return
    }
    const unsubscribe = onValue(
      ref(firebaseDb, `notifications/${uid}/invites`),
      (snap) => {
        const val = (snap.val() ?? {}) as Record<string, Omit<PendingInvite, 'id'>>
        setPendingInvites(Object.entries(val).map(([id, data]) => ({ ...data, id })))
      },
      () => setPendingInvites([]),
    )
    return unsubscribe
  }, [uid])

  const loadServerData = useCallback(async (serverId: string) => {
    const [chs, cats, mem] = await Promise.all([
      listServerChannels(serverId),
      listServerCategories(serverId),
      listMemberUsers(serverId),
    ])
    setChannels(chs)
    setCategories(cats)
    setMembers(mem)
  }, [])

  const selectServer = useCallback(
    async (serverId: string) => {
      if (!serverId) return
      setStatus('LOADING_SERVER')
      setError(null)
      setActiveServerId(serverId)
      try {
        await loadServerData(serverId)
        setStatus('SERVER_SELECTED')
      } catch {
        setError('Não foi possível abrir o servidor. Tente novamente.')
        setStatus('ERROR')
      }
    },
    [loadServerData],
  )

  const createServer = useCallback(
    async (input: { name: string; icon?: string }) => {
      if (!uid) {
        setError('Sua sessão expirou. Entre novamente.')
        return
      }
      setError(null)
      try {
        const created = await dbCreateServer({ name: input.name, icon: input.icon, ownerUid: uid })
        const remaining = await listUserServers(uid)
        setServers(remaining)
        setStatus('LOADING_SERVER')
        setActiveServerId(created.id)
        await loadServerData(created.id)
        setStatus('SERVER_SELECTED')
      } catch {
        const msg = 'Não foi possível criar o servidor. Verifique sua conexão e tente novamente.'
        setError(msg)
        // Mantém o status atual (o modal mostra o erro) e propaga para o chamador.
        throw new Error(msg)
      }
    },
    [uid, loadServerData],
  )

  // Cria canal de texto/voz no servidor ativo e recarrega a estrutura dele.
  const createChannel = useCallback(
    async (input: { name: string; type: ChannelType; categoryId: string | null }) => {
      if (!uid || !activeServerId) return
      setError(null)
      try {
        await dbCreateChannel({
          serverId: activeServerId,
          name: input.name,
          type: input.type,
          categoryId: input.categoryId,
        })
        await loadServerData(activeServerId)
      } catch {
        const msg = 'Não foi possível criar o canal. Tente novamente.'
        setError(msg)
        throw new Error(msg)
      }
    },
    [uid, activeServerId, loadServerData],
  )
  // 3) Solicitações de amizade recebidas em tempo real (onValue já dispara no início).
  useEffect(() => {
    if (!uid) {
      setIncomingRequests([])
      return
    }
    const unsub = onValue(
      ref(firebaseDb, `friendRequestsIn/${uid}`),
      () => {
        void listIncomingRequests(uid)
          .then(setIncomingRequests)
          .catch(() => undefined)
      },
      () => setIncomingRequests([]),
    )
    return unsub
  }, [uid])

  // 4) Badge de mensagens privadas não lidas (listener leve por conversa, com cleanup).
  useEffect(() => {
    if (!uid || friends.length === 0) {
      setUnreadDms({})
      return
    }
    let cancelled = false
    const unsubs: (() => void)[] = []
    const evaluate = async (convId: string, lastMessageAt: number) => {
      const readAt = await getDmReadAt(uid, convId)
      if (cancelled) return
      setUnreadDms((prev) => {
        const next = { ...prev }
        if (lastMessageAt > readAt) next[convId] = true
        else delete next[convId]
        return next
      })
    }
    for (const friend of friends) {
      const convId = conversationIdBetween(uid, friend.id)
      const unsub = onValue(ref(firebaseDb, `conversations/${convId}`), (snap) => {
        const meta = (snap.val() ?? null) as { lastMessageAt?: unknown } | null
        const lastMessageAt = typeof meta?.lastMessageAt === 'number' ? meta.lastMessageAt : 0
        if (lastMessageAt > 0) void evaluate(convId, lastMessageAt)
      })
      unsubs.push(unsub)
    }
    return () => {
      cancelled = true
      unsubs.forEach((u) => u())
    }
  }, [uid, friends])

  // 5) Mensagens da conversa privada aberta (listener ÚNICO, com cleanup).
  const activeDmConvId = activeDm && uid ? conversationIdBetween(uid, activeDm.id) : null
  useEffect(() => {
    if (!activeDmConvId || !uid) {
      setDmMessages([])
      return
    }
    const unsub = watchConversationMessages(activeDmConvId, setDmMessages)
    void markDmRead(uid, activeDmConvId).catch(() => undefined)
    setUnreadDms((prev) => {
      const next = { ...prev }
      delete next[activeDmConvId]
      return next
    })
    return unsub
  }, [activeDmConvId, uid])

const completeOnboarding = useCallback(async () => {
    if (!uid) return
    setError(null)
    try {
      await setOnboardingCompleted(uid)
      const userServers = await listUserServers(uid)
      setServers(userServers)
      if (userServers.length === 0) {
        setStatus('EMPTY_STATE')
      } else {
        const first = userServers[0]
        setActiveServerId(first.id)
        await loadServerData(first.id)
        setStatus('SERVER_SELECTED')
      }
    } catch {
      setError('Não foi possível salvar seu progresso. Tente novamente.')
      setStatus('ERROR')
    }
  }, [uid, loadServerData])

  const completeOnboardingAndCreateServer = useCallback(
    async (input: { name: string; icon?: string }) => {
      if (!uid) return
      setError(null)
      try {
        await setOnboardingCompleted(uid)
      } catch {
        setError('Não foi possível salvar seu progresso. Tente novamente.')
        setStatus('ERROR')
        return
      }
      await createServer(input)
    },
    [uid, createServer],
  )

  /** Recarrega a lista de servidores e ativa o preferido (ou o primeiro). */
  const refreshServersAndActivate = useCallback(
    async (preferredId?: string) => {
      if (!uid) return
      const all = await listUserServers(uid)
      setServers(all)
      const target = all.find((s) => s.id === preferredId) ?? all[0]
      if (!target) {
        setActiveServerId('')
        setStatus('EMPTY_STATE')
        return
      }
      setActiveServerId(target.id)
      await loadServerData(target.id)
      setStatus('SERVER_SELECTED')
    },
    [uid, loadServerData],
  )

  /** Entra em um servidor via código de convite (usado pelo JoinServerModal). */
  const joinByCode = useCallback(
    async (code: string) => {
      if (!uid) return
      const server = await joinServerByCode(code, uid)
      await refreshServersAndActivate(server.id)
    },
    [uid, refreshServersAndActivate],
  )

  /** Aceita convite recebido: entra no servidor e remove a notificação. */
  const acceptInvite = useCallback(
    async (invite: PendingInvite) => {
      if (!uid) return
      const server = await joinServerByCode(invite.code, uid)
      await dismissPendingInvite(uid, invite.id)
      await refreshServersAndActivate(server.id)
    },
    [uid, refreshServersAndActivate],
  )

  /** Descarta convite recebido sem entrar. */
  const dismissInvite = useCallback(
    async (notifId: string) => {
      if (!uid) return
      await dismissPendingInvite(uid, notifId)
    },
    [uid],
  )

  /** Envia solicitação de amizade por @username. */
  const addFriend = useCallback(
    async (username: string) => {
      if (!uid) return
      await sendFriendRequest(uid, username)
    },
    [uid],
  )

  /** Remove a amizade dos dois lados. */
  const removeFriendship = useCallback(
    async (friendUid: string) => {
      if (!uid) return
      await removeFriend(uid, friendUid)
      setFriends((prev) => prev.filter((f) => f.id !== friendUid))
    },
    [uid],
  )

  const refreshRequests = useCallback(async () => {
    if (!uid) return
    setIncomingRequests(await listIncomingRequests(uid))
  }, [uid])

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!uid) return
      await acceptFriendRequest(uid, requestId)
      setFriends(await listFriends(uid))
      await refreshRequests()
    },
    [uid, refreshRequests],
  )

  const declineRequest = useCallback(
    async (requestId: string) => {
      if (!uid) return
      await declineFriendRequest(uid, requestId)
      await refreshRequests()
    },
    [uid, refreshRequests],
  )

  const cancelRequest = useCallback(
    async (requestId: string) => {
      if (!uid) return
      await cancelFriendRequest(uid, requestId)
    },
    [uid],
  )

  /** Troca a vista principal; voltar ao servidor fecha a conversa privada. */
  const setMainView = useCallback((view: MainView) => {
    setMainViewState(view)
    if (view === 'server') setActiveDm(null)
  }, [])

  /** Abre (ou cria) a conversa privada 1:1 — mesmo ID para os dois lados. */
  const openDm = useCallback(
    async (friend: Friend) => {
      if (!uid) return
      await ensureConversation(uid, friend.id).catch(() => undefined)
      setMainViewState('friends')
      setActiveDm(friend)
      setSettingsOpen(false)
    },
    [uid],
  )

  const closeDm = useCallback(() => setActiveDm(null), [])

  const sendDm = useCallback(
    async (content: string) => {
      if (!uid || !activeDm) return
      await sendDmMessage(conversationIdBetween(uid, activeDm.id), uid, content)
    },
    [uid, activeDm],
  )

  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  /** Recarrega o perfil do usuário (ex.: após trocar o username). */
  const refreshProfile = useCallback(async () => {
    if (!uid) return
    try {
      const p = await getUserProfile(uid)
      if (p) setProfile(p)
    } catch {
      // Mantém o perfil atual em caso de falha transitória.
    }
  }, [uid])

  const clearError = useCallback(() => setError(null), [])
  const retryBoot = useCallback(() => setBootNonce((n) => n + 1), [])

  const activeServer = useMemo(
    () => servers.find((s) => s.id === activeServerId) ?? null,
    [servers, activeServerId],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      uid,
      status,
      profile,
      servers,
      activeServerId,
      activeServer,
      channels,
      categories,
      members,
      error,
      selectServer,
      createServer,
      createChannel,
      completeOnboarding,
      completeOnboardingAndCreateServer,
      pendingInvites,
      friends,
      addFriend,
      removeFriendship,
      incomingRequests,
      refreshRequests,
      acceptRequest,
      declineRequest,
      cancelRequest,
      mainView,
      setMainView,
      activeDm,
      openDm,
      closeDm,
      dmMessages,
      sendDm,
      unreadDms,
      settingsOpen,
      openSettings,
      closeSettings,
      joinByCode,
      acceptInvite,
      dismissInvite,
      clearError,
      retryBoot,
      refreshProfile,
    }),
    [
      uid,
      status,
      profile,
      servers,
      activeServerId,
      activeServer,
      channels,
      categories,
      members,
      error,
      selectServer,
      createServer,
      createChannel,
      completeOnboarding,
      completeOnboardingAndCreateServer,
      pendingInvites,
      friends,
      addFriend,
      removeFriendship,
      incomingRequests,
      refreshRequests,
      acceptRequest,
      declineRequest,
      cancelRequest,
      mainView,
      setMainView,
      activeDm,
      openDm,
      closeDm,
      dmMessages,
      sendDm,
      unreadDms,
      settingsOpen,
      openSettings,
      closeSettings,
      joinByCode,
      acceptInvite,
      dismissInvite,
      clearError,
      retryBoot,
      refreshProfile,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider.')
  return ctx
}