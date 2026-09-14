import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getSystemAppearance,
  logAdminAction,
  removeSystemAppearance,
  updateSystemAppearance,
  type SystemAppearance,
} from '../../services/systemSettings/systemSettingsService'

interface PersonalizacaoSectionProps {
  /** Fecha as Configurações e ativa o modo editor na TELA PRINCIPAL. */
  onEnterEditor: () => void
}

/** Elementos editáveis: rótulo → variável CSS aplicada na raiz. */
export const COLOR_TARGETS: { key: string; label: string; variable: string }[] = [
  { key: 'bg', label: 'Fundo principal', variable: '--system-bg' },
  { key: 'rail', label: 'Server rail', variable: '--system-rail' },
  { key: 'sidebar', label: 'Sidebar', variable: '--system-sidebar' },
  { key: 'chat', label: 'Chat', variable: '--system-chat' },
  { key: 'header', label: 'Header', variable: '--system-header' },
  { key: 'panel', label: 'Painel direito', variable: '--system-panel' },
  { key: 'text', label: 'Texto', variable: '--system-text' },
  { key: 'textSecondary', label: 'Texto secundário', variable: '--system-text-secondary' },
  { key: 'accent', label: 'Destaque', variable: '--system-accent' },
  { key: 'input', label: 'Inputs', variable: '--system-input' },
  { key: 'button', label: 'Botões', variable: '--system-button' },
  { key: 'hover', label: 'Hover', variable: '--system-hover' },
]

export const SIZE_TARGETS: { key: string; label: string; variable: string; min: number; max: number; unit: string }[] = [
  { key: 'railWidth', label: 'Largura do server rail', variable: '--system-rail-width', min: 56, max: 96, unit: 'px' },
  { key: 'sidebarWidth', label: 'Largura da sidebar', variable: '--system-sidebar-width', min: 200, max: 320, unit: 'px' },
  { key: 'headerHeight', label: 'Altura do header', variable: '--system-header-height', min: 32, max: 64, unit: 'px' },
  { key: 'fontScale', label: 'Escala de fonte', variable: '--system-font-scale', min: 85, max: 125, unit: '%' },
  { key: 'radius', label: 'Arredondamento', variable: '--system-radius', min: 0, max: 16, unit: 'px' },
]

export type SaveState = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

