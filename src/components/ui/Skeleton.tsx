import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-dark-100 animate-pulse rounded-lg',
        className
      )}
    />
  )
}

// Skeleton untuk Game Card - smaller version
export function GameCardSkeleton() {
  return (
    <div className="bg-surface-primary rounded-lg border border-white/5 overflow-hidden">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-2">
        <Skeleton className="h-3 w-3/4 mb-1" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  )
}

// Skeleton untuk Product/Nominal Card
export function NominalCardSkeleton() {
  return (
    <div className="bg-dark-100 rounded-xl p-4 border border-white/5">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

// Skeleton untuk Transaction Row
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-surface-primary rounded-xl">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-6 w-16 ml-auto" />
      </div>
    </div>
  )
}

// Skeleton untuk Text Lines
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

// Skeleton untuk Stats Card
export function StatCardSkeleton() {
  return (
    <div className="bg-surface-primary rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}
