import type { InputType } from './types'
import { cn } from '../../utils/cn'

interface TextFieldProps {
  id: string
  label: string
  type: InputType
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  error?: string | null
  required?: boolean
}

export function TextField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  error,
  required = false,
}: TextFieldProps) {
  const describedBy = error ? `${id}-error` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-slate-300">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 w-full rounded-lg border bg-abyss-800 px-3 text-[15px] text-slate-100 outline-none transition-all',
          'placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/30',
          error && 'border-danger-500/70',
        )}
      />
      {error && (
        <p id={describedBy} role="alert" className="mt-1 text-xs text-danger-400">
          {error}
        </p>
      )}
    </div>
  )
}