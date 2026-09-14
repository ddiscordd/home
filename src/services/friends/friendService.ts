import { serverTimestamp } from 'firebase/database'
import { dbGet, dbPush, dbUpdate } from '../db'
import { avatarColorFrom } from '../servers/serverService'
import type { Friend, PendingInvite, RequestInfo } from '../../types'

/**
 * Amizades + solicitações de amizade (estrutura):
 *   friends/{uid}/{friendUid}: true          (SEMPRE nos dois lados — relação única)
 *   usernames/{username}: uid                (índice para busca por @username)
 *   friendRequests/{id}: { fromUid, toUid, status, createdAt }
 *   friendRequestsIn/{toUid}/{id}: true      (índice de recebidas)
 *   friendRequestsOut/{fromUid}/{id}: true   (índice de enviadas)
 *   notifications/{uid}/invites/{id}         (convites de servidor recebidos)
 *
 * Não existe amizade "duplicada": a escrita nos dois lados é atômica e
 * A↔B é a mesma relação que B↔A (mesmo par de chaves).
 */

interface FriendProfileRow {
  username?: string
  displayName?: string
  status?: string
}

interface RequestRow {
  fromUid: string
  toUid: string
  status: string
  createdAt?: unknown
}

function toFriend(id: string, data: FriendProfileRow | null): Friend {
  return {
    id,
    username: data?.username ?? id.slice(0, 6),
    displayName: data?.displayName ?? data?.username ?? 'Amigo',
    avatarColor: avatarColorFrom(id),
    status: (data?.status ?? 'offline') as Friend['status'],
  }
}

/** Amizade única bidirecional (usada apenas pelo aceite da solicitação). */
async function createFriendship(a: string, b: string): Promise<void> {
  await dbUpdate('', {
    [`friends/${a}/${b}`]: true,
    [`friends/${b}/${a}`]: true,
  })
}

/** Lista de amigos do usuário (perfis resumidos). */
export async function listFriends(uid: string): Promise<Friend[]> {
  const index = (await dbGet<Record<string, boolean>>(`friends/${uid}`)) ?? {}
  const ids = Object.keys(index)
  if (ids.length === 0) return []
  const rows = await Promise.all(
    ids.map(async (fid) => ({ fid, data: await dbGet<FriendProfileRow>(`users/${fid}`) })),
  )
  return rows.map(({ fid, data }) => toFriend(fid, data))
}

/** Procura o UID pelo @username exato via índice (case-insensitive). */
export async function findUidByUsername(username: string): Promise<string | null> {
  const key = username.trim().toLowerCase().replace(/^@+/, '')
  if (!key) return null
  return dbGet<string>(`usernames/${key}`)
}

// ---------- SOLICITAÇÕES ----------

/** Envia solicitação por @username (nunca cria amizade direta). */
export async function sendFriendRequest(myUid: string, username: string): Promise<void> {
  const targetUid = await findUidByUsername(username)
  if (!targetUid) throw new Error('Nenhum usuário encontrado com esse @username.')
  if (targetUid === myUid) throw new Error('Você não pode adicionar a si mesmo.')

  const alreadyFriends = await dbGet(`friends/${myUid}/${targetUid}`)
  if (alreadyFriends) throw new Error('Vocês já são amigos.')

  // Já enviei para esta pessoa? (evita duplicar a própria solicitação)
  const outIndex = (await dbGet<Record<string, boolean>>(`friendRequestsOut/${myUid}`)) ?? {}
  for (const requestId of Object.keys(outIndex)) {
    const row = await dbGet<RequestRow>(`friendRequests/${requestId}`)
    if (row && row.toUid === targetUid && row.status === 'pending') {
      throw new Error('Solicitação já enviada. Aguarde a resposta.')
    }
  }

  // A pessoa já me enviou? Então o certo é aceitar a dela.
  const inIndex = (await dbGet<Record<string, boolean>>(`friendRequestsIn/${myUid}`)) ?? {}
  for (const requestId of Object.keys(inIndex)) {
    const row = await dbGet<RequestRow>(`friendRequests/${requestId}`)
    if (row && row.fromUid === targetUid && row.status === 'pending') {
      throw new Error('Esta pessoa já te enviou uma solicitação. Aceite na aba Solicitações.')
    }
  }

  const requestId = dbPush('friendRequests')
  if (!requestId) throw new Error('Não foi possível enviar a solicitação. Tente novamente.')
  await dbUpdate('', {
    [`friendRequests/${requestId}`]: {
      fromUid: myUid,
      toUid: targetUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    },
    [`friendRequestsOut/${myUid}/${requestId}`]: true,
    [`friendRequestsIn/${targetUid}/${requestId}`]: true,
  })
}

