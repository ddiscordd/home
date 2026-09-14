import type { Channel, ChannelCategory } from '../types'

export const mockCategories: ChannelCategory[] = [
  { id: 'cat-texto', serverId: 's-alpha', name: 'Texto' },
  { id: 'cat-voz', serverId: 's-alpha', name: 'Voz' },
  { id: 'cat-dev-geral', serverId: 's-dev', name: 'Geral' },
  { id: 'cat-dev-projetos', serverId: 's-dev', name: 'Projetos' },
]

export const mockChannels: Channel[] = [
  { id: 'c-geral', serverId: 's-alpha', categoryId: 'cat-texto', name: 'geral', type: 'text', topic: 'Conversas gerais da comunidade', unreadCount: 2 },
  { id: 'c-conversa', serverId: 's-alpha', categoryId: 'cat-texto', name: 'conversa', type: 'text', topic: 'Papo livre e descontraído' },
  { id: 'c-programacao', serverId: 's-alpha', categoryId: 'cat-texto', name: 'programação', type: 'text', topic: 'Dúvidas, dicas e código' },
  { id: 'c-anuncios', serverId: 's-alpha', categoryId: 'cat-texto', name: 'anúncios', type: 'text', topic: 'Novidades oficiais do servidor' },
  { id: 'c-sala-geral', serverId: 's-alpha', categoryId: 'cat-voz', name: 'Sala Geral', type: 'voice', connectedCount: 3 },
  { id: 'c-sala-jogos', serverId: 's-alpha', categoryId: 'cat-voz', name: 'Sala de Jogos', type: 'voice', connectedCount: 5 },

  { id: 'c-dev-geral', serverId: 's-dev', categoryId: 'cat-dev-geral', name: 'geral', type: 'text', topic: 'Boas-vindas ao Clube Dev' },
  { id: 'c-dev-ajuda', serverId: 's-dev', categoryId: 'cat-dev-geral', name: 'ajuda', type: 'text', topic: 'Peça ajuda com seu código' },
  { id: 'c-dev-front', serverId: 's-dev', categoryId: 'cat-dev-projetos', name: 'frontend', type: 'text', topic: 'React, CSS e interfaces', unreadCount: 1 },
  { id: 'c-dev-call', serverId: 's-dev', categoryId: 'cat-dev-projetos', name: 'Call de Pair', type: 'voice', connectedCount: 2 },
]
