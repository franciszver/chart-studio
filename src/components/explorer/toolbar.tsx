'use client'

import { Button } from '@/components/ui/button'
import { Play, Square, Download, Loader2 } from 'lucide-react'

interface ToolbarProps {
  onRun: () => void
  onCancel: () => void
  onExport: () => void
  isRunning: boolean
  hasResults: boolean
}

export function Toolbar({ onRun, onCancel, onExport, isRunning, hasResults }: ToolbarProps) {

  return (
    <div className="flex items-center gap-2 p-4 bg-card border-b border-border">
      <Button
        onClick={onRun}
        className="flex items-center gap-2"
        size="sm"
        disabled={isRunning}
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isRunning ? 'Running...' : 'Run'}
      </Button>

      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={!isRunning}
      >
        <Square className="w-4 h-4" />
        Cancel
      </Button>

      <Button
        onClick={onExport}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={!hasResults || isRunning}
      >
        <Download className="w-4 h-4" />
        Export
      </Button>

      <div className="ml-auto text-sm text-muted-foreground">
        <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
          Cmd+Enter
        </kbd>
        <span className="ml-1">to run</span>
      </div>
    </div>
  )
}
