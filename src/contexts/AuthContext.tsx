import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getIdTokenResult, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { firebaseAuth } from '../lib/firebase'
import { ADMIN_UID, type GlobalRole } from '../types'
import { ensureUserProfile, touchLastSeen } from '../services/users/userProfileService'

interface AuthContextValue {
  user: FirebaseUser | null
  loading: boolean
  error: string | null
  /** Papel global: 'admin' apenas para o UID administrativo. */
  /** Papel global: 'admin' apenas para o UID administrativo. */
  role: GlobalRole
  /** true apenas para a conta administradora. */
  isAdmin: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  role: 'user',
  isAdmin: false,
  refreshProfile: async () => undefined,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [claimsAdmin, setClaimsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Failsafe: se o onAuthStateChanged não disparar em 15s (Firebase inacessível),
    // libera a UI com erro amigável em vez de carregar para sempre.
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        setLoading(false)
        setError('Não foi possível conectar ao serviço de login. Verifique sua internet e recarregue a página.')
      }
    }, 15000)

    // Listener único: Firebase persiste a sessão (IndexedDB) e re-hidrata aqui.
    const unsub = onAuthStateChanged(
      firebaseAuth,
      (u) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
        }
        setUser(u)
        setLoading(false)
        setError(null)
        if (u) {
          // Garante o perfil (cria em usuário novo) + lastSeen sem bloquear a UI.
          ensureUserProfile(u).catch(() => undefined)
          touchLastSeen(u.uid).catch(() => undefined)
          // Refresh do token: busca custom claims atualizadas (admin). Em
          // contas Google (como a administradora) o provider é google.com e o
          // fluxo é idêntico — só o UID/claim decide o papel.
          getIdTokenResult(u, true)
            .then((token) => setClaimsAdmin(token.claims.admin === true))
            .catch(() => setClaimsAdmin(false))
        } else {
          setClaimsAdmin(false)
        }
      },
      (err) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
        }
        setError('Não foi possível verificar sua sessão. Tente recarregar a página.')
        setLoading(false)
        void err
      },
    )
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const current = firebaseAuth.currentUser
    if (current) {
      await current.reload().catch(() => undefined)
      setUser(firebaseAuth.currentUser)
      const refreshed = await getIdTokenResult(current, true).catch(() => null)
      setClaimsAdmin(refreshed?.claims.admin === true)
    }
  }, [])

  // Resolução do papel: custom claim (quando o backend configurar) OU UID
  // administrativo conhecido como fallback de leitura (a escrita continua
  // protegida pelas Security Rules no servidor — nunca só pelo frontend).
  const isAdmin = claimsAdmin || user?.uid === ADMIN_UID
  const role: GlobalRole = isAdmin ? 'admin' : 'user'

  const value = useMemo(
    () => ({ user, loading, error, role, isAdmin, refreshProfile }),
    [user, loading, error, role, isAdmin, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
