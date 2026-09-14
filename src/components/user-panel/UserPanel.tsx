import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../utils/cn'

/** Painel do usuário: avatar/nome + mic/áudio + ⚙ (abre Configurações). Logout fica dentro delas. */
export function UserPanel() {
  const { user } = useAuth()
  const { openSettings } = useApp()
  const [muted, setMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)

  const displayName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Membro'
  const email = user?.email ?? ''
  const avatarInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2 bg-abyss-950/60 px-2 py-2.5">
      <div className="relative shrink-0">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={`Avatar de ${displayName}`}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">
            {avatarInitial}
          </div>
        )}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-abyss-850 bg-success-500"
        />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-bold text-white">{displayName}</p>
        <p className="truncate text-[11px] text-slate-400" title={email}>
          {muted ? 'Silenciado' : email || 'Online'}
        </p>
      </div>
      <button
        type="button"
        title={muted ? 'Ativar microfone' : 'Silenciar'}
        aria-label={muted ? 'Ativar microfone' : 'Silenciar'}
        onClick={() => setMuted((v) => !v)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-abyss-600 hover:text-white',
          muted && 'bg-danger-500/20 text-danger-500 hover:bg-danger-500 hover:text-white',
        )}
      >
        {muted ? '✕' : '◉'}
      </button>
      <button
        type="button"
        title={deafened ? 'Ativar áudio' : 'Ensurdecer'}
        aria-label={deafened ? 'Ativar áudio' : 'Ensurdecer'}
        onClick={() => setDeafened((v) => !v)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-abyss-600 hover:text-white',
          deafened && 'bg-danger-500/20 text-danger-500 hover:bg-danger-500 hover:text-white',
        )}
      >
        ♪
      </button>
      <button
        type="button"
        title="Configurações"
        aria-label="Abrir configurações"
        onClick={openSettings}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-abyss-600 hover:text-white"
      >
        ⚙
      </button>
    </div>
  )
}
