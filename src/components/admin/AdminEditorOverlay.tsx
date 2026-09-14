import { useEffect } from 'react'
import { useAdminEditor } from './AdminEditorContext'
import { getEditorElementById } from './editor-types'
import { PropertiesPanel } from './PropertiesPanel'

/**
 * Overlay do MODO DE EDIÇÃO — atua sobre a MESMA tela principal.
 * - Barra administrativa no topo (modo, salvar, desfazer/refazer, restaurar, sair).
 * - Intercepta cliques nos elementos [data-editor-id] e seleciona em vez de
 *   executar a ação normal.
 * - Painel de propriedades à direita ao selecionar um elemento.
 */
export function AdminEditorOverlay() {
  const {
    editorEnabled,
    selectedId,
    selectElement,
    exitEditorMode,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetAll,
    adminUid,
  } = useAdminEditor()

  // Seleção por clique em qualquer elemento data-editor-id (sem executar ação).
  useEffect(() => {
    if (!editorEnabled) return
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const el = target?.closest?.('[data-editor-id]') as HTMLElement | null
      if (el) {
        const id = el.dataset.editorId
        if (id) {
          event.preventDefault()
          event.stopPropagation()
          selectElement(id)
        }
      }
    }
    document.addEventListener('click', handler, true) // captura antes das ações
    return () => document.removeEventListener('click', handler, true)
  }, [editorEnabled, selectElement])

  // ESC sai do modo editor.
  useEffect(() => {
    if (!editorEnabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedId) selectElement(null)
        else exitEditorMode()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editorEnabled, selectedId, selectElement, exitEditorMode])

  if (!editorEnabled || !adminUid) return null

  const selected = getEditorElementById(selectedId)

  return (
    <>
      {/* Barra administrativa (não destrói o layout — overlay fixo no topo) */}
      <div
        className="fixed inset-x-0 top-0 z-[70] flex h-11 items-center gap-3 border-b border-accent-500/30 bg-abyss-950/90 px-3 text-slate-200 shadow-lg backdrop-blur-sm"
        data-editor-id="editor-bar"
        aria-label="Barra do modo de edição"
      >
        <span className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
          </span>
          <span className="text-xs font-extrabold tracking-wider text-accent-300 uppercase">Modo de edição</span>
        </span>

        <span className="hidden sm:inline text-xs text-slate-500">Editor visual</span>

        <span className="mx-1 h-4 w-px bg-abyss-700" />

        <span className="font-mono text-[11px] text-slate-400">
          {saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo ✓' : saveState === 'error' ? 'Erro ao salvar' : ''}
        </span>

        <span className="flex-1" />

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="h-7 rounded-md px-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-abyss-700 hover:text-white disabled:opacity-40"
          >
            Desfazer
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Shift+Z)"
            className="h-7 rounded-md px-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-abyss-700 hover:text-white disabled:opacity-40"
          >
            Refazer
          </button>
        </div>

        <button
          type="button"
          onClick={() => void resetAll()}
          className="h-7 rounded-md px-2.5 text-xs font-semibold text-warning-500 transition-colors hover:bg-warning-500/15"
        >
          Restaurar tudo
        </button>

        <button
          type="button"
          onClick={exitEditorMode}
          className="h-7 rounded-md bg-danger-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-danger-400"
        >
          Sair
        </button>
      </div>

      {/* Painel de propriedades do elemento selecionado */}
      {selected && (
        <div className="fixed top-11 right-0 bottom-0 z-[70] flex">
          <PropertiesPanel key={selected.id} element={selected} />
        </div>
      )}

      {/* Dica inicial de seleção quando nada está selecionado */}
      {!selected && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 animate-fade-up">
          <p className="rounded-lg bg-abyss-950/90 px-4 py-2 text-xs text-slate-300 shadow-xl backdrop-blur-sm">
            Clique em qualquer área da aplicação para editar · <kbd className="text-accent-300">ESC</kbd> para sair
          </p>
        </div>
      )}
    </>
  )
}