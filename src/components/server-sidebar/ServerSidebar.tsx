import type { Server } from '../../types'
import { cn } from '../../utils/cn'

interface ServerSidebarProps {
  servers: Server[]
  activeServerId: string
  onSelect: (id: string) => void
  /** Abre o modal de criação de servidor. */
  onCreate: () => void
  /** Abre a área de amigos (botão Início). */
  onOpenFriends?: () => void
  friendsActive?: boolean
}

export function ServerSidebar({ servers, activeServerId, onSelect, onCreate, onOpenFriends, friendsActive = false }: ServerSidebarProps) {
  return (
    <nav aria-label="Servidores" className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-abyss-950 py-3">
      <button
        type="button"
        title="Amigos"
        aria-label="Abrir área de amigos"
        onClick={onOpenFriends}
        className={cn(
          'group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-abyss-700 text-sm font-bold text-white transition-all hover:rounded-xl hover:bg-accent-500',
          friendsActive && 'rounded-xl bg-accent-500',
        )}
      >
        <span className={cn('absolute -left-4 h-2 w-1 rounded-r-full bg-white transition-all', friendsActive ? 'h-10' : 'group-hover:h-5')} />
        👥
      </button>

      <div className="my-1 h-0.5 w-8 rounded-full bg-abyss-700" />

      {servers.map((server, index) => {
        const active = server.id === activeServerId
        return (
          <div
            key={server.id}
            className="group relative animate-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span
              className={cn(
                'absolute top-1/2 -left-4 h-2 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all',
                active ? 'h-10' : 'group-hover:h-5',
              )}
            />
            <button
              type="button"
              title={server.name}
              onClick={() => onSelect(server.id)}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-3xl text-sm font-bold text-white transition-all hover:rounded-xl',
                active && 'rounded-xl',
              )}
              style={{ backgroundColor: server.color }}
            >
              {server.initials}
              {server.unreadCount ? (
                <span className="absolute -right-1 -bottom-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-[11px] font-bold">
                  {server.unreadCount > 99 ? '99+' : server.unreadCount}
                </span>
              ) : null}
              {server.hasPing && !server.unreadCount ? (
                <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-abyss-950 bg-danger-500" />
              ) : null}
            </button>
          </div>
        )
      })}

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          type="button"
          title="Adicionar servidor"
          aria-label="Adicionar servidor"
          onClick={onCreate}
          className="flex h-12 w-12 items-center justify-center rounded-3xl bg-abyss-700 text-xl text-success-500 transition-all hover:rounded-xl hover:bg-success-500 hover:text-white"
        >
          +
        </button>
        <button
          type="button"
          title="Explorar servidores"
          onClick={() => window.alert('Explorar: em breve (mock).')}
          className="flex h-12 w-12 items-center justify-center rounded-3xl bg-abyss-700 text-lg text-slate-300 transition-all hover:rounded-xl hover:bg-accent-500 hover:text-white"
        >
          ✦
        </button>
      </div>
    </nav>
  )
}
