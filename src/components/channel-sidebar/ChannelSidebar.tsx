import { useState } from 'react'
import type { Channel, ChannelCategory, Server } from '../../types'
import { cn } from '../../utils/cn'

interface ChannelSidebarProps {
  server: Server
  categories: ChannelCategory[]
  channels: Channel[]
  activeChannelId: string
  onSelectChannel: (id: string) => void
  /** Abre o modal de criação de canal (recebe a categoria inicial ou null). */
  onCreateChannel: (categoryId: string | null) => void
  /** Abre o modal "Convidar pessoas" (código + amigos). */
  onInvite: () => void
  /** Abre a área principal de amigos. */
  onOpenFriends: () => void
  friendsActive: boolean
  unreadFriends: boolean
  isOwner?: boolean
}

export function ChannelSidebar({
  server,
  categories,
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onInvite,
  onOpenFriends,
  friendsActive,
  unreadFriends,
  isOwner = false,
}: ChannelSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Categorias reais do banco: texto primeiro, voz por último.
  const sortedCategories = [...categories].sort((a, b) => {
    const rank = (c: ChannelCategory) => (c.type === 'voice' ? 1 : 0)
    return rank(a) - rank(b)
  })

  const byCategory = new Map<string, Channel[]>()
  const uncategorized: Channel[] = []
  for (const channel of channels) {
    if (!channel.categoryId || !categories.some((cat) => cat.id === channel.categoryId)) {
      uncategorized.push(channel)
      continue
    }
    const list = byCategory.get(channel.categoryId) ?? []
    list.push(channel)
    byCategory.set(channel.categoryId, list)
  }

  function handleMenu(item: string) {
    setMenuOpen(false)
    if (item === 'Convidar pessoas') onInvite()
    else if (item === 'Criar canal') onCreateChannel(null)
    else if (item === 'Configurações do servidor') window.alert('Configurações: em breve.')
    else if (item === 'Sair do servidor') window.alert('Sair do servidor: em breve.')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Atalho fixo: área de amigos (acima do servidor) */}
      <div className="border-b border-abyss-950/60 p-2">
        <button
          type="button"
          onClick={onOpenFriends}
          aria-pressed={friendsActive}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold transition-colors',
            friendsActive
              ? 'bg-abyss-600 text-white'
              : 'text-slate-300 hover:bg-abyss-700/60 hover:text-white',
          )}
        >
          <span aria-hidden="true" className="text-base leading-none">
            👥
          </span>
          <span className="min-w-0 flex-1 truncate">Amigos</span>
          {unreadFriends && !friendsActive && (
            <span
              aria-label="Mensagens não lidas"
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white"
            >
              •
            </span>
          )}
        </button>
      </div>

      <div className="relative border-b border-abyss-950/60">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left font-bold text-white transition-colors hover:bg-abyss-700/40"
        >
          <span className="truncate">{server.icon ? `${server.icon} ${server.name}` : server.name}</span>
          <span className={cn('text-slate-400 transition-transform', menuOpen && 'rotate-180')}>▾</span>
        </button>
        {menuOpen && (
          <div className="animate-fade-in absolute top-full right-2 left-2 z-20 overflow-hidden rounded-lg bg-abyss-950 py-1.5 shadow-xl">
            {['Convidar pessoas', 'Criar canal', 'Configurações do servidor', 'Sair do servidor'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleMenu(item)}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent-500 hover:text-white',
                  item === 'Criar canal' && !isOwner && 'hidden',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {sortedCategories.map((cat) => {
          const list = byCategory.get(cat.id) ?? []
          return (
            <div key={cat.id} className="mb-4">
              <div className="mb-1 flex items-center justify-between px-2">
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">▾ {cat.name}</p>
                {isOwner && (
                  <button
                    type="button"
                    aria-label={`Criar canal em ${cat.name}`}
                    title={`Criar canal em ${cat.name}`}
                    onClick={() => onCreateChannel(cat.id)}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    +
                  </button>
                )}
              </div>
              <ul className="space-y-0.5">
                {list.map((channel) => {
                  const active = channel.id === activeChannelId
                  return (
                    <li key={channel.id} className="animate-fade-in">
                      <button
                        type="button"
                        onClick={() => onSelectChannel(channel.id)}
                        className={cn(
                          'group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[15px] transition-colors',
                          active
                            ? 'bg-abyss-600 text-white'
                            : 'text-slate-400 hover:bg-abyss-700/60 hover:text-slate-200',
                        )}
                      >
                        <span className="text-lg leading-none text-slate-500 group-hover:text-slate-300">
                          {channel.type === 'text' ? '#' : '🔊'}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{channel.name}</span>
                        {channel.unreadCount && !active ? (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                            {channel.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        {uncategorized.length > 0 && (
          <ul className="space-y-0.5">
            {uncategorized.map((channel) => {
              const active = channel.id === activeChannelId
              return (
                <li key={channel.id} className="animate-fade-in">
                  <button
                    type="button"
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[15px] transition-colors',
                      active
                        ? 'bg-abyss-600 text-white'
                        : 'text-slate-400 hover:bg-abyss-700/60 hover:text-slate-200',
                    )}
                  >
                    <span className="text-lg leading-none text-slate-500">{channel.type === 'text' ? '#' : '🔊'}</span>
                    <span className="truncate">{channel.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