async function hydrateRequests(
  ids: string[],
  pickOtherUid: (row: RequestRow) => string,
): Promise<RequestInfo[]> {
  const rows = await Promise.all(
    ids.map(async (id) => ({ id, row: await dbGet<RequestRow>(`friendRequests/${id}`) })),
  )
  return Promise.all(
    rows
      .filter((entry): entry is { id: string; row: RequestRow } => entry.row?.status === 'pending')
      .map(async ({ id, row }) => {
        const otherUid = pickOtherUid(row)
        const profile = await dbGet<FriendProfileRow>(`users/${otherUid}`)
        return {
          id,
          otherUid,
          name: profile?.displayName ?? profile?.username ?? 'Usuário',
          username: profile?.username ?? otherUid.slice(0, 6),
          avatarColor: avatarColorFrom(otherUid),
          createdAt: row.createdAt,
        } as RequestInfo
      }),
  )
}

/** Solicitações que eu RECEBI (pendentes). */
export async function listIncomingRequests(uid: string): Promise<RequestInfo[]> {
  const index = (await dbGet<Record<string, boolean>>(`friendRequestsIn/${uid}`)) ?? {}
  return hydrateRequests(Object.keys(index), (row) => row.fromUid)
}

/** Solicitações que eu ENVIEI (pendentes). */
export async function listOutgoingRequests(uid: string): Promise<RequestInfo[]> {
  const index = (await dbGet<Record<string, boolean>>(`friendRequestsOut/${uid}`)) ?? {}
  return hydrateRequests(Object.keys(index), (row) => row.toUid)
}

/** Destinatário aceita: cria a amizade e arquiva a solicitação (sem duplicar). */
export async function acceptFriendRequest(uid: string, requestId: string): Promise<void> {
  const row = await dbGet<RequestRow>(`friendRequests/${requestId}`)
  if (!row || row.status !== 'pending') throw new Error('Essa solicitação não está mais disponível.')
  if (row.toUid !== uid) throw new Error('Você não pode aceitar esta solicitação.')
  await createFriendship(row.fromUid, uid)
  await dbUpdate('', {
    [`friendRequests/${requestId}/status`]: 'accepted',
    [`friendRequestsIn/${uid}/${requestId}`]: null,
    [`friendRequestsOut/${row.fromUid}/${requestId}`]: null,
  })
}

/** Destinatário recusa. */
export async function declineFriendRequest(uid: string, requestId: string): Promise<void> {
  const row = await dbGet<RequestRow>(`friendRequests/${requestId}`)
  if (!row || row.status !== 'pending') return
  await dbUpdate('', {
    [`friendRequests/${requestId}/status`]: 'declined',
    [`friendRequestsIn/${uid}/${requestId}`]: null,
    [`friendRequestsOut/${row.fromUid}/${requestId}`]: null,
  })
}

/** Remetente cancela a própria solicitação pendente. */
export async function cancelFriendRequest(myUid: string, requestId: string): Promise<void> {
  const row = await dbGet<RequestRow>(`friendRequests/${requestId}`)
  if (!row || row.status !== 'pending' || row.fromUid !== myUid) return
  await dbUpdate('', {
    [`friendRequests/${requestId}/status`]: 'canceled',
    [`friendRequestsOut/${myUid}/${requestId}`]: null,
    [`friendRequestsIn/${row.toUid}/${requestId}`]: null,
  })
}

/** Remove a amizade dos dois lados (atômico). */
export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  await dbUpdate('', {
    [`friends/${myUid}/${friendUid}`]: null,
    [`friends/${friendUid}/${myUid}`]: null,
  })
}

// ---------- CONVITES DE SERVIDOR PARA AMIGOS (mantido da etapa anterior) ----------

/** Envia o convite do servidor direto para o amigo (aparece como notificação). */
export async function sendServerInviteToFriend(input: {
  friend: Friend
  serverId: string
  serverName: string
  code: string
  fromUid: string
  fromName: string
}): Promise<void> {
  const notifId = dbPush(`notifications/${input.friend.id}/invites`)
  if (!notifId) throw new Error('Não foi possível enviar o convite.')
  const payload: Omit<PendingInvite, 'id'> = {
    code: input.code,
    serverId: input.serverId,
    serverName: input.serverName,
    fromUid: input.fromUid,
    fromName: input.fromName,
    createdAt: serverTimestamp(),
  }
  await dbUpdate(`notifications/${input.friend.id}/invites/${notifId}`, payload)
}

/** Convites pendentes recebidos (leitura pontual; o tempo real fica no AppContext). */
export async function listPendingInvites(uid: string): Promise<PendingInvite[]> {
  const val = (await dbGet<Record<string, Omit<PendingInvite, 'id'>>>(`notifications/${uid}/invites`)) ?? {}
  return Object.entries(val)
    .map(([id, data]) => ({ ...data, id }))
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

/** Descarta um convite recebido (remove o nó da notificação). */
export async function dismissPendingInvite(uid: string, notifId: string): Promise<void> {
  await dbUpdate(`notifications/${uid}/invites/${notifId}`, null as unknown as object)
}