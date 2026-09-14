import type { User } from '../../types'
import { Avatar } from '../common/Avatar'

interface MembersSidebarProps {
  members: User[]
}

export function MembersSidebar({ members }: MembersSidebarProps) {
  const online = members.filter((m) => m.status !== 'offline')
  const offline = members.filter((m) => m.status === 'offline')

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-2 py-4">
      <Group title={`Online — ${online.length}`} users={online} />
      <div className="mt-5">
        <Group title={`Offline — ${offline.length}`} users={offline} dimmed />
      </div>
    </div>
  )
}

function Group({ title, users, dimmed = false }: { title: string; users: User[]; dimmed?: boolean }) {
  return (
    <div>
      <p className="px-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {users.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              title={user.customStatus ?? user.displayName}
              onClick={() => window.alert(`${user.displayName}: perfil em breve (mock).`)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-abyss-700/60"
            >
              <Avatar user={user} size="sm" showStatus />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[14px] font-medium ${dimmed ? 'text-slate-500' : 'text-slate-200'}`}>
                  {user.displayName}
                </span>
                {(user.customStatus || user.role) && (
                  <span className="block truncate text-xs text-slate-500">
                    {user.customStatus ?? user.role}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
