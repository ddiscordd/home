import { useState } from 'react'
import { Modal } from '../common/Modal'
import { PrimaryButton } from '../auth/PrimaryButton'

interface CreateServerModalProps {
  onClose: () => void
  onCreate: (input: { name: string; icon?: string }) => Promise<void>
}

const SUGGESTIONS = ['Minha comunidade', 'Meu projeto', 'Grupo de amigos']

export function CreateServerModal({ onClose, onCreate }: CreateServerModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (busy) return
    if (!name.trim()) {
      setError('Digite o nome do servidor.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onCreate({ name: name.trim(), icon: icon.trim() || undefined })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o servidor. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Criar um servidor" onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <label htmlFor="server-name" className="mb-1.5 block text-[13px] font-medium text-slate-300">
          Qual será o nome do seu servidor?
        </label>
        <input
          id="server-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Nome do servidor"
          autoFocus
          className="h-11 w-full rounded-lg border border-abyss-600 bg-abyss-800 px-3 text-[15px] text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="rounded-full border border-white/10 bg-abyss-800 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-accent-400 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>

        <label htmlFor="server-icon" className="mt-4 mb-1.5 block text-[13px] font-medium text-slate-300">
          Ícone do servidor <span className="text-slate-500">(opcional)</span>
        </label>
        <input
          id="server-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={50}
          placeholder="Emoji ou texto curto"
          className="h-11 w-full rounded-[var(--radius-lg)] border border-white/[0.08] bg-surface-3 px-3 text-[15px] text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-accent/30 focus:shadow-[0_0_0_2px_var(--accent-glow)]"
        />

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
            Criar
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}