import { cn } from '@/lib/utils'

export interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover = false, glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface-primary rounded-2xl border border-white/5 shadow-card',
        'transition-all duration-300',
        hover && 'cursor-pointer hover:shadow-card-hover hover:border-primary-500/30 hover:scale-[1.02]',
        glow && 'border border-accent-cyan/20 hover:border-accent-cyan/50 hover:shadow-glow-cyan',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6 pb-0', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6 pt-0 flex items-center gap-4', className)}>
      {children}
    </div>
  )
}
