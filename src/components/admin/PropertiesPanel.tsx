import { useState } from 'react'
import { useAdminEditor } from './AdminEditorContext'
import type { EditorElement } from './editor-types'
import { cn } from '../../utils/cn'

interface PropertiesPanelProps {
  element: EditorElement
}

type Tab = 'appearance' | 'size' | 'position' | 'behavior' | 'advanced'

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Aparência' },
  { id: 'size', label: 'Tamanho' },
  { id: 'position', label: 'Posição' },
  { id: 'behavior', label: 'Comportamento' },
  { id: 'advanced', label: 'Avançado' },
]

function isHex(value: string | undefined): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value)
}

/**
 * Painel de propriedades do elemento selecionado. Cada alteração é aplicada
 * imediatamente na UI (applyOverride) e confirmada no histórico/autosave
 * (commitOverride) ao soltar o controle — sem exigir refresh.
 */
export function PropertiesPanel({ element }: PropertiesPanelProps) {
  const { overrides, applyOverride, commitOverride, resetElement } = useAdminEditor()
  const [tab, setTab] = useState<Tab>('appearance')

  const current = overrides[element.id]
  const style = current?.style ?? {}
  const visible = current?.visible ?? true
  const order = current?.order ?? 1

  /** Aplica na UI ao mover; confirma no histórico ao soltar. */
  function patch(stylePatch: Record<string, string>) {
    applyOverride(element.id, { style: stylePatch })
  }
  function patchCommit(stylePatch: Record<string, string>) {
    commitOverride(element.id, { style: stylePatch })
  }

  const background = isHex(style.backgroundColor) ? style.backgroundColor : '#151a28'
  const color = isHex(style.color) ? style.color : '#f2f3f5'
  const fontSize = style.fontSize ? parseInt(style.fontSize, 10) : 15
  const radius = style.borderRadius ? parseInt(style.borderRadius, 10) : 8

  function rangeCommit(event: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>, prop: string, unit: string) {
    const target = event.target as HTMLInputElement
    commitOverride(element.id, { style: { ...style, [prop]: `${target.value}${unit}` } })
  }

  return (
    <div className="animate-fade-slide flex h-full w-[320px] min-w-[320px] flex-col border-l border-abyss-700 bg-abyss-850 text-slate-200">
      <div className="border-b border-abyss-700 px-4 py-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Personalização avançada</p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-white">Editar: {element.label}</h3>
          {current && (
            <button
              type="button"
              onClick={() => resetElement(element.id)}
              className="h-6 shrink-0 rounded-md px-2 text-[11px] font-semibold text-danger-400 transition-colors hover:bg-danger-500/15"
            >
              Restaurar
            </button>
          )}
        </div>
      </div>
<div className="flex gap-1 border-b border-abyss-700 px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'h-7 rounded-md px-2.5 text-xs font-semibold transition-colors',
              tab === t.id ? 'bg-accent-500 text-white' : 'text-slate-400 hover:bg-abyss-700 hover:text-slate-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'appearance' && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">Fundo</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => patch({ backgroundColor: e.target.value })}
                  onBlur={(e) => isHex(e.target.value) && patchCommit({ backgroundColor: e.target.value })}
                  aria-label={`Fundo de ${element.label}`}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={background}
                  onChange={(e) => patch({ backgroundColor: e.target.value })}
                  onBlur={(e) => isHex(e.target.value) && patchCommit({ backgroundColor: e.target.value })}
                  aria-label="Hexadecimal do fundo"
                  maxLength={7}
                  className="h-9 min-w-0 flex-1 rounded-md border border-abyss-600 bg-abyss-900 px-2 font-mono text-xs text-slate-100 outline-none focus:border-accent-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">Texto</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => patch({ color: e.target.value })}
                  onBlur={(e) => isHex(e.target.value) && patchCommit({ color: e.target.value })}
                  aria-label={`Texto de ${element.label}`}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => patch({ color: e.target.value })}
                  onBlur={(e) => isHex(e.target.value) && patchCommit({ color: e.target.value })}
                  aria-label="Hexadecimal do texto"
                  maxLength={7}
                  className="h-9 min-w-0 flex-1 rounded-md border border-abyss-600 bg-abyss-900 px-2 font-mono text-xs text-slate-100 outline-none focus:border-accent-400"
                />
              </span>
            </label>

            {element.colors?.length === 0 && (
              <p className="rounded-lg bg-abyss-800 px-3 py-4 text-center text-xs text-slate-500">
                Este elemento não possui cores editáveis.
              </p>
            )}
          </div>
        )}
{tab === 'size' && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Tamanho da fonte</span>
                <span className="font-mono text-slate-500">{fontSize}px</span>
              </span>
              <input
                type="range"
                min={10}
                max={28}
                value={fontSize}
                onChange={(e) => patch({ fontSize: `${e.target.value}px` })}
                onMouseUp={(e) => rangeCommit(e, 'fontSize', 'px')}
                onTouchEnd={(e) => rangeCommit(e, 'fontSize', 'px')}
                aria-label="Tamanho da fonte"
                className="w-full accent-accent-500"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Arredondamento</span>
                <span className="font-mono text-slate-500">{radius}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={28}
                value={radius}
                onChange={(e) => patch({ borderRadius: `${e.target.value}px` })}
                onMouseUp={(e) => rangeCommit(e, 'borderRadius', 'px')}
                onTouchEnd={(e) => rangeCommit(e, 'borderRadius', 'px')}
                aria-label="Arredondamento"
                className="w-full accent-accent-500"
              />
            </label>

            {element.sizes?.map((size) => {
              const raw = style[size.prop]
              const parsed = raw ? parseFloat(raw) : size.min
              return (
                <label key={size.key} className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{size.label}</span>
                    <span className="font-mono text-slate-500">
                      {Number.isFinite(parsed) ? parsed : size.min}
                      {size.unit}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={size.min}
                    max={size.max}
                    value={Number.isFinite(parsed) ? parsed : size.min}
                    onChange={(e) => patch({ [size.prop]: `${e.target.value}${size.unit}` })}
                    onMouseUp={(e) => rangeCommit(e, size.prop, size.unit)}
                    onTouchEnd={(e) => rangeCommit(e, size.prop, size.unit)}
                    aria-label={size.label}
                    className="w-full accent-accent-500"
                  />
                </label>
              )
            })}

            {(element.sizes?.length ?? 0) === 0 && (
              <p className="rounded-lg bg-abyss-800 px-3 py-4 text-center text-xs text-slate-500">
                Este elemento não possui dimensões ajustáveis.
              </p>
            )}
          </div>
        )}
{tab === 'position' && (
          <div className="space-y-4">
            <p className="rounded-lg bg-abyss-800 px-3 py-2 text-xs leading-relaxed text-slate-400">
              O layout usa flex/grid real — posicionamento é controlado por espaçamento e ordem para nunca quebrar a
              estrutura.
            </p>
            {element.reorderable ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-300">Ordem</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={order}
                  onChange={(e) =>
                    applyOverride(element.id, { order: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })
                  }
                  onBlur={() => commitOverride(element.id, { order: Math.max(1, Math.min(10, order)) })}
                  aria-label="Ordem do elemento"
                  className="h-9 w-full rounded-md border border-abyss-600 bg-abyss-900 px-3 text-sm text-slate-100 outline-none focus:border-accent-400"
                />
              </label>
            ) : (
              <p className="rounded-lg bg-abyss-800 px-3 py-4 text-center text-xs text-slate-500">
                Este elemento não permite reordenar (estrutura fixa).
              </p>
            )}
          </div>
        )}
{tab === 'behavior' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-abyss-800 px-3 py-2">
              <span className="text-xs font-semibold text-slate-300">Visível</span>
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                onClick={() => commitOverride(element.id, { visible: !visible })}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${visible ? 'bg-accent-500' : 'bg-abyss-600'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${visible ? 'left-[18px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            {element.hideable === false && (
              <p className="text-xs text-slate-500">Elemento estrutural — ocultá-lo pode quebrar o layout.</p>
            )}
          </div>
        )}
{tab === 'advanced' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-abyss-800 px-3 py-2 text-xs text-slate-400">
              ID: <code className="text-accent-300">{element.id}</code>
            </div>
            {element.cssVar && (
              <div className="rounded-lg bg-abyss-800 px-3 py-2 text-xs text-slate-400">
                Variável base: <code className="text-accent-300">{element.cssVar}</code>
              </div>
            )}
            <div className="rounded-lg bg-abyss-800 px-3 py-2 text-xs text-slate-400">
              Aplicado como estilo inline (mudança instantânea). Persistido globalmente em{' '}
              <code className="text-accent-300">systemSettings/elementOverrides</code> para todos os usuários.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}