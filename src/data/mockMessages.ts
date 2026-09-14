import type { Message } from '../types'

export const mockMessages: Message[] = [
  { id: 'm1', channelId: 'c-geral', userId: 'u2', content: 'Boas-vindas ao Servidor Alpha! Apresentem-se por aqui.', createdAt: '2026-09-11T09:12:00-03:00' },
  { id: 'm2', channelId: 'c-geral', userId: 'u3', content: 'Opa! Sou o Rafa, trabalho com front-end. Alguém mais usa React por aqui?', createdAt: '2026-09-11T09:15:00-03:00' },
  { id: 'm3', channelId: 'c-geral', userId: 'u4', content: 'Eu! Acabei de prototipar a nova área de chat. Depois mostro os prints.', createdAt: '2026-09-11T09:20:00-03:00' },
  { id: 'm4', channelId: 'c-geral', userId: 'u1', content: 'Contem comigo para testar. Bora deixar esse servidor incrível!', createdAt: '2026-09-11T09:26:00-03:00' },

  { id: 'm5', channelId: 'c-conversa', userId: 'u5', content: 'Alguém vai jogar mais tarde na Sala de Jogos?', createdAt: '2026-09-11T10:02:00-03:00' },
  { id: 'm6', channelId: 'c-conversa', userId: 'u3', content: 'Tô dentro depois das 20h. Só chamar!', createdAt: '2026-09-11T10:05:00-03:00' },

  { id: 'm7', channelId: 'c-programacao', userId: 'u3', content: 'Dica do dia: separem dados mockados da UI desde o começo. Facilita migrar para o banco real depois.', createdAt: '2026-09-11T11:00:00-03:00' },
  { id: 'm8', channelId: 'c-programacao', userId: 'u2', content: 'Boa! Também vale tipar tudo com TypeScript para não virar bagunça.', createdAt: '2026-09-11T11:04:00-03:00', edited: true },

  { id: 'm9', channelId: 'c-anuncios', userId: 'u2', content: 'Novo canal de programação liberado. Leiam as regras fixadas.', createdAt: '2026-09-10T18:00:00-03:00' },

  { id: 'm10', channelId: 'c-dev-geral', userId: 'u3', content: 'Bem-vindos ao Clube Dev. Postem seus projetos no canal frontend!', createdAt: '2026-09-11T08:00:00-03:00' },
  { id: 'm11', channelId: 'c-dev-front', userId: 'u4', content: 'Subi um exemplo de card com Tailwind. Quem quiser, reviso o código.', createdAt: '2026-09-11T08:30:00-03:00' },
]
