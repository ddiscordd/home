import type { User, UserStatus } from '../../types'
import { cn } from '../../utils/cn'

const STATUS_LABEL: Record<UserStatus, string> = {
  online: 'Online',
  idle: 'Ausente',
  dnd: 'Não perturbar',
  offline: 'Offline',
}

const STATUS_DOT: Record<UserStatus, string> = {
  online: 'bg-success-500',
  idle: 'bg-warning-500',
  dnd: 'bg-danger-500',
  offline: 'bg-slate-500',
}

interface AvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  className?: string
}

const SIZE: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function Avatar({ user, size = 'md', showStatus = false, className }: AvatarProps) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold text-white',
          SIZE[size],
        )}
        style={{ backgroundColor: user.avatarColor }}
        title={`${user.displayName} — ${STATUS_LABEL[user.status]}`}
      >
        {user.displayName.charAt(0).toUpperCase()}
      </div>
      {showStatus && (
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-surface-1',
            STATUS_DOT[user.status],
          )}
        />
      )}
    </div>
  )
}
