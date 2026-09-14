import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { changePassword, hasPasswordProvider, signOutUser } from '../../services/auth/authService'
import {
  changeUsername,
  isUsernameAvailable,
  validateUsername,
} from '../../services/users/userProfileService'
import {
  getUserAppearance,
  updateUserAppearance,
} from '../../services/systemSettings/systemSettingsService'
import { PersonalizacaoSection } from './AdminPersonalization'
import { useAdminEditor } from '../../components/admin/AdminEditorContext'
import type { User as FirebaseUser } from 'firebase/auth'
import { cn } from '../../utils/cn'

type SettingsSection = 'perfil' | 'senha' | 'aparencia' | 'personalizacao' | 'privacidade' | 'solicitacoes' | 'aplicacao' | 'logout'

interface SectionEntry {
  id: SettingsSection
  label: string
  category: string
  adminOnly?: boolean
}

const SECTIONS: SectionEntry[] = [
  { id: 'perfil', label: 'Perfil', category: 'Conta' },
  { id: 'senha', label: 'Conta', category: 'Conta' },
  { id: 'aparencia', label: 'Aparência', category: 'Aparência' },
  { id: 'personalizacao', label: 'Personalização avançada', category: 'Aparência' },
  { id: 'privacidade', label: 'Privacidade', category: 'Privacidade' },
  { id: 'solicitacoes', label: 'Solicitações', category: 'Amigos' },
  { id: 'aplicacao', label: 'Notificações', category: 'Aplicação' },
  { id: 'logout', label: 'Sair da conta', category: 'Perigo' },
]

/** Tela de configurações — overlay interno que preserva a aplicação por baixo. */
export function SettingsPage() {
  const { closeSettings, incomingRequests, setMainView } = useApp()
  const { user } = useAuth()
  const { enterEditorMode } = useAdminEditor()
  const [section, setSection] = useState<SettingsSection>('perfil')

  // Seções visíveis para todos os usuários
  const visibleSections = SECTIONS

  const requestCount = incomingRequests.length

  const badgeFor = (id: SettingsSection): string | null => (id === 'solicitacoes' && requestCount > 0 ? String(requestCount) : null)

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex bg-abyss-900 text-slate-200">
      {/* Navegação lateral de configurações */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-abyss-950/60 bg-abyss-950/60">
        <button
          type="button"
          onClick={closeSettings}
          className="flex h-10 items-center gap-2 border-b border-abyss-950/60 px-4 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-abyss-800 hover:text-white"
        >
          ← Voltar
        </button>
        <nav className="animate-fade-up min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {visibleSections.map((entry, index) => {
            const active = entry.id === section
            const badge = badgeFor(entry.id)
            return (
              <div key={entry.id}>
                <p className="px-2 pb-1 pt-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {entry.category}
                </p>
                <button
                  type="button"
                  onClick={() => setSection(entry.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors',
                    active ? 'bg-abyss-600 text-white' : 'text-slate-400 hover:bg-abyss-800 hover:text-slate-200',
                    entry.id === 'logout' && 'text-danger-400 hover:bg-danger-500/15 hover:text-danger-300',
                  )}
                >
                  {entry.label}
                  {badge && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </button>
                {/* espaçador visual após categoria */}
                {index === 1 || index === 3 || index === 5 ? <div className="h-2" /> : null}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Conteúdo da categoria */}
      <main className="animate-fade-slide min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          {section === 'perfil' && user && <PerfilSection user={user} />}
          {section === 'senha' && user && <SenhaSection user={user} />}
          {section === 'aparencia' && <AparenciaSection />}
          {section === 'personalizacao' && (
            <PersonalizacaoSection
              onEnterEditor={() => {
                setMainView('server')
                closeSettings()
                enterEditorMode()
              }}
            />
          )}
          {section === 'privacidade' && (
            <EmBreve title="Privacidade" note="Suas conversas privadas já são visíveis apenas aos participantes." />
          )}
          {section === 'solicitacoes' && (
            <section>
              <h1 className="text-lg font-bold text-white">Solicitações</h1>
              <p className="mt-1 text-sm text-slate-400">
                {requestCount > 0
                  ? `Você tem ${requestCount} solicitação(ões) pendente(s).`
                  : 'Nenhuma solicitação pendente no momento.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMainView('friends')
                  closeSettings()
                }}
                className="mt-4 h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
              >
                Abrir área de amigos
              </button>
            </section>
          )}
          {section === 'aplicacao' && (
            <EmBreve title="Notificações" note="Preferências de notificação chegam em uma etapa futura." />
          )}
          {section === 'logout' && <LogoutSection />}
        </div>
      </main>
    </div>
  )
}