/** Aplica o dicionário de cores/tamanhos nas variáveis CSS da raiz. */
export function applySystemAppearance(appearance: SystemAppearance): void {
  const root = document.documentElement
  for (const target of COLOR_TARGETS) {
    const value = appearance.colors?.[target.key]
    if (value && isHexColor(value)) root.style.setProperty(target.variable, value)
    else root.style.removeProperty(target.variable)
  }
  for (const target of SIZE_TARGETS) {
    const value = appearance.sizes?.[target.key]
    if (value) root.style.setProperty(target.variable, value)
    else root.style.removeProperty(target.variable)
  }
}
export function PersonalizacaoSection({ onEnterEditor: _onEnterEditor }: PersonalizacaoSectionProps) {
  const { user, isAdmin } = useAuth()
  const [colors, setColors] = useState<Record<string, string>>({})
  const [sizes, setSizes] = useState<Record<string, string>>({})
  const [hiddenButtons, setHiddenButtons] = useState<string[]>([])
  const [saveState, setSaveState] = useState<SaveState>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [newBtnLabel, setNewBtnLabel] = useState('')
  const [editMode, setEditMode] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    getSystemAppearance()
      .then((saved) => {
        if (cancelled) return
        setColors(saved.colors ?? {})
        setSizes(saved.sizes ?? {})
        setHiddenButtons(saved.hiddenButtons ?? [])
        applySystemAppearance(saved)
        setSaveState('idle')
      })
      .catch(() => {
        if (!cancelled) setSaveState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function scheduleSave(next: { colors: Record<string, string>; sizes: Record<string, string>; hiddenButtons: string[] }) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    setErrorMsg(null)
    saveTimer.current = setTimeout(() => {
      if (!user) return
      updateSystemAppearance(next)
        .then(() => {
          setSaveState('saved')
          return logAdminAction({ adminUid: user.uid, action: 'theme_changed', target: 'appearance' })
        })
        .catch(() => {
          setSaveState('error')
          setErrorMsg('Sem permissão para salvar. Confira as Security Rules (systemSettings).')
        })
    }, 600)
  }

  function handleColor(key: string, value: string) {
    const next = { ...colors, [key]: value }
    setColors(next)
    applySystemAppearance({ colors: next, sizes })
    scheduleSave({ colors: next, sizes, hiddenButtons })
  }

  function handleSize(key: string, numeric: number, unit: string) {
    const next = { ...sizes, [key]: `${numeric}${unit}` }
    setSizes(next)
    applySystemAppearance({ colors, sizes: next })
    scheduleSave({ colors, sizes: next, hiddenButtons })
  }

  function sizeValue(key: string, fallback: number): number {
    const parsed = sizes[key] ? parseFloat(sizes[key]) : NaN
    return Number.isFinite(parsed) ? parsed : fallback
  }

  async function handleRestore() {
    if (!user || !window.confirm('Restaurar a aparência padrão para todos os usuários?')) return
    setSaveState('saving')
    try {
      await removeSystemAppearance()
      setColors({})
      setSizes({})
      setHiddenButtons([])
      applySystemAppearance({})
      await logAdminAction({ adminUid: user.uid, action: 'theme_restored', target: 'appearance' })
      setSaveState('saved')
    } catch {
      setSaveState('error')
      setErrorMsg('Sem permissão para restaurar. Confira as Security Rules (systemSettings).')
    }
  }

  if (!isAdmin) return null
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Personalização avançada</h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Controle completo da aparência da aplicação.{' '}
          <span className="text-slate-500">
            {saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo ✓' : saveState === 'error' ? 'Não foi possível salvar' : ''}
          </span>
        </p>
      </div>
      {errorMsg && (
        <p role="alert" className="mb-3 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">{errorMsg}</p>
      )}
      <div className="rounded-xl border border-white/10 bg-abyss-850 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Ativar modo de edição</p>
            <p className="text-xs text-slate-400">Destaca os elementos editáveis da interface.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={editMode}
            onClick={() => setEditMode((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${editMode ? 'bg-accent-500' : 'bg-abyss-600'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${editMode ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-abyss-850 p-4">
        <h3 className="text-sm font-bold text-white">Cores por elemento</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COLOR_TARGETS.map((target) => (
            <label key={target.key} className="flex items-center justify-between gap-3 rounded-lg bg-abyss-800 px-3 py-2">
              <span className="text-[13px] text-slate-300">{target.label}</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={isHexColor(colors[target.key] ?? '') ? colors[target.key] : '#7c5cff'}
                  onChange={(e) => handleColor(target.key, e.target.value)}
                  aria-label={`Cor de ${target.label}`}
                  className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={colors[target.key] ?? ''}
                  onChange={(e) => handleColor(target.key, e.target.value)}
                  placeholder="#7c5cff"
                  maxLength={7}
                  aria-label={`Hexadecimal de ${target.label}`}
                  className="h-8 w-20 rounded-md border border-abyss-600 bg-abyss-900 px-2 font-mono text-xs text-slate-200 outline-none focus:border-accent-400"
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-abyss-850 p-4">
        <h3 className="text-sm font-bold text-white">Tamanhos</h3>
        <div className="mt-3 space-y-3">
          {SIZE_TARGETS.map((target) => (
            <div key={target.key} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-[13px] text-slate-300">{target.label}</span>
              <input
                type="range"
                min={target.min}
                max={target.max}
                value={sizeValue(target.key, target.min)}
                onChange={(e) => handleSize(target.key, Number(e.target.value), target.unit)}
                aria-label={target.label}
                className="min-w-0 flex-1 accent-accent-500"
              />
              <span className="w-14 shrink-0 text-right font-mono text-xs text-slate-300">
                {sizeValue(target.key, target.min)}
                {target.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-abyss-850 p-4">
        <h3 className="text-sm font-bold text-white">Botões</h3>
        <p className="mt-0.5 text-xs text-slate-400">Ocultar/restaurar sem excluir o componente base.</p>
        <ul className="mt-3 space-y-1.5">
          {BASE_BUTTONS.map((btn) => {
            const hidden = hiddenButtons.includes(btn.id)
            return (
              <li key={btn.id} className="flex items-center justify-between rounded-lg bg-abyss-800 px-3 py-2">
                <span className="text-[13px] text-slate-300">{btn.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = hidden ? hiddenButtons.filter((b) => b !== btn.id) : [...hiddenButtons, btn.id]
                    setHiddenButtons(next)
                    scheduleSave({ colors, sizes, hiddenButtons: next })
                    if (user) {
                      void logAdminAction({
                        adminUid: user.uid,
                        action: hidden ? 'button_restored' : 'button_hidden',
                        target: btn.id,
                      }).catch(() => undefined)
                    }
                  }}
                  className={`h-7 rounded-md px-3 text-xs font-semibold transition-colors ${hidden ? 'bg-accent-500 text-white' : 'bg-abyss-700 text-slate-300 hover:text-white'}`}
                >
                  {hidden ? 'Restaurar' : 'Ocultar'}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newBtnLabel}
            onChange={(e) => setNewBtnLabel(e.target.value)}
            placeholder="Nome do novo botão (ação da lista permitida)"
            maxLength={30}
            aria-label="Nome do novo botão"
            className="h-9 min-w-0 flex-1 rounded-lg border border-abyss-600 bg-abyss-800 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400"
          />
          <button
            type="button"
            onClick={() => {
              const label = newBtnLabel.trim()
              if (!label || !user) return
              setNewBtnLabel('')
              void logAdminAction({ adminUid: user.uid, action: 'button_added', target: `custom-${Date.now()}`, newValue: label }).catch(() => undefined)
              setSaveState('saved')
            }}
            className="h-9 shrink-0 rounded-lg bg-accent-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleRestore()}
        className="mt-3 h-10 rounded-lg border border-danger-500/40 px-5 text-sm font-semibold text-danger-400 transition-colors hover:bg-danger-500/10"
      >
        Restaurar padrão
      </button>
    </section>
  )
}

/** Botões base: mostrar/ocultar sem excluir o componente. */
const BASE_BUTTONS = [
  { id: 'header-search', label: 'Busca do header' },
  { id: 'header-notifications', label: 'Notificações do header' },
  { id: 'rail-explore', label: 'Explorar (rail)' },
  { id: 'members-panel', label: 'Painel de membros' },
  { id: 'voice-join', label: 'Entrar na sala de voz' },
]