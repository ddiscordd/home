import { useState } from 'react'
import { signInWithEmail, signInWithGoogle } from '../../services/auth/authService'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { TextField } from '../../components/auth/TextField'
import { PrimaryButton } from '../../components/auth/PrimaryButton'
import { GoogleButton } from '../../components/auth/GoogleButton'

interface LoginPageProps {
  onNavigateRegister: () => void
}

function messageFrom(err: unknown): string {
  return err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
}

export function LoginPage({ onNavigateRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  function validate(): boolean {
    setEmailError(null)
    setError(null)
    if (!email.trim()) {
      setEmailError('Digite seu e-mail.')
      return false
    }
    return true
  }

  async function handleLogin() {
    if (busy || !validate()) return
    setBusy(true)
    try {
      await signInWithEmail(email, password)
      // onAuthStateChanged leva o usuário à app automaticamente.
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    if (googleBusy) return
    setGoogleBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setGoogleBusy(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-2xl font-black text-accent-300">
          C
        </div>
        <h1 className="text-2xl font-bold text-white">Bem-vindo de volta!</h1>
        <p className="text-sm text-slate-400">Estamos felizes de ver você novamente.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void handleLogin()
        }}
        noValidate
      >
        <TextField id="login-email" label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" error={emailError} required />
        <div>
          <TextField id="login-password" label="Senha" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
          <button
            type="button"
            onClick={() => window.alert('Enviamos um link de recuperação por e-mail (demo).')}
            className="mt-1.5 text-xs font-medium text-accent-300 hover:text-accent-200 hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
            {error}
          </p>
        )}

        <PrimaryButton loading={busy} disabled={googleBusy} onClick={() => void handleLogin()}>
          Entrar
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">OU</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton loading={googleBusy} disabled={busy} onClick={() => void handleGoogle()} />

      <p className="mt-6 text-center text-sm text-slate-400">
        Ainda não possui uma conta?{' '}
        <button type="button" onClick={onNavigateRegister} className="font-semibold text-accent-300 hover:text-accent-200 hover:underline">
          Criar conta
        </button>
      </p>
    </AuthLayout>
  )
}