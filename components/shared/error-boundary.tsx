'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// Error display component
interface ErrorDisplayProps {
  error?: Error | null
  title?: string
  description?: string
  onRetry?: () => void
  showHomeButton?: boolean
  showBackButton?: boolean
  className?: string
}

export function ErrorDisplay({
  error,
  title = 'Noe gikk galt',
  description,
  onRetry,
  showHomeButton = true,
  showBackButton = true,
  className,
}: ErrorDisplayProps) {
  const errorMessage = description || error?.message || 'En uventet feil oppstod. Vennligst prøv igjen.'

  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {errorMessage}
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <pre className="mt-4 p-3 bg-muted rounded-md text-xs overflow-auto max-h-[200px]">
              {error.stack || error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          {showBackButton && (
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Prøv igjen
            </Button>
          )}
          {showHomeButton && (
            <Button variant="outline" asChild>
              <a href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Hjem
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Inline error alert
interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Feil',
  message,
  onRetry,
  className,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            <RefreshCw className="mr-2 h-3 w-3" />
            Prøv igjen
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Query error handler for React Query
interface QueryErrorProps {
  error: Error | null
  onRetry?: () => void
  fullPage?: boolean
}

export function QueryError({ error, onRetry, fullPage = false }: QueryErrorProps) {
  if (!error) return null

  if (fullPage) {
    return <ErrorDisplay error={error} onRetry={onRetry} />
  }

  return (
    <ErrorAlert
      message={error.message || 'Kunne ikke laste data'}
      onRetry={onRetry}
    />
  )
}

// Not found component
interface NotFoundProps {
  title?: string
  description?: string
  showHomeButton?: boolean
  showBackButton?: boolean
}

export function NotFound({
  title = 'Ikke funnet',
  description = 'Siden eller ressursen du leter etter finnes ikke.',
  showHomeButton = true,
  showBackButton = true,
}: NotFoundProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">404</span>
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {description}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          {showBackButton && (
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Button>
          )}
          {showHomeButton && (
            <Button asChild>
              <a href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Til dashboard
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
