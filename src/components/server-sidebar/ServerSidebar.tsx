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
  style?: React.CSSProperties
}

export function ServerSidebar({ servers, activeServerId, onSelect, onCreate, onOpenFriends, friendsActive = false, style }: ServerSidebarProps) {
  return (
    <nav aria-label="Servidores" className="flex shrink-0 flex-col items-center gap-2 overflow-y-auto bg-abyss-950 py-3" style={style}>
      {/* Botão Amigos */}
      <button
        type="button"
        title="Amigos"
        aria-label="Abrir área de amigos"
        onClick={onOpenFriends}
        className={cn(
          'group/server relative flex h-12 w-12 items-center justify-center rounded-2xl bg-abyss-700 text-sm font-bold text-white transition-all duration-200 hover:rounded-xl hover:bg-accent-500 hover:-translate-y-0.5',
          friendsActive && 'rounded-xl bg-accent-500 shadow-sm',
        )}
      >
        {/* Indicador lateral */}
        <span
          className={cn(
            'absolute -left-4 h-0 w-1 rounded-r-full bg-white transition-all duration-200',
            friendsActive ? 'h-10 opacity-100' : 'h-2 opacity-0 group-hover/server:opacity-100 group-hover/server:h-5',
          )}
        />
        👥
      </button>

      {/* Separador */}
      <div className="my-1 h-0.5 w-8 rounded-full bg-white/[0.06]" />

      {/* Lista de servidores */}
      {servers.map((server, index) => {
        const active = server.id === activeServerId
        return (
          <div
            key={server.id}
            className="group/server relative animate-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* Indicador lateral */}
            <span
              className={cn(
                'absolute top-1/2 -left-4 h-0 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200',
                active ? 'h-10 opacity-100' : 'h-2 opacity-0 group-hover/server:opacity-100 group-hover/server:h-5',
              )}
            />
            <button
              type="button"
              title={server.name}
              onClick={() => onSelect(server.id)}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-[18px] text-sm font-bold text-white transition-all duration-200 hover:rounded-[14px] hover:-translate-y-0.5',
                active && 'rounded-[14px] shadow-sm',
              )}
              style={{
                backgroundColor: server.color,
                boxShadow: active ? `0 2px 8px ${server.color}40` : undefined,
              }}
            >
              {server.initials}
              {server.unreadCount ? (
                <span className="absolute -right-1 -bottom-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-[11px] font-bold shadow-sm">
                  {server.unreadCount > 99 ? '99+' : server.unreadCount}
                </span>
              ) : null}
              {server.hasPing && !server.unreadCount ? (
                <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#0a0d13] bg-danger-500" />
              ) : null}
            </button>
          </div>
        )
      })}

      {/* Botão adicionar servidor */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          type="button"
          title="Adicionar servidor"
          aria-label="Adicionar servidor"
          onClick={onCreate}
          className="group/add flex h-12 w-12 items-center justify-center rounded-[18px] bg-abyss-700 text-xl font-medium text-success-500 transition-all duration-200 hover:rounded-[14px] hover:bg-success-500 hover:text-white hover:-translate-y-0.5 active:scale-95"
        >
          +
        </button>
        <button
          type="button"
          title="Explorar servidores"
          onClick={() => window.alert('Explorar: em breve (mock).')}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-abyss-700 text-lg text-slate-300 transition-all duration-200 hover:rounded-[14px] hover:bg-accent-500 hover:text-white hover:-translate-y-0.5 active:scale-95"
        >
          ✦
        </button>
      </div>
    </nav>
  )
}
