import { useState } from 'react'
import { signInWithGoogle, signUpWithEmail } from '../../services/auth/authService'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { TextField } from '../../components/auth/TextField'
import { PrimaryButton } from '../../components/auth/PrimaryButton'
import { GoogleButton } from '../../components/auth/GoogleButton'

interface RegisterPageProps {
  onNavigateLogin: () => void
}

function messageFrom(err: unknown): string {
  return err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
}

export function RegisterPage({ onNavigateLogin }: RegisterPageProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string; confirm?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  function validate(): boolean {
    const errs: typeof fieldErrors = {}
    if (!username.trim()) errs.username = 'Digite seu nome de usuário.'
    if (!email.trim()) errs.email = 'Digite seu e-mail.'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Digite um e-mail válido.'
    if (!password) errs.password = 'Digite uma senha.'
    else if (password.length < 6) errs.password = 'A senha deve ter pelo menos 6 caracteres.'
    if (!confirm) errs.confirm = 'Confirme sua senha.'
    else if (confirm !== password) errs.confirm = 'As senhas não coinciden.'
    setFieldErrors(errs)
    setError(null)
    return Object.keys(errs).length === 0
  }

  async function handleRegister() {
    if (busy || !validate()) return
    setBusy(true)
    try {
      await signUpWithEmail({ displayName: username, email, password })
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
        <h1 className="text-2xl font-bold text-white">Criar conta</h1>
        <p className="text-sm text-slate-400">Junte-se à comunidade Concord.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void handleRegister()
        }}
        noValidate
      >
        <TextField id="reg-username" label="Nome de usuário" type="text" value={username} onChange={setUsername} autoComplete="username" error={fieldErrors.username} required />
        <TextField id="reg-email" label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" error={fieldErrors.email} required />
        <TextField id="reg-password" label="Senha" type="password" value={password} onChange={setPassword} autoComplete="new-password" error={fieldErrors.password} required />
        <TextField id="reg-confirm" label="Confirmar senha" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={fieldErrors.confirm} required />

        {error && (
          <p role="alert" className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
            {error}
          </p>
        )}

        <PrimaryButton loading={busy} disabled={googleBusy} onClick={() => void handleRegister()}>
          Criar conta
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">OU</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton loading={googleBusy} disabled={busy} onClick={() => void handleGoogle()} />

      <p className="mt-6 text-center text-sm text-slate-400">
        Já possui uma conta?{' '}
        <button type="button" onClick={onNavigateLogin} className="font-semibold text-accent-300 hover:text-accent-200 hover:underline">
          Entrar
        </button>
      </p>
    </AuthLayout>
  )
}