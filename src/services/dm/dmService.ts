import { onValue, ref, serverTimestamp } from 'firebase/database'
import { firebaseDb } from '../../lib/firebase'
import { dbGet, dbPush, dbSet, dbUpdate } from '../db'
import type { ConversationMeta, DmMessage } from '../../types'

/**
 * Conversas privadas 1:1 (amigos apenas).
 *   conversations/{convId}: { id, participants:{uidA:true,uidB:true}, createdAt, lastMessage, lastMessageAt }
 *   dms/{convId}/{msgId}:   { senderId, content, createdAt, edited? }
 *   dmState/{uid}/{convId}: timestamp da última leitura (base do badge "não lidas")
 *
 * O conversationId é DETERMINÍSTICO ([a,b].sort().join('_')), então A→B e B→A
 * sempre abrem a mesma conversa — impossível duplicar por ordem de clique.
 */

/** ID determinístico: a mesma conversa para A→B e B→A. */
export function conversationIdBetween(a: string, b: string): string {
  return [a, b].sort().join('_')
}

function toMs(value: unknown): number {
  return typeof value === 'number' ? value : 0
}

/** Cria a conversa se ela ainda não existir (idempotente). */
export async function ensureConversation(a: string, b: string): Promise<string> {
  const convId = conversationIdBetween(a, b)
  const existing = await dbGet<ConversationMeta>(`conversations/${convId}`)
  if (!existing) {
    await dbSet(`conversations/${convId}`, {
      id: convId,
      participants: { [a]: true, [b]: true },
      createdAt: serverTimestamp(),
    } as ConversationMeta)
  }
  return convId
}

/**
 * Listener em tempo real das mensagens (ordem cronológica).
 * Retorna a função de cleanup — SEMPRE usada pelo chamador (sem vazamento).
 */
export function watchConversationMessages(
  convId: string,
  onMessages: (messages: DmMessage[]) => void,
): () => void {
  return onValue(
    ref(firebaseDb, `dms/${convId}`),
    (snap) => {
      const val = (snap.val() ?? {}) as Record<string, Omit<DmMessage, 'id'>>
      const list = Object.entries(val)
        .map(([id, msg]) => ({ ...msg, id }))
        .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))
      onMessages(list)
    },
    () => onMessages([]),
  )
}

/** Envia mensagem + atualiza o resumo da conversa (para badges). */
export async function sendDmMessage(convId: string, senderId: string, content: string): Promise<void> {
  const trimmed = content.trim().slice(0, 2000)
  if (!trimmed) throw new Error('A mensagem não pode ficar vazia.')
  const msgId = dbPush(`dms/${convId}`)
  if (!msgId) throw new Error('Não foi possível enviar a mensagem. Tente novamente.')
  await dbUpdate(`dms/${convId}/${msgId}`, {
    senderId,
    content: trimmed,
    createdAt: serverTimestamp(),
  } as Omit<DmMessage, 'id'>)
  await dbUpdate(`conversations/${convId}`, {
    lastMessage: trimmed.slice(0, 80),
    lastMessageAt: serverTimestamp(),
  })
}

/** Marca a conversa como lida para o usuário. */
export async function markDmRead(uid: string, convId: string): Promise<void> {
  await dbSet(`dmState/${uid}/${convId}`, serverTimestamp())
}

/** Lê o timestamp de última leitura (para comparar com lastMessageAt). */
export async function getDmReadAt(uid: string, convId: string): Promise<number> {
  const value = await dbGet<unknown>(`dmState/${uid}/${convId}`)
  return toMs(value)
}