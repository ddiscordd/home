import { child, get, push, ref, remove, set, update } from 'firebase/database'
import { firebaseDb } from '../lib/firebase'
import { friendlyDbError, withTimeout } from '../utils/async'

const DB_TIMEOUT_MS = 12000

/**
 * Camada única de acesso ao Realtime Database.
 * Toda leitura/escrita do app passa por aqui para ter:
 * tempo limite (nunca carregar infinito) + erros amigáveis em português.
 * Futuros serviços (messages, invites, presence) devem usar estes wrappers.
 */

/** Leitura pontual. Retorna null se o caminho não existir. */
export async function dbGet<T = unknown>(path: string): Promise<T | null> {
  try {
    const snap = await withTimeout(get(child(ref(firebaseDb), path)), DB_TIMEOUT_MS, 'consulta ao banco')
    if (!snap.exists()) return null
    return snap.val() as T
  } catch (err) {
    throw friendlyDbError(err, 'Não foi possível consultar o banco de dados.')
  }
}

/** Escrita multi-caminho (path vazio = raiz do banco). */
export async function dbUpdate(path: string, values: object): Promise<void> {
  try {
    await withTimeout(update(ref(firebaseDb, path || '/'), values), DB_TIMEOUT_MS, 'gravação no banco')
  } catch (err) {
    throw friendlyDbError(err, 'Não foi possível salvar no banco de dados.')
  }
}

/** Escrita de um valor único em um caminho (inclui folhas como índices). */
export async function dbSet(path: string, value: unknown): Promise<void> {
  try {
    await withTimeout(set(ref(firebaseDb, path), value), DB_TIMEOUT_MS, 'gravação no banco')
  } catch (err) {
    throw friendlyDbError(err, 'Não foi possível salvar no banco de dados.')
  }
}

/** Gera uma nova chave push (ID único) no caminho indicado — síncrono, gera só o ID. */
export function dbPush(path: string): string {
  return push(ref(firebaseDb, path)).key ?? ''
}

/** Remoção de um caminho. */
export async function dbRemove(path: string): Promise<void> {
  try {
    await withTimeout(remove(ref(firebaseDb, path)), DB_TIMEOUT_MS, 'remoção no banco')
  } catch (err) {
    throw friendlyDbError(err, 'Não foi possível remover o dado.')
  }
}