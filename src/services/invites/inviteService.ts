import { serverTimestamp } from 'firebase/database'
import { dbGet, dbUpdate } from '../db'
import { getServer } from '../servers/serverService'
import type { Server, ServerInvite } from '../../types'

/**
 * Convites de servidor por código curto.
 *   invites/{code} → { code, serverId, createdBy, createdAt }
 * Entrada no servidor: userServers/{uid}/{serverId} + members/{uid} (role 'member').
 */

// Alfabeto sem caracteres ambíguos (sem I, O, 0, 1).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 7

function randomCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return code
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Cria um novo código de convite para o servidor. */
export async function createInvite(serverId: string, uid: string): Promise<ServerInvite> {
  const code = randomCode()
  const invite: ServerInvite = { code, serverId, createdBy: uid, createdAt: serverTimestamp() }
  // Escrita atômica: convite + índice por servidor (permite reutilizar o código depois).
  await dbUpdate('', {
    [`invites/${code}`]: invite,
    [`serverInvites/${serverId}/${code}`]: true,
  })
  return invite
}

/**
 * Retorna um código de convite válido do servidor, criando um só se necessário.
 * Valida que o código do índice ainda existe (evita código órfão).
 */
export async function getOrCreateInviteCode(serverId: string, uid: string): Promise<string> {
  const index = (await dbGet<Record<string, boolean>>(`serverInvites/${serverId}`)) ?? {}
  const first = Object.keys(index)[0]
  if (first) {
    const existing = await getInvite(first)
    if (existing) return first
  }
  return (await createInvite(serverId, uid)).code
}

/** Busca o convite pelo código (null se inexistente). */
export async function getInvite(rawCode: string): Promise<ServerInvite | null> {
  return dbGet<ServerInvite>(`invites/${normalizeCode(rawCode)}`)
}

/**
 * Entra no servidor via código: valida convite + servidor e grava
 * userServers/{uid}/{serverId} + members/{uid} atomicamente. Idempotente.
 */
export async function joinServerByCode(rawCode: string, uid: string): Promise<Server> {
  const code = normalizeCode(rawCode)
  if (code.length < 6) throw new Error('Código de convite inválido. Confira e tente novamente.')

  const invite = await getInvite(code)
  if (!invite?.serverId) throw new Error('Convite não encontrado. Confira o código e tente novamente.')

  const server = await getServer(invite.serverId)
  if (!server) throw new Error('Este servidor não existe mais.')

  const alreadyMember = await dbGet(`servers/${server.id}/members/${uid}`)
  if (alreadyMember) return server

  await dbUpdate('', {
    [`userServers/${uid}/${server.id}`]: true,
    [`servers/${server.id}/members/${uid}`]: { userId: uid, role: 'member', joinedAt: serverTimestamp() },
    [`servers/${server.id}/updatedAt`]: serverTimestamp(),
  })
  return server
}