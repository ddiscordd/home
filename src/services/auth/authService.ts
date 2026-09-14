import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { firebaseAuth } from '../../lib/firebase'
import { ensureUserProfile, touchLastSeen } from '../users/userProfileService'

export type AuthErrorCode =
  | 'auth/email-already-in-use'
  | 'auth/invalid-email'
  | 'auth/weak-password'
  | 'auth/invalid-credential'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/popup-closed-by-user'
  | 'auth/popup-blocked'
  | 'auth/unauthorized-domain'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'unknown'

export class AuthError extends Error {
  code: AuthErrorCode
  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

function toAuthErrorCode(raw: unknown): AuthErrorCode {
  const code = (raw as { code?: string } | null)?.code
  const known: AuthErrorCode[] = [
    'auth/email-already-in-use',
    'auth/invalid-email',
    'auth/weak-password',
    'auth/invalid-credential',
    'auth/user-not-found',
    'auth/wrong-password',
    'auth/popup-closed-by-user',
    'auth/popup-blocked',
    'auth/unauthorized-domain',
    'auth/network-request-failed',
    'auth/too-many-requests',
  ]
  if (code && (known as string[]).includes(code)) return code as AuthErrorCode
  return 'unknown'
}

/** Mensagens amigáveis em pt-BR. Nunca vazar texto técnico do Firebase. */
export function friendlyAuthMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar ou use outro e-mail.'
    case 'auth/invalid-email':
      return 'Digite um e-mail válido.'
    case 'auth/weak-password':
      return 'Sua senha precisa ter pelo menos 6 caracteres.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos. Confira e tente novamente.'
    case 'auth/popup-closed-by-user':
      return 'A janela do Google foi fechada antes de concluir. Tente novamente.'
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.'
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado no Firebase. Peça para o desenvolvedor adicionar o domínio em Authentication > Settings > Authorized domains.'
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    default:
      return 'Algo deu errado. Tente novamente em instantes.'
  }
}

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    throw new AuthError(toAuthErrorCode(err), friendlyAuthMessage(toAuthErrorCode(err)))
  }
}

export interface SignUpInput {
  displayName: string
  email: string
  password: string
}

export async function signUpWithEmail({ displayName, email, password }: SignUpInput): Promise<FirebaseUser> {
  return wrap(async () => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)
    const name = displayName.trim()
    if (name && cred.user.displayName !== name) {
      await updateProfile(cred.user, { displayName: name })
    }
    await ensureUserProfile(cred.user)
    return cred.user
  })
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  return wrap(async () => {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
    await ensureUserProfile(cred.user)
    await touchLastSeen(cred.user.uid).catch(() => undefined)
    return cred.user
  })
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function signInWithGoogle(): Promise<FirebaseUser> {
  return wrap(async () => {
    const cred = await signInWithPopup(firebaseAuth, googleProvider)
    await ensureUserProfile(cred.user)
    await touchLastSeen(cred.user.uid).catch(() => undefined)
    return cred.user
  })
}

export async function sendResetPasswordEmail(email: string): Promise<void> {
  return wrap(async () => {
    await sendPasswordResetEmail(firebaseAuth, email.trim())
  })
}

export async function signOutUser(): Promise<void> {
  await signOut(firebaseAuth)
}

/** Contas Google não possuem credencial de senha para trocar. */
export function hasPasswordProvider(user: FirebaseUser): boolean {
  return user.providerData.some((p) => p.providerId === 'password')
}

/**
 * Altera a senha usando o mecanismo oficial do Firebase.
 * Reautentica com a senha atual antes de aplicar (resolve
 * auth/requires-recent-login na origem, sem expor erro técnico).
 */
export async function changePassword(
  user: FirebaseUser,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return wrap(async () => {
    if (!hasPasswordProvider(user)) {
      throw new AuthError('unknown', 'Esta conta entra pelo Google e não possui senha para alterar.')
    }
    const credential = EmailAuthProvider.credential(user.email ?? '', currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  })
}
