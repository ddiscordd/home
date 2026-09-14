export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'

export interface User {
  id: string
  username: string
  displayName: string
  avatarColor: string
  status: UserStatus
  /** Role do servidor (ex.: owner/admin/member). */
  role?: string
  customStatus?: string
}

/** UID da conta administradora (tronux27@gmail.com, login Google). Descoberto via RTDB. */
export const ADMIN_UID = 'zVxzEQ3zI1gVRJTazBMh8TsOeFq2'

/** Papel global do usuário na aplicação. */
export type GlobalRole = 'admin' | 'user'

/** Role do servidor. Arquitetura pronta para crescer: owner → admin → moderator → member. */
export type ServerRole = 'owner' | 'admin' | 'moderator' | 'member'

export interface Server {
  id: string
  name: string
  initials: string
  color: string
  /** UID do dono (Firebase Auth). Nunca vem do cliente. */
  ownerId?: string
  icon?: string
  unreadCount?: number
  hasPing?: boolean
}

export type ChannelType = 'text' | 'voice'

export interface ChannelCategory {
  id: string
  serverId: string
  name: string
  /** 'text' = agrupa canais de texto; 'voice' = agrupa canais de voz. */
  type?: 'text' | 'voice'
}

export interface Channel {
  id: string
  serverId: string
  categoryId: string | null
  name: string
  type: ChannelType
  topic?: string
  unreadCount?: number
  connectedCount?: number
}

export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  createdAt: string
  edited?: boolean
}

export interface Membership {
  serverId: string
  userId: string
  role?: string
}

/** Estado central da aplicação (evita condições espalhadas). */
export type AppStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'ONBOARDING' | 'EMPTY_STATE' | 'SERVER_SELECTED' | 'LOADING_SERVER' | 'ERROR'

/** Amigo do usuário (perfil resumido para listas). */
export interface Friend {
  id: string
  username: string
  displayName: string
  avatarColor: string
  status: UserStatus
}

/** Convite de servidor: código curto salvo em invites/{code}. */
export interface ServerInvite {
  code: string
  serverId: string
  createdBy: string
  createdAt?: unknown
}

/** Convite de servidor recebido de um amigo (notificação in-app). */
export interface PendingInvite {
  id: string
  code: string
  serverId: string
  serverName: string
  fromUid: string
  fromName: string
  createdAt?: unknown
}

/** Solicitação de amizade (friendRequests/{id}). */
export interface FriendRequest {
  id: string
  fromUid: string
  toUid: string
  status: 'pending' | 'accepted' | 'declined' | 'canceled'
  createdAt?: unknown
}

/** Solicitação com dados do outro usuário (formato para a UI). */
export interface RequestInfo {
  id: string
  otherUid: string
  name: string
  username: string
  avatarColor: string
  createdAt?: unknown
}

/** Conversa privada (resumo em conversations/{convId}). */
export interface ConversationMeta {
  id: string
  participants: Record<string, boolean>
  lastMessage?: string
  lastMessageAt?: unknown
  createdAt?: unknown
}

/** Mensagem de conversa privada (dms/{convId}/{msgId}). */
export interface DmMessage {
  id: string
  senderId: string
  content: string
  createdAt?: unknown
  edited?: boolean
}

/** Vista principal da aplicação: servidor ou amigos. */
export type MainView = 'server' | 'friends'