// ---------- COMPONENTES DE SEÇÃO ----------

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-lg font-bold text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-up rounded-xl border border-abyss-950/40 bg-abyss-800/60 p-5">{children}</div>
  )
}

function Feedback({ tone, children }: { tone: 'ok' | 'err'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'err' ? 'alert' : 'status'}
      className={cn(
        'mt-3 rounded-lg px-3 py-2 text-sm',
        tone === 'ok' ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400',
      )}
    >
      {children}
    </p>
  )
}

// ---------- PERFIL ----------

function PerfilSection({ user }: { user: FirebaseUser }) {
  const { profile, refreshProfile } = useApp()
  const currentUsername = profile?.username ?? ''
  const [value, setValue] = useState(currentUsername)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Membro'
  const initial = displayName.charAt(0).toUpperCase()

  // Mantém o campo sincronizado quando o perfil é (re)carregado.
  useEffect(() => {
    setValue(currentUsername)
  }, [currentUsername])

  async function handleCheck() {
    if (checking) return
    const problem = validateUsername(value)
    if (problem) {
      setFeedback({ tone: 'err', text: problem })
      return
    }
    setChecking(true)
    setFeedback(null)
    try {
      const available = await isUsernameAvailable(value, user.uid)
      setFeedback(
        available
          ? { tone: 'ok', text: 'Nome de usuário disponível ✓' }
          : { tone: 'err', text: 'Esse nome de usuário já está em uso.' },
      )
    } catch {
      setFeedback({ tone: 'err', text: 'Não foi possível verificar. Tente novamente.' })
    } finally {
      setChecking(false)
    }
  }

  async function handleSave() {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const next = await changeUsername(user.uid, currentUsername, value)
      await refreshProfile(); setFeedback({ tone: 'ok', text: `Nome de usuário atualizado para @${next} ✓` })
    } catch (err) {
      setFeedback({ tone: 'err', text: err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle title="Perfil" subtitle="Suas informações visíveis para os amigos." />

      <Card>
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt={`Avatar de ${displayName}`} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-600 text-lg font-bold text-white">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-white">{displayName}</p>
            <p className="truncate text-sm text-slate-400">{user.email ?? 'Sem e-mail'}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              @{currentUsername || '—'} · status: online
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Nome de usuário</p>
        <p className="mt-1 mb-3 text-sm text-slate-400">
          Único e case-insensitive (Tronux27 e tronux27 são o mesmo nome). Mín. 3 · máx. 20 caracteres.
        </p>
        <div className="flex gap-2">
          <div className="flex h-10 min-w-0 flex-1 items-center rounded-lg border border-abyss-600 bg-abyss-800 transition-all focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/30">
            <span className="pl-3 text-slate-500" aria-hidden="true">
              @
            </span>
            <input
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setFeedback(null)
              }}
              maxLength={24}
              aria-label="Nome de usuário"
              placeholder="tronux27"
              className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleCheck()}
            disabled={checking || !value.trim()}
            className="h-10 shrink-0 rounded-lg border border-white/10 bg-abyss-700 px-4 text-sm font-medium text-slate-200 transition-colors hover:border-accent-400 hover:text-white disabled:opacity-50"
          >
            {checking ? '...' : 'Verificar'}
          </button>
        </div>
        {feedback && <Feedback tone={feedback.tone}>{feedback.text}</Feedback>}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy || !value.trim()}
          className="mt-4 h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 disabled:opacity-50"
        >
          {busy ? 'Salvando...' : 'Salvar'}
        </button>
      </Card>
    </section>
  )
}

// ---------- SENHA ----------

