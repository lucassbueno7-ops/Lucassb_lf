import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'onDark'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800',
    secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-teal-700 hover:bg-teal-50',
    onDark: 'text-white hover:bg-teal-600',
  }[variant]
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition disabled:opacity-50',
        styles,
        className,
      )}
    />
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={cx(
          'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30',
          className,
        )}
      />
    </label>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }

export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className={cx('min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base', className)}
      >
        {children}
      </select>
    </label>
  )
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
      {title && <h2 className="mb-3 text-base font-semibold">{title}</h2>}
      {children}
    </section>
  )
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  )
}

export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return <p className="p-6 text-center text-sm text-slate-500">{label}</p>
}
