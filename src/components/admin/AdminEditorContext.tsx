import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { dbGet, dbUpdate } from '../../services/db'
import { logAdminAction } from '../../services/systemSettings/systemSettingsService'
import { ADMIN_UID } from '../../types'
import { applyElementOverrides } from './editor-styles'
import type { ElementOverride } from './editor-types'

export type EditorSaveState = 'idle' | 'saving' | 'saved' | 'error'

interface AdminEditorContextValue {
  editorEnabled: boolean
  enterEditorMode: () => void
  exitEditorMode: () => void
  selectedId: string | null
  selectElement: (id: string | null) => void
  overrides: Record<string, ElementOverride>
  /** Aplica imediatamente na UI (sem commit/histórico ainda). */
  applyOverride: (elementId: string, patch: Partial<ElementOverride>) => void
  /** Confirma a alteração no histórico + agenda autosave. */
  commitOverride: (elementId: string, patch: Partial<ElementOverride>) => void
  resetElement: (elementId: string) => void
  resetAll: () => Promise<void>
  saveState: EditorSaveState
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  adminUid: string | null
}

const AdminEditorContext = createContext<AdminEditorContextValue | null>(null)

const STORAGE_PATH = 'systemSettings/elementOverrides'
const ELEMENT_ACTION = 'element_override'

/** Serializa um objeto com chaves ordenadas p/ comparar histórico semântico. */
function stableKey(overrides: Record<string, ElementOverride>): string {
  const ids = Object.keys(overrides).sort()
  return ids
    .map(
      (id) =>
        `${id}:${JSON.stringify({ style: overrides[id].style ?? {}, visible: overrides[id].visible, order: overrides[id].order })}`,
    )
    .join('|')
}

export function AdminEditorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const adminUid = user?.uid === ADMIN_UID ? user.uid : null

  const [editorEnabled, setEditorEnabled] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, ElementOverride>>({})
  const [saveState, setSaveState] = useState<EditorSaveState>('idle')

  const past = useRef<Record<string, ElementOverride>[]>([])
  const future = useRef<Record<string, ElementOverride>[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingMap = useRef<Record<string, ElementOverride> | null>(null)
// Carrega overrides salvos ao entrar no modo editor.
  useEffect(() => {
    if (!editorEnabled) return
    let cancelled = false
    dbGet<Record<string, ElementOverride>>(STORAGE_PATH)
      .then((saved) => {
        if (cancelled) return
        const data = saved ?? {}
        setOverrides(data)
        past.current = []
        future.current = []
        pendingMap.current = null
        applyElementOverrides(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [editorEnabled])

  // Limpeza do timer no unmount.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [],
  )

  const scheduleSave = useCallback(
    (data: Record<string, ElementOverride>) => {
      if (!adminUid) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveState('saving')
      saveTimer.current = setTimeout(() => {
        dbUpdate('', { [STORAGE_PATH]: data })
          .then(() => {
            setSaveState('saved')
            return logAdminAction({ adminUid, action: ELEMENT_ACTION, target: Object.keys(data).join(',') })
          })
          .catch(() => setSaveState('error'))
      }, 700)
    },
    [adminUid],
  )

  /** Aplica o patch na UI imediatamente (sem historico ainda). */
  const applyOverride = useCallback((elementId: string, patch: Partial<ElementOverride>) => {
    setOverrides((prev) => {
      const current = prev[elementId] ?? { elementId, style: {} }
      const next: ElementOverride = {
        ...current,
        ...patch,
        style: { ...(current.style ?? {}), ...(patch.style ?? {}) },
      }
      if (patch.visible == null) delete next.visible
      if (patch.order == null) delete next.order
      const merged = { ...prev, [elementId]: next }
      applyElementOverrides(merged, elementId)
      return merged
    })
    setSaveState('idle')
  }, [])

  /** Confirma a alteração: histórico + autosave. */
  const commitOverride = useCallback(
    (elementId: string, patch: Partial<ElementOverride>) => {
      setOverrides((prev) => {
        const fromPrev = prev[elementId] ?? { elementId, style: {} }
        const next: ElementOverride = {
          ...fromPrev,
          ...patch,
          style: { ...(fromPrev.style ?? {}), ...(patch.style ?? {}) },
        }
        if (patch.visible == null) delete next.visible
        if (patch.order == null) delete next.order
        const merged = { ...prev, [elementId]: next }
        past.current.push(prev)
        future.current = []
        applyElementOverrides(merged, elementId)
        scheduleSave(merged)
        return merged
      })
    },
    [scheduleSave],
  )
const resetElement = useCallback((elementId: string) => {
    setOverrides((prev) => {
      if (!prev[elementId]) return prev
      const next = { ...prev }
      delete next[elementId]
      past.current.push(prev)
      future.current = []
      applyElementOverrides(next, elementId)
      scheduleSave(next)
      return next
    })
  }, [scheduleSave])

  const undo = useCallback(() => {
    const prevState = past.current.pop()
    if (!prevState) return
    future.current.push(overrides)
    setOverrides(prevState)
    applyElementOverrides(prevState)
    scheduleSave(prevState)
    setSelectedId(null)
  }, [overrides, scheduleSave])

  const redo = useCallback(() => {
    const nextState = future.current.pop()
    if (!nextState) return
    past.current.push(overrides)
    setOverrides(nextState)
    applyElementOverrides(nextState)
    scheduleSave(nextState)
    setSelectedId(null)
  }, [overrides, scheduleSave])

  const resetAll = useCallback(async () => {
    if (!adminUid) return
    past.current.push(overrides)
    future.current = []
    setOverrides({})
    applyElementOverrides({})
    await dbUpdate('', { [STORAGE_PATH]: null })
    await logAdminAction({ adminUid, action: 'element_reset_all' }).catch(() => undefined)
    setSaveState('saved')
    setSelectedId(null)
  }, [adminUid, overrides])

  const enterEditorMode = useCallback(() => setEditorEnabled(true), [])
  const exitEditorMode = useCallback(() => {
    setEditorEnabled(false)
    setSelectedId(null)
    setOverrides({})
    past.current = []
    future.current = []
    if (saveTimer.current) clearTimeout(saveTimer.current)
    applyElementOverrides({})
  }, [])

  // Adiciona a classe no <body> para habilitar o CSS do modo editor.
  useEffect(() => {
    document.body.classList.toggle('admin-editor-mode', editorEnabled)
    return () => {
      document.body.classList.remove('admin-editor-mode')
    }
  }, [editorEnabled])

  // Atalhos: CTRL+Z desfaz; CTRL+SHIFT+Z refaz (apenas no modo editor).
  useEffect(() => {
    if (!editorEnabled) return
    const handler = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editorEnabled, undo, redo])

  const value = useMemo<AdminEditorContextValue>(
    () => ({
      editorEnabled,
      enterEditorMode,
      exitEditorMode,
      selectedId,
      selectElement: setSelectedId,
      overrides,
      applyOverride,
      commitOverride,
      resetElement,
      resetAll,
      saveState,
      undo,
      redo,
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
      adminUid: adminUid,
    }),
    [
      editorEnabled, enterEditorMode, exitEditorMode, selectedId, overrides,
      applyOverride, commitOverride, resetElement, resetAll, saveState,
      undo, redo, adminUid,
    ],
  )

  return <AdminEditorContext.Provider value={value}>{children}</AdminEditorContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminEditor(): AdminEditorContextValue {
  const ctx = useContext(AdminEditorContext)
  if (!ctx) throw new Error('useAdminEditor deve ser usado dentro de AdminEditorProvider.')
  return ctx
}