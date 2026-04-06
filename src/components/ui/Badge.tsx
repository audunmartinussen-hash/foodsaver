import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'olive' | 'success' | 'error' | 'default'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variant === 'gold' && 'bg-gold/15 text-gold',
        variant === 'olive' && 'bg-olive/15 text-olive',
        variant === 'success' && 'bg-success/15 text-success',
        variant === 'error' && 'bg-error/15 text-error',
        variant === 'default' && 'bg-dark-green/10 text-dark-green',
        className
      )}
    >
      {children}
    </span>
  )
}
