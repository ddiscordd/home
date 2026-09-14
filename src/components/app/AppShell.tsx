import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { avatarColorFrom } from '../../services/servers/serverService'
import type { Message, User } from '../../types'
import { AppLoading } from '../common/AppLoading'
import { ChannelSidebar } from '../channel-sidebar/ChannelSidebar'
import { ChatArea } from '../chat/ChatArea'
import { VoicePlaceholder } from '../chat/VoicePlaceholder'
import { DmChat } from '../dm/DmChat'
import { FriendsPage } from '../../pages/friends/FriendsPage'
import { MembersSidebar } from '../members-sidebar/MembersSidebar'
import { CreateChannelModal } from '../modals/CreateChannelModal'
import { CreateServerModal } from '../modals/CreateServerModal'
import { InviteModal } from '../modals/InviteModal'
import { JoinServerModal } from '../modals/JoinServerModal'
import { ServerSidebar } from '../server-sidebar/ServerSidebar'
import { UserPanel } from '../user-panel/UserPanel'
import { AdminEditorOverlay } from '../admin/AdminEditorOverlay'
import { EmptyState } from './EmptyState'

/**
 * Shell da aplicação com servidores/canais REAIS (Firebase) via AppContext.
 * Estados tratados aqui: EMPTY_STATE, SERVER_SELECTED, LOADING_SERVER e ERROR.
 */
