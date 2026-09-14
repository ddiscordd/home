import { useState } from 'react'
import { Modal } from '../common/Modal'
import { PrimaryButton } from '../auth/PrimaryButton'
import type { ChannelCategory, ChannelType } from '../../types'
import { cn } from '../../utils/cn'

interface CreateChannelModalProps {
  categories: ChannelCategory[]
  initialCategoryId: string | null
  onClose: () => void
  onCreate: (input: { name: string; type: ChannelType; categoryId: string | null }) => Promise<void>
}

const TYPE_OPTIONS: { value: ChannelType; label: string; hint: string; icon: string }[] = [
  { value: 'text', label: 'Texto', hint: 'Mensagens, imagens e conversas', icon: '#' },
  { value: 'voice', label: 'Voz', hint: 'Bate-papo por voz em tempo real', icon: '🔊' },
]

export function CreateChannelModal({ categories, initialCategoryId, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ChannelType>('text')
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableCategories = categories.filter((c) => (type === 'voice' ? c.type === 'voice' : c.type !== 'voice'))

  function switchType(next: ChannelType) {
    setType(next)
    // Ao trocar o tipo, mantém a categoria se ela pertencer ao novo tipo.
    const stillValid = categories.some((c) => c.id === categoryId && (next === 'voice' ? c.type === 'voice' : c.type !== 'voice'))
    if (!stillValid) {
      setCategoryId(availableCategories[0]?.id ?? null)
    }
  }

  async function submit() {
    if (busy) return
    if (!name.trim()) {
      setError('Digite o nome do canal.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onCreate({ name: name.trim(), type, categoryId })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o canal. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Criar canal" onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div role="radiogroup" aria-label="Tipo do canal" className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={type === option.value}
              onClick={() => switchType(option.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition-all focus-visible:ring-2 focus-visible:ring-accent-300',
                type === option.value
                  ? 'border-accent-400 bg-accent-500/10'
                  : 'border-white/10 bg-abyss-800 hover:border-white/25',
              )}
            >
              <span className="text-lg">{option.icon}</span>
              <p className="mt-1 text-sm font-bold text-white">{option.label}</p>
              <p className="text-[11px] leading-snug text-slate-400">{option.hint}</p>
            </button>
          ))}
        </div>

        <label htmlFor="channel-name" className="mt-4 mb-1.5 block text-[13px] font-medium text-slate-300">
          Nome do canal
        </label>
        <div className="flex items-center rounded-lg border border-abyss-600 bg-abyss-800 transition-all focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/30">
          <span aria-hidden="true" className="pl-3 text-lg text-slate-500">
            {type === 'text' ? '#' : '🔊'}
          </span>
          <input
            id="channel-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={type === 'text' ? 'novo-canal' : 'Nova sala'}
            autoFocus
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        {availableCategories.length > 0 && (
          <>
            <label htmlFor="channel-category" className="mt-4 mb-1.5 block text-[13px] font-medium text-slate-300">
              Categoria
            </label>
            <select
              id="channel-category"
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="h-11 w-full rounded-lg border border-abyss-600 bg-abyss-800 px-3 text-[15px] text-slate-100 outline-none transition-all focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30"
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value="">Sem categoria</option>
            </select>
          </>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-abyss-700 hover:text-white"
          >
            Cancelar
          </button>
          <PrimaryButton loading={busy} onClick={() => void submit()} className="w-auto px-6">
            Criar canal
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}