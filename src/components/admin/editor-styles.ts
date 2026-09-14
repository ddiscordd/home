import type { ElementOverride } from './editor-types'

/**
 * Aplica os overrides de um elemento no DOM real (data-editor-id).
 * - style: escreve inline apenas as propriedades alteradas.
 * - visible: display none/'' conforme visibilidade.
 * - order: aplica order no flex.
 */
export function applyElementOverrides(
  overrides: Record<string, ElementOverride>,
  onlyElementId?: string,
): void {
  const targets = onlyElementId ? [onlyElementId] : Object.keys(overrides)
  for (const id of targets) {
    const override = overrides[id]
    if (!override) continue
    const el = document.querySelector<HTMLElement>(`[data-editor-id="${id}"]`)
    if (!el) continue

    if (override.visible === false) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }

    if (override.order != null) {
      el.style.order = String(override.order)
    } else if (override.visible !== false) {
      el.style.order = ''
    }

    for (const [prop, value] of Object.entries(override.style ?? {})) {
      el.style.setProperty(prop, value)
    }
  }
}

/** Remove TODOS os inline styles de edição (restaura visual padrão). */
export function clearAllEditorInlineStyles(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-editor-id]')
  for (const el of elements) {
    el.style.removeProperty('display')
    el.style.removeProperty('order')
    el.style.removeProperty('backgroundColor')
    el.style.removeProperty('color')
    el.style.removeProperty('fontSize')
    el.style.removeProperty('height')
    el.style.removeProperty('width')
    el.style.removeProperty('borderRadius')
  }
}