export function AppShell() {
  const {
    status,
    servers,
    activeServer,
    activeServerId,
    channels,
    categories,
    members,
    error,
    selectServer,
    createServer,
    createChannel,
    activeDm,
    mainView,
    setMainView,
    unreadDms,
    retryBoot,
  } = useApp()
  const { user } = useAuth()

  const [activeChannelId, setActiveChannelId] = useState('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [serverModalOpen, setServerModalOpen] = useState(false)
  /** undefined = modal fechado; string|null = categoria inicial. */
  const [channelModalCategory, setChannelModalCategory] = useState<string | null | undefined>(undefined)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  /** Badge global do rail/sidebars: existe alguma conversa não lida? */
  const unreadFriends = Object.keys(unreadDms).length > 0
  const openFriends = () => setMainView('friends')

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? channels.find((c) => c.type === 'text') ?? null,
    [channels, activeChannelId],
  )

  // Usuário autenticado como membro (fallback caso o membro ainda não esteja listado).
  const currentUser = useMemo<User | null>(() => {
    if (!user) return null
    const member = members.find((m) => m.id === user.uid)
    if (member) return member
    return {
      id: user.uid,
      username: user.displayName?.replace(/\s+/g, '').toLowerCase() || user.email?.split('@')[0] || 'voce',
      displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Você',
      avatarColor: avatarColorFrom(user.uid),
      status: 'online',
    }
  }, [user, members])

  // Mapa usuário → UI (mensagens e membros).
  const usersById = useMemo(() => {
    const map: Record<string, User> = {}
    for (const m of members) map[m.id] = m
    if (currentUser) map[currentUser.id] = currentUser
    return map
  }, [members, currentUser])

  const visibleMessages = useMemo(
    () => (activeChannel ? localMessages.filter((m) => m.channelId === activeChannel.id) : []),
    [localMessages, activeChannel],
  )

  // Mensagens ainda são locais (persistência no Firebase vem em etapa futura).
  function handleSendMessage(content: string) {
    if (!activeChannel || !currentUser) return
    const trimmed = content.trim()
    if (!trimmed) return
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        channelId: activeChannel.id,
        userId: currentUser.id,
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  if (status === 'ERROR') {
    return (
      <div className="animate-fade-in flex h-full flex-col items-center justify-center gap-3 bg-abyss-900 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/15 text-2xl text-danger-400">
          !
        </span>
        <h2 className="text-lg font-bold text-white">Algo deu errado</h2>
        <p className="max-w-sm text-sm text-slate-400">{error ?? 'Tente novamente.'}</p>
        <button
          type="button"
          onClick={retryBoot}
          className="mt-2 h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 focus-visible:ring-2 focus-visible:ring-accent-300"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // Nenhum servidor: rail vazia (só "+") + estado vazio bonito. NUNCA mocks.
  if (status === 'EMPTY_STATE') {
    return (
      <div data-editor-id="app-shell" className="flex h-full bg-abyss-900 text-slate-200">
        <ServerSidebar
          servers={[]}
          activeServerId=""
          onSelect={() => undefined}
          onCreate={() => setServerModalOpen(true)}
          onOpenFriends={openFriends}
          friendsActive={mainView === 'friends'}
        />
        <EmptyState
          onCreateServer={() => setServerModalOpen(true)}
          onInvite={() => setJoinModalOpen(true)}
        />
        {serverModalOpen && (
          <CreateServerModal onClose={() => setServerModalOpen(false)} onCreate={createServer} />
        )}
        {joinModalOpen && <JoinServerModal onClose={() => setJoinModalOpen(false)} />}
        <AdminEditorOverlay />
      </div>
    )
  }

  if (!activeServer) return <AppLoading />

  const isOwner = !activeServer.ownerId || activeServer.ownerId === user?.uid
  const loading = status === 'LOADING_SERVER'

  return (
    <div
      aria-busy={loading}
      data-editor-id="app-shell"
      className="relative flex h-full bg-abyss-900 text-slate-200"
      style={{
        fontSize: 'var(--system-font-scale)',
        borderRadius: 'var(--system-radius)',
      }}
    >
      <ServerSidebar
        servers={servers}
        activeServerId={activeServerId}
        onSelect={selectServer}
        onCreate={() => setServerModalOpen(true)}
        onOpenFriends={openFriends}
        friendsActive={mainView === 'friends'}
        style={{ width: 'var(--system-rail-width)' }}
      />

      <div
        data-editor-id="navigation-sidebar"
        className="flex shrink-0 flex-col bg-abyss-850"
        style={{ width: 'var(--system-sidebar-width)' }}
      >
        <ChannelSidebar
          server={activeServer}
          categories={categories}
          channels={channels}
          activeChannelId={activeChannel?.id ?? ''}
          onSelectChannel={setActiveChannelId}
          onCreateChannel={(categoryId) => setChannelModalCategory(categoryId)}
          onInvite={() => setInviteModalOpen(true)}
          onOpenFriends={openFriends}
          friendsActive={mainView === 'friends'}
          unreadFriends={unreadFriends}
          isOwner={isOwner}
        />
        <UserPanel />
      </div>

      <main data-editor-id="main-content" className="flex min-w-0 flex-1 flex-col bg-abyss-800">
        {mainView === 'friends' ? (
          activeDm ? (
            <DmChat friend={activeDm} />
          ) : (
            <FriendsPage />
          )
        ) : !activeChannel ? (
          <div className="animate-fade-in flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-slate-400">Nenhum canal neste servidor ainda.</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => setChannelModalCategory(null)}
                className="h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
              >
                Criar canal
              </button>
            )}
          </div>
        ) : activeChannel.type === 'voice' ? (
          <VoicePlaceholder channel={activeChannel} />
        ) : (
          <ChatArea
            channel={activeChannel}
            messages={visibleMessages}
            usersById={usersById}
            fallbackUser={currentUser}
            onSend={handleSendMessage}
          />
        )}
      </main>

      {mainView === 'server' && (
        <aside
          data-editor-id="right-sidebar"
          className="hidden shrink-0 bg-abyss-850 xl:block"
          style={{ width: 'var(--system-sidebar-width)' }}
        >
          <MembersSidebar members={members} />
        </aside>
      )}

      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-abyss-950/70">
          <AppLoading />
        </div>
      )}

      {serverModalOpen && (
        <CreateServerModal onClose={() => setServerModalOpen(false)} onCreate={createServer} />
      )}
      {channelModalCategory !== undefined && (
        <CreateChannelModal
          categories={categories}
          initialCategoryId={channelModalCategory}
          onClose={() => setChannelModalCategory(undefined)}
          onCreate={createChannel}
        />
      )}
      {inviteModalOpen && activeServer && (
        <InviteModal server={activeServer} onClose={() => setInviteModalOpen(false)} />
      )}
      {joinModalOpen && <JoinServerModal onClose={() => setJoinModalOpen(false)} />}

      {/* Modo de edição administrativa (overlay sobre a MESMA tela) */}
      <AdminEditorOverlay />
    </div>
  )
}
