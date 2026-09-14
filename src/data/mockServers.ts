import type { Membership, Server } from '../types'

export const mockServers: Server[] = [
  { id: 's-alpha', name: 'Servidor Alpha', initials: 'AL', color: '#7c5cff', unreadCount: 3, hasPing: true },
  { id: 's-dev', name: 'Clube Dev', initials: 'CD', color: '#3ba55d' },
  { id: 's-design', name: 'Estúdio Criativo', initials: 'EC', color: '#e06c5b', unreadCount: 12 },
  { id: 's-games', name: 'Arena Games', initials: 'AG', color: '#4d9de0', hasPing: true },
  { id: 's-music', name: 'Sala de Música', initials: 'MU', color: '#e5a83b' },
]

export const mockMemberships: Membership[] = [
  { serverId: 's-alpha', userId: 'u1', role: 'Membro' },
  { serverId: 's-alpha', userId: 'u2', role: 'Moderação' },
  { serverId: 's-alpha', userId: 'u3', role: 'Dev' },
  { serverId: 's-alpha', userId: 'u4', role: 'Design' },
  { serverId: 's-alpha', userId: 'u5', role: 'Membro' },
  { serverId: 's-alpha', userId: 'u6', role: 'Membro' },
  { serverId: 's-alpha', userId: 'u7', role: 'Membro' },
  { serverId: 's-dev', userId: 'u1', role: 'Membro' },
  { serverId: 's-dev', userId: 'u3', role: 'Dev' },
]
