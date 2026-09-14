import { serverTimestamp } from 'firebase/database'
import { dbGet, dbPush, dbUpdate } from '../db'
import type { Channel, ChannelCategory, Server, ServerRole, User } from '../../types'

/**
 * Serviço real de servidores no Realtime Database.
 *
 * Estrutura (preparada para crescer):
 *   servers/{serverId}
 *     ├── id, name, icon, ownerId, createdAt, updatedAt
 *     ├── members/{uid} → { userId, role, joinedAt }
 *     ├── roles            (futuro: admin, moderator, member)
 *     ├── categories/{cat} → { name, type }
 *     ├── channels/{ch}    → { name, categoryId, type, createdAt }
 *     ├── invites          (futuro)
 *     ├── permissions      (futuro)
 *     ├── bans             (futuro)
 *     ├── settings         (futuro)
 *     └── audit logs       (futuro)
 *   userServers/{uid}/{serverId}: true   ← índice para descobrir servidores do usuário
 */

const SERVER_COLORS = ['#7c5cff', '#3ba55d', '#e06c5b', '#4d9de0', '#e5a83b', '#b565d8', '#5bc0be']
const DEFAULT_TEXT_CATEGORY = 'Canais de texto'
const DEFAULT_VOICE_CATEGORY = 'Canais de voz'
const DEFAULT_TEXT_CHANNEL = 'geral'
const DEFAULT_VOICE_CHANNEL = 'Geral'

export function serverInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'S'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function serverColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return SERVER_COLORS[hash % SERVER_COLORS.length]
}

export interface ServerMember {
  userId: string
  role: ServerRole
  joinedAt: unknown
}
/**
 * Cria um servidor real. ownerUid vem do Firebase Auth (nunca escolhido pelo cliente).
 * Cria owner/member, categorias, canais iniciais e o índice userServers.
 */
export async function createServer(input: { name: string; icon?: string; ownerUid: string }): Promise<Server> {
  const name = input.name.trim()
  if (!name) throw new Error('O nome do servidor é obrigatório.')
  if (!input.ownerUid) throw new Error('Usuário não autenticado.')

  const serverId = dbPush('servers')
  if (!serverId) throw new Error('Não foi possível criar o servidor.')

  const now = serverTimestamp()
  const server: Server = {
    id: serverId,
    name,
    initials: serverInitials(name),
    color: serverColor(name),
    icon: input.icon?.trim() || undefined,
    ownerId: input.ownerUid,
  }

  const textCatId = dbPush(`servers/${serverId}/categories`)
  const voiceCatId = dbPush(`servers/${serverId}/categories`)
  const textChId = dbPush(`servers/${serverId}/channels`)
  const voiceChId = dbPush(`servers/${serverId}/channels`)
  if (!textCatId || !voiceCatId || !textChId || !voiceChId) throw new Error('Não foi possível criar o servidor.')

  const updates: Record<string, unknown> = {
    [`servers/${serverId}/id`]: server.id,
    [`servers/${serverId}/name`]: server.name,
    [`servers/${serverId}/initials`]: server.initials,
    [`servers/${serverId}/color`]: server.color,
    [`servers/${serverId}/icon`]: server.icon ?? null,
    [`servers/${serverId}/ownerId`]: server.ownerId,
    [`servers/${serverId}/createdAt`]: now,
    [`servers/${serverId}/updatedAt`]: now,
    [`servers/${serverId}/members/${input.ownerUid}`]: {
      userId: input.ownerUid,
      role: 'owner',
      joinedAt: now,
    },
    [`servers/${serverId}/categories/${textCatId}`]: { name: DEFAULT_TEXT_CATEGORY, type: 'text' },
    [`servers/${serverId}/categories/${voiceCatId}`]: { name: DEFAULT_VOICE_CATEGORY, type: 'voice' },
    [`servers/${serverId}/channels/${textChId}`]: {
      id: textChId,
      name: DEFAULT_TEXT_CHANNEL,
      categoryId: textCatId,
      type: 'text',
      createdAt: now,
    },
    [`servers/${serverId}/channels/${voiceChId}`]: {
      id: voiceChId,
      name: DEFAULT_VOICE_CHANNEL,
      categoryId: voiceCatId,
      type: 'voice',
      createdAt: now,
    },
    [`userServers/${input.ownerUid}/${serverId}`]: true,
  }

  await dbUpdate('', updates)
  return server
}



