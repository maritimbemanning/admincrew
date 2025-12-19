'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Generic loading skeleton with different variants
interface LoadingSkeletonProps {
  className?: string
}

// Table row skeleton
export function TableRowSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('flex items-center space-x-4 py-3', className)}>
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
      <Skeleton className="h-6 w-[80px]" />
      <Skeleton className="h-8 w-8" />
    </div>
  )
}

// Table skeleton with multiple rows
interface TableSkeletonProps extends LoadingSkeletonProps {
  rows?: number
  showHeader?: boolean
}

export function TableSkeleton({ rows = 5, showHeader = true, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {showHeader && (
        <div className="flex items-center space-x-4 py-3 border-b">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
          <div className="flex-1" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  )
}

// Card skeleton
export function CardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[60%]" />
      </CardContent>
    </Card>
  )
}

// Card grid skeleton
interface CardGridSkeletonProps extends LoadingSkeletonProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
}

export function CardGridSkeleton({ count = 6, columns = 3, className }: CardGridSkeletonProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// Profile/detail page skeleton
export function ProfileSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[180px]" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-[80px]" />
            <Skeleton className="h-6 w-[80px]" />
            <Skeleton className="h-6 w-[80px]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[100px]" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-8 w-[80px]" />
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[90px]" />
        <Skeleton className="h-8 w-[70px]" />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

// Form skeleton
interface FormSkeletonProps extends LoadingSkeletonProps {
  fields?: number
}

export function FormSkeleton({ fields = 5, className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
    </div>
  )
}

// Kanban column skeleton
export function KanbanColumnSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-3 min-w-[280px] p-4 bg-muted/30 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-[100px]" />
        <Skeleton className="h-5 w-[40px]" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-background rounded-lg p-3 space-y-2">
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-3 w-[60%]" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-[50px]" />
            <Skeleton className="h-5 w-[50px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Kanban board skeleton
interface KanbanSkeletonProps extends LoadingSkeletonProps {
  columns?: number
}

export function KanbanSkeleton({ columns = 6, className }: KanbanSkeletonProps) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  )
}

// Stats/metrics skeleton
export function MetricCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[80px] mb-2" />
        <Skeleton className="h-3 w-[120px]" />
      </CardContent>
    </Card>
  )
}

interface MetricsGridSkeletonProps extends LoadingSkeletonProps {
  count?: number
}

export function MetricsGridSkeleton({ count = 4, className }: MetricsGridSkeletonProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Page loading skeleton combining metrics + table
export function PageSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <MetricsGridSkeleton />
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <TableSkeleton />
    </div>
  )
}

// Inline loading spinner
export function LoadingSpinner({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

// General LoadingSkeleton - wrapper that can be used for any loading state
export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

// Full page loading
export function FullPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Laster...</p>
      </div>
    </div>
  )
}

