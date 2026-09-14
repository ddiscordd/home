import type { User } from '../types'

export const currentUserId = 'u1'

export const mockUsers: User[] = [
  { id: 'u1', username: 'voce', displayName: 'Você', avatarColor: '#7c5cff', status: 'online', role: 'Membro', customStatus: 'Construindo o Concord' },
  { id: 'u2', username: 'marina', displayName: 'Marina Alves', avatarColor: '#3ba55d', status: 'online', role: 'Moderação', customStatus: 'Revisando o #geral' },
  { id: 'u3', username: 'rafa.dev', displayName: 'Rafa Dev', avatarColor: '#e06c5b', status: 'idle', role: 'Dev', customStatus: 'Focado no front' },
  { id: 'u4', username: 'bia', displayName: 'Bia Costa', avatarColor: '#4d9de0', status: 'online', role: 'Design', customStatus: 'Prototipando o chat' },
  { id: 'u5', username: 'lucas', displayName: 'Lucas Prado', avatarColor: '#e5a83b', status: 'dnd', role: 'Membro', customStatus: 'Em call, não chamar' },
  { id: 'u6', username: 'ana', displayName: 'Ana Ribeiro', avatarColor: '#b565d8', status: 'offline', role: 'Membro' },
  { id: 'u7', username: 'thiago', displayName: 'Thiago Martins', avatarColor: '#5bc0be', status: 'offline', role: 'Membro' },
]

export const userById: Record<string, User> = Object.fromEntries(
  mockUsers.map((u) => [u.id, u]),
)
