import { serverTimestamp } from 'firebase/database'
import { dbGet, dbPush, dbRemove, dbSet, dbUpdate } from '../db'

export interface SystemAppearance {
  colors?: Record<string, string>
  sizes?: Record<string, string>
  hiddenButtons?: string[]
  customButtons?: { id: string; label: string; icon: string; action: string; order: number }[]
}

const SYSTEM_SETTINGS_PATH = 'systemSettings/appearance'

export async function getSystemAppearance(): Promise<SystemAppearance> {
  return (await dbGet<SystemAppearance>(SYSTEM_SETTINGS_PATH)) ?? {}
}

export async function updateSystemAppearance(data: Partial<SystemAppearance>): Promise<void> {
  await dbUpdate(SYSTEM_SETTINGS_PATH, data)
}

export async function removeSystemAppearance(): Promise<void> {
  await dbRemove(SYSTEM_SETTINGS_PATH)
}

// ---- Auditoria administrativa ----

export interface AdminAction {
  adminUid: string
  action: string
  target?: string
  oldValue?: string
  newValue?: string
  createdAt?: unknown
}

/**
 * Registra uma ação administrativa (auditoria). Sem Admin SDK no frontend:
 * a gravação é validada pelas Security Rules (só o UID admin escreve).
 */
export async function logAdminAction(input: {
  adminUid: string
  action: string
  target?: string
  oldValue?: string
  newValue?: string
}): Promise<void> {
  const id = dbPush('adminActions')
  if (!id) return
  const entry: AdminAction = {
    adminUid: input.adminUid,
    action: input.action,
    target: input.target,
    oldValue: input.oldValue,
    newValue: input.newValue,
    createdAt: serverTimestamp(),
  }
  await dbSet(`adminActions/${id}`, entry)
}

// ---- User settings ----

export interface UserAppearance {
  colors?: Record<string, string>
  sizes?: Record<string, string>
  hiddenButtons?: string[]
  fontScale?: number
  sidebarWidth?: number
}

const userPath = (uid: string) => `userSettings/${uid}/appearance`

export async function getUserAppearance(uid: string): Promise<UserAppearance> {
  return (await dbGet<UserAppearance>(userPath(uid))) ?? {}
}

export async function updateUserAppearance(uid: string, data: Partial<UserAppearance>): Promise<void> {
  await dbUpdate(userPath(uid), data)
}

export async function removeUserAppearance(uid: string): Promise<void> {
  await dbRemove(userPath(uid))
}