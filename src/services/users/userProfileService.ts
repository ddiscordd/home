import { serverTimestamp } from 'firebase/database'
import type { User as FirebaseUser } from 'firebase/auth'
import { dbGet, dbSet, dbUpdate } from '../db'

export interface UserProfile {
  uid: string
  username: string
  displayName: string
  email: string | null
  photoURL: string | null
  status: 'online' | 'idle' | 'dnd' | 'offline'
  createdAt: unknown
  lastSeen: unknown
  /** Controle de primeiro acesso. Persistido no banco. */
  onboardingCompleted?: boolean
}

export function usernameFrom(user: FirebaseUser): string {
  const fromEmail = user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9._-]/g, '') ?? ''
  const fallback = `user-${user.uid.slice(0, 6)}`
  return user.displayName?.replace(/\s+/g, '').toLowerCase().slice(0, 20) || fromEmail || fallback
}

/**
 * Busca o perfil completo do usuário. Retorna null se não existir (usuário novo).
 * Única fonte de verdade para "onboardingCompleted".
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return dbGet<UserProfile>(`users/${uid}`)
}

// Cria o perfil do usuário novo. Usuário novo NUNCA ganha servidor/canal/mensagem:
// apenas os dados mínimos + onboardingCompleted: false.
export async function createUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: user.uid,
    username: usernameFrom(user),
    displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Membro Concord',
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    status: 'online',
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    onboardingCompleted: false,
  }
  // Perfil + índice de usernames (permite buscar amigos pelo @username).
  await dbUpdate('', {
    [`users/${user.uid}`]: profile,
    [`usernames/${profile.username}`]: user.uid,
  })
  return profile
}

// Atualiza o perfil preservando tudo que já existe (nunca pisa dados).
export async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  const existing = await getUserProfile(user.uid)
  if (!existing) {
    await createUserProfile(user)
    return
  }

  // Reparo de contas antigas com username inválido (ex.: "undefined" no índice).
  let username = existing.username
  const usernameValid =
    !!username && username !== 'undefined' && USERNAME_RE.test(username) && username.length >= USERNAME_MIN
  if (!usernameValid) {
    const regenerated = validateUsername(usernameFrom(user)) === null
      ? usernameFrom(user)
      : `user-${user.uid.slice(0, 6).toLowerCase()}`
    const owner = await dbGet<string>(`usernames/${regenerated}`)
    if (!owner || owner === user.uid) {
      username = regenerated
      await dbUpdate('', {
        [`usernames/${username}`]: user.uid,
        [`users/${user.uid}/username`]: username,
      })
    }
  }

  // Backfill do índice de usernames para contas criadas antes dele.
  const indexedUid = await dbGet<string>(`usernames/${username}`)
  if (!indexedUid) {
    await dbSet(`usernames/${username}`, user.uid)
  }
  await dbUpdate(`users/${user.uid}`, {
    uid: user.uid,
    displayName: user.displayName ?? existing.displayName,
    email: user.email ?? existing.email ?? null,
    photoURL: user.photoURL ?? existing.photoURL ?? null,
    lastSeen: serverTimestamp(),
  } as Partial<UserProfile>)
}

/** Marca o onboarding como concluído (persistido). Chamado ao terminar tutorial ou pular. */
export async function setOnboardingCompleted(uid: string): Promise<void> {
  await dbUpdate(`users/${uid}`, {
    onboardingCompleted: true,
  })
}

// Atualiza apenas o lastSeen (presença simples; presença real vem em etapa futura).
export async function touchLastSeen(uid: string): Promise<void> {
  await dbUpdate(`users/${uid}`, {
    lastSeen: serverTimestamp(),
  })
}

// ---------- USERNAME (único, normalizado, case-insensitive) ----------

const USERNAME_MIN = 3
const USERNAME_MAX = 20
const USERNAME_RE = /^[a-z0-9._-]+$/

/** Normaliza: trim, minúsculas e remove @ inicial (busca sempre case-insensitive). */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, '')
}

/** Retorna a mensagem de erro ou null quando o formato é válido. */
export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw)
  if (!username) return 'Digite um nome de usuário.'
  if (username.length < USERNAME_MIN) return `Use pelo menos ${USERNAME_MIN} caracteres.`
  if (username.length > USERNAME_MAX) return `Use no máximo ${USERNAME_MAX} caracteres.`
  if (!USERNAME_RE.test(username)) return 'Use apenas letras, números, ponto, hífen e underline.'
  return null
}

/** Disponibilidade case-insensitive: Tronux27 e tronux27 colidem de propósito. */
export async function isUsernameAvailable(raw: string, myUid: string): Promise<boolean> {
  const owner = await dbGet<string>(`usernames/${normalizeUsername(raw)}`)
  return !owner || owner === myUid
}

/**
 * Troca o username com unicidade garantida. Uma única escrita multi-caminho
 * (atômica no RTDB): índice novo + índice antigo removido + perfil atualizado.
 */
export async function changeUsername(
  uid: string,
  currentUsername: string,
  nextRaw: string,
): Promise<string> {
  const problem = validateUsername(nextRaw)
  if (problem) throw new Error(problem)
  const next = normalizeUsername(nextRaw)
  if (next === currentUsername) return next

  const available = await isUsernameAvailable(next, uid)
  if (!available) throw new Error('Esse nome de usuário já está em uso.')

  await dbUpdate('', {
    [`usernames/${next}`]: uid,
    [`usernames/${currentUsername}`]: null,
    [`users/${uid}/username`]: next,
  })
  return next
}
