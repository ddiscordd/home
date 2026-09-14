import { currentUserId, mockUsers, userById } from '../../data/mockUsers'
import type { User } from '../../types'

// Camada de acesso a usuários. Hoje lê mocks; no futuro vira Firebase Auth/Firestore.
// Manter a mesma assinatura para não quebrar componentes.
export async function getCurrentUser(): Promise<User> {
  return userById[currentUserId]
}

export async function listUsers(): Promise<User[]> {
  return mockUsers
}

export async function getUserById(id: string): Promise<User | undefined> {
  return userById[id]
}
