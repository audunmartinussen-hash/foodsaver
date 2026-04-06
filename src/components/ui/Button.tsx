'use client'

import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.97]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-dark-green text-white hover:bg-dark-green/90',
        variant === 'secondary' && 'bg-olive text-white hover:bg-olive/90',
        variant === 'outline' && 'border-2 border-dark-green text-dark-green hover:bg-dark-green/5',
        variant === 'ghost' && 'text-dark-green hover:bg-dark-green/5',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
