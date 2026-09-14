/** Definição de um elemento editável do modo editor visual. */
export interface EditorElement {
  id: string
  label: string
  /** Variável CSS base que o editor sobrescreve (ex.: --ui-chat-bg). */
  cssVar?: string
  /** Dimensões editáveis com limites seguros. */
  sizes?: { key: string; label: string; prop: string; min: number; max: number; unit: string }[]
  /** Cores editáveis (estilo → usa var ou fallback). */
  colors?: { key: string; label: string; prop: string }[]
  /** Pode ser ocultado/restaurado. */
  hideable?: boolean
  /** Pode mudar ordem (flex order). */
  reorderable?: boolean
}

/** Configuração salva por elemento (systemSettings/elementOverrides/{id}). */
export interface ElementOverride {
  elementId: string
  style: Record<string, string>
  visible?: boolean
  order?: number
}

/** Catálogo dos elementos editáveis reais da aplicação. */
export const EDITOR_ELEMENTS: Record<string, EditorElement> = {
  'top-bar': {
    id: 'top-bar',
    label: 'Barra superior',
    cssVar: '--ui-header-bg',
    colors: [{ key: 'background', label: 'Fundo', prop: 'backgroundColor' }],
    sizes: [{ key: 'height', label: 'Altura', prop: 'height', min: 32, max: 72, unit: 'px' }],
    hideable: true,
  },
  'server-rail': {
    id: 'server-rail',
    label: 'Barra de servidores',
    cssVar: '--ui-rail-bg',
    colors: [{ key: 'background', label: 'Fundo', prop: 'backgroundColor' }],
    sizes: [
      { key: 'width', label: 'Largura', prop: 'width', min: 56, max: 120, unit: 'px' },
      { key: 'radius', label: 'Arredondamento', prop: 'borderRadius', min: 0, max: 24, unit: 'px' },
    ],
    hideable: true,
  },
  'navigation-sidebar': {
    id: 'navigation-sidebar',
    label: 'Sidebar de navegação',
    cssVar: '--ui-sidebar-bg',
    colors: [{ key: 'background', label: 'Fundo', prop: 'backgroundColor' }],
    sizes: [{ key: 'width', label: 'Largura', prop: 'width', min: 180, max: 360, unit: 'px' }],
    hideable: true,
  },
  'main-content': {
    id: 'main-content',
    label: 'Conteúdo principal',
    cssVar: '--ui-chat-bg',
    colors: [
      { key: 'background', label: 'Fundo', prop: 'backgroundColor' },
      { key: 'color', label: 'Texto', prop: 'color' },
    ],
    sizes: [
      { key: 'fontSize', label: 'Fonte', prop: 'fontSize', min: 12, max: 24, unit: 'px' },
      { key: 'radius', label: 'Arredondamento', prop: 'borderRadius', min: 0, max: 24, unit: 'px' },
    ],
  },
  'chat-header': {
    id: 'chat-header',
    label: 'Cabeçalho do canal',
    cssVar: '--ui-header-bg',
    colors: [{ key: 'background', label: 'Fundo', prop: 'backgroundColor' }],
    sizes: [{ key: 'height', label: 'Altura', prop: 'height', min: 36, max: 72, unit: 'px' }],
  },
  'message-input': {
    id: 'message-input',
    label: 'Campo de mensagem',
    colors: [
      { key: 'background', label: 'Fundo', prop: 'backgroundColor' },
      { key: 'color', label: 'Texto', prop: 'color' },
    ],
    sizes: [
      { key: 'height', label: 'Altura', prop: 'height', min: 36, max: 120, unit: 'px' },
      { key: 'radius', label: 'Arredondamento', prop: 'borderRadius', min: 0, max: 24, unit: 'px' },
    ],
  },
  'right-sidebar': {
    id: 'right-sidebar',
    label: 'Painel direito',
    cssVar: '--ui-panel-bg',
    colors: [{ key: 'background', label: 'Fundo', prop: 'backgroundColor' }],
    sizes: [{ key: 'width', label: 'Largura', prop: 'width', min: 180, max: 340, unit: 'px' }],
    hideable: true,
  },
  'user-panel': {
    id: 'user-panel',
    label: 'Painel do usuário',
    cssVar: '--ui-userpanel-bg',
    colors: [{ key: 'background', label: 'Fundo', prop: 'backgroundColor' }],
    sizes: [{ key: 'height', label: 'Altura', prop: 'height', min: 44, max: 96, unit: 'px' }],
  },
  'friends-button': {
    id: 'friends-button',
    label: 'Botão Amigos',
    colors: [{ key: 'color', label: 'Texto', prop: 'color' }],
    sizes: [{ key: 'fontSize', label: 'Fonte', prop: 'fontSize', min: 12, max: 22, unit: 'px' }],
    hideable: true,
    reorderable: true,
  },
  'settings-button': {
    id: 'settings-button',
    label: 'Botão Configurações',
    colors: [{ key: 'color', label: 'Ícone', prop: 'color' }],
    sizes: [
      { key: 'fontSize', label: 'Tamanho', prop: 'fontSize', min: 14, max: 30, unit: 'px' },
    ],
    hideable: true,
    reorderable: true,
  },
}

/** Busca o catálogo do elemento pelo data-editor-id. */
export function getEditorElementById(id: string | null): EditorElement | null {
  if (!id) return null
  return EDITOR_ELEMENTS[id] ?? null
}