/** Lista os servidores do usuário via índice userServers/{uid}. */
export async function listUserServers(uid: string): Promise<Server[]> {
  const index = (await dbGet<Record<string, unknown>>(`userServers/${uid}`)) ?? {}
  const ids = Object.keys(index)
  if (ids.length === 0) return []

  const results = await Promise.all(
    ids.map(async (serverId) => {
      const val = await dbGet<Server>(`servers/${serverId}`)
      if (!val) return null
      return { ...val, id: serverId }
    }),
  )
  return results.filter((s): s is Server => s !== null)
}

export async function getServer(serverId: string): Promise<Server | null> {
  const val = await dbGet<Server>(`servers/${serverId}`)
  if (!val) return null
  return { ...val, id: serverId }
}

export async function listServerCategories(serverId: string): Promise<ChannelCategory[]> {
  const val = (await dbGet<Record<string, { name: string; type: string }>>(`servers/${serverId}/categories`)) ?? {}
  return Object.entries(val).map(([id, data]) => ({
    id,
    serverId,
    name: data.name,
    type: data.type === 'voice' ? 'voice' : 'text',
  }))
}

export async function listServerChannels(serverId: string): Promise<Channel[]> {
  const val = (await dbGet<Record<string, Channel>>(`servers/${serverId}/channels`)) ?? {}
  return Object.entries(val).map(([id, data]) => ({
    ...data,
    id,
    serverId,
    categoryId: data.categoryId ?? null,
  }))
}

export async function listServerMembers(serverId: string): Promise<ServerMember[]> {
  const val = (await dbGet<Record<string, ServerMember>>(`servers/${serverId}/members`)) ?? {}
  return Object.entries(val).map(([userId, data]) => ({
    userId,
    role: (data.role ?? 'member') as ServerRole,
    joinedAt: data.joinedAt ?? null,
  }))
}

/** Arquitetura pronta para o dono criar canais/categorias (futuro). Validação via Rules. */
export async function createChannel(input: {
  serverId: string
  name: string
  type: 'text' | 'voice'
  categoryId: string | null
}): Promise<string> {
  const channelId = dbPush(`servers/${input.serverId}/channels`)
  if (!channelId) throw new Error('Não foi possível criar o canal.')
  await dbUpdate('', {
    [`servers/${input.serverId}/channels/${channelId}`]: {
      id: channelId,
      name: input.name.trim(),
      categoryId: input.categoryId,
      type: input.type,
      createdAt: serverTimestamp(),
    },
    [`servers/${input.serverId}/updatedAt`]: serverTimestamp(),
  })
  return channelId
}


/**
 * Membros do servidor com dados de perfil para a UI (MembersSidebar espera User[]).
 * Busca users/{uid} para cada member e deriva avatarColor do uid.
 */
export async function listMemberUsers(serverId: string): Promise<User[]> {
  const members = await listServerMembers(serverId)
  const users = await Promise.all(
    members.map(async (m) => {
      const p = await dbGet<Partial<User>>(`users/${m.userId}`)
      return {
        id: m.userId,
        username: p?.username ?? m.userId.slice(0, 6),
        displayName: p?.displayName ?? p?.username ?? 'Membro',
        avatarColor: p?.avatarColor ?? avatarColorFrom(m.userId),
        status: (p?.status ?? 'offline') as User['status'],
        role: m.role === 'owner' ? 'Dono' : m.role,
      } satisfies User
    }),
  )
  return users
}

export function avatarColorFrom(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  const palette = ['#7c5cff', '#3ba55d', '#e06c5b', '#4d9de0', '#e5a83b', '#b565d8', '#5bc0be']
  return palette[hash % palette.length]
}