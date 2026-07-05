import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'glow' | 'default'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    glow: 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 shadow-[0_0_10px_rgba(0,240,255,0.3)]',
    default: 'bg-white/10 text-white/80 border border-white/10',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

// Status Badge - khusus untuk status transaksi
export interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending_payment: { label: 'Menunggu Pembayaran', variant: 'warning' },
    paid: { label: 'Sudah Dibayar', variant: 'primary' },
    processing: { label: 'Sedang Diproses', variant: 'primary' },
    success: { label: 'Berhasil', variant: 'success' },
    failed: { label: 'Gagal', variant: 'error' },
    expired: { label: 'Kedaluwarsa', variant: 'default' },
    refunded: { label: 'Dikembalikan', variant: 'warning' },
    cancelled: { label: 'Dibatalkan', variant: 'default' },
  }

  const config = statusConfig[status] || { label: status, variant: 'default' as const }

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  )
}