function SenhaSection({ user }: { user: FirebaseUser }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  // Conta Google: não existe senha para trocar (especificação item 60).
  if (!hasPasswordProvider(user)) {
    return (
      <section>
        <SectionTitle title="Minha conta" subtitle="Autenticação." />
        <Card>
          <p className="text-sm font-semibold text-white">Sua conta usa o Google</p>
          <p className="mt-1 text-sm text-slate-400">
            Esta conta entra pelo Google e não possui senha do Concord. Para gerenciar sua senha, use as
            configurações da sua conta Google.
          </p>
        </Card>
      </section>
    )
  }

  async function handleChange() {
    if (busy) return
    setFeedback(null)
    if (next.length < 6) {
      setFeedback({ tone: 'err', text: 'A nova senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    if (next !== confirm) {
      setFeedback({ tone: 'err', text: 'A confirmação não coincide com a nova senha.' })
      return
    }
    setBusy(true)
    try {
      await changePassword(user, current, next)
      setFeedback({ tone: 'ok', text: 'Senha atualizada ✓' })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setFeedback({
        tone: 'err',
        text:
          err instanceof Error && err.message !== 'Algo deu errado. Tente novamente em instantes.'
            ? err.message
            : 'Não foi possível alterar a senha. Confira a senha atual e tente novamente.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle title="Minha conta" subtitle="Altere sua senha com segurança (reautenticação automática)." />
      <Card>
        <div className="space-y-3">
          {[
            { label: 'Senha atual', value: current, set: setCurrent, autoComplete: 'current-password' },
            { label: 'Nova senha', value: next, set: setNext, autoComplete: 'new-password' },
            { label: 'Confirmar nova senha', value: confirm, set: setConfirm, autoComplete: 'new-password' },
          ].map((field) => (
            <div key={field.label}>
              <label
                htmlFor={`pwd-${field.autoComplete}-${field.label}`}
                className="mb-1 block text-[11px] font-bold tracking-wider text-slate-500 uppercase"
              >
                {field.label}
              </label>
              <input
                id={`pwd-${field.autoComplete}-${field.label}`}
                type="password"
                value={field.value}
                onChange={(event) => {
                  field.set(event.target.value)
                  setFeedback(null)
                }}
                autoComplete={field.autoComplete}
                aria-label={field.label}
                className="h-10 w-full rounded-lg border border-abyss-600 bg-abyss-800 px-3 text-[15px] text-slate-100 outline-none transition-all focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30"
              />
            </div>
          ))}
        </div>
        {feedback && <Feedback tone={feedback.tone}>{feedback.text}</Feedback>}
        <button
          type="button"
          onClick={() => void handleChange()}
          disabled={busy || !current || !next || !confirm}
          className="mt-4 h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 disabled:opacity-50"
        >
          {busy ? 'Alterando...' : 'Alterar senha'}
        </button>
      </Card>
    </section>
  )
}

// ---------- SAIR DA CONTA ----------

function LogoutSection() {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    if (busy) return
    setBusy(true)
    try {
      await signOutUser()
      // onAuthStateChanged cuida do redirecionamento para o login.
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle title="Sair da conta" subtitle="Você poderá entrar novamente quando quiser." />
      <Card>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy}
          className="h-10 rounded-lg bg-danger-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-danger-400 disabled:opacity-50"
        >
          Sair da conta
        </button>
      </Card>

      {/* Confirmação */}
      {confirming && (
        <div
          className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setConfirming(false)
          }}
        >
          <div className="animate-modal-in w-[380px] max-w-full rounded-xl border border-white/10 bg-abyss-800 p-6 shadow-2xl">
            <h2 id="logout-title" className="text-[15px] font-bold text-white">
              Sair da conta?
            </h2>
            <p className="mt-1 text-sm text-slate-400">Você poderá entrar novamente quando quiser.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-10 rounded-lg px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-abyss-700 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={busy}
                className="h-10 rounded-lg bg-danger-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-danger-400 disabled:opacity-50"
              >
                {busy ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ---------- APARÊNCIA (usuário comum: preferências pessoais) ----------

function AparenciaSection() {
  const { user } = useAuth()
  const [fontScale, setFontScale] = useState(1)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (!user) return
    getUserAppearance(user.uid)
      .then((saved) => {
        if (saved.fontScale) setFontScale(saved.fontScale)
      })
      .catch(() => undefined)
  }, [user])

  async function handleSave() {
    if (!user || saveState === 'saving') return
    setSaveState('saving')
    try {
      await updateUserAppearance(user.uid, { fontScale })
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  return (
    <section>
      <SectionTitle title="Aparência" subtitle="Preferências visuais da sua conta." />
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Tamanho da fonte</p>
            <p className="text-xs text-slate-400">Ajusta o texto da interface para você.</p>
          </div>
          <input
            type="range"
            min={0.85}
            max={1.25}
            step={0.05}
            value={fontScale}
            onChange={(e) => {
              setFontScale(Number(e.target.value))
              setSaveState('idle')
            }}
            aria-label="Tamanho da fonte"
            className="w-40 accent-accent-500"
          />
          <span className="w-12 text-right text-sm text-slate-300">{Math.round(fontScale * 100)}%</span>
        </div>
        {saveState === 'saved' && <Feedback tone="ok">Salvo ✓</Feedback>}
        {saveState === 'error' && <Feedback tone="err">Não foi possível salvar. Tente novamente.</Feedback>}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === 'saving'}
          className="mt-4 h-10 rounded-lg bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 disabled:opacity-50"
        >
          {saveState === 'saving' ? 'Salvando...' : 'Salvar'}
        </button>
      </Card>
    </section>
  )
}

// ---------- PERSONALIZAÇÃO AVANÇADA (apenas admin) ----------

function EmBreve({ title, note }: { title: string; note: string }) {
  return (
    <section>
      <SectionTitle title={title} subtitle="Em breve." />
      <Card>
        <p className="text-sm text-slate-400">{note}</p>
      </Card>
    </section>
  )
}