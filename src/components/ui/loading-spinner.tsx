'use client'

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground animate-pulse">Loading</span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  )
}
