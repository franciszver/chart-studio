'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkle, Lightning } from 'phosphor-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SchemaTable {
  name: string
  type: string
  columns: {
    name: string
    type: string
    nullable: boolean
    isPrimaryKey: boolean
    isForeignKey: boolean
    referencedTable?: string
    referencedColumn?: string
  }[]
}

interface SchemaMetadata {
  tables: SchemaTable[]
}

interface AiQueryInputProps {
  schema?: SchemaMetadata
  onSqlGenerated: (sql: string) => void
  className?: string
}

export function AiQueryInput({ schema, onSqlGenerated, className }: AiQueryInputProps) {
  const [query, setQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [source, setSource] = useState<'openai' | 'fallback' | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a natural language query')
      return
    }

    setIsGenerating(true)
    setSource(null)

    try {
      const response = await fetch('/api/ai/generate-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          schema: schema || { tables: [] },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate SQL')
      }

      onSqlGenerated(data.sql)
      setSource(data.source)

      if (data.message) {
        toast.info(data.message)
      } else if (data.source === 'openai') {
        toast.success('SQL generated with AI')
      } else {
        toast.success('SQL generated using pattern matching')
      }
    } catch (error) {
      console.error('Generate SQL error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate SQL')
    } finally {
      setIsGenerating(false)
    }
  }, [query, schema, onSqlGenerated])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Sparkle size={16} className="text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-foreground">Ask AI</span>
        {source && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded",
            source === 'openai'
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          )}>
            {source === 'openai' ? 'AI' : 'Pattern'}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Show me total revenue by month..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          disabled={isGenerating}
        />
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !query.trim()}
          className="gap-1.5"
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <Lightning size={14} weight="fill" />
              Generate
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Describe what data you want to see, and AI will generate the SQL query.
      </p>
    </div>
  )
}
