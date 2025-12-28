'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/app-layout'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { SchemaBrowser } from '@/components/explorer/schema-browser'
import { Toolbar } from '@/components/explorer/toolbar'
import { SqlEditor } from '@/components/explorer/sql-editor'
import { ResultsTable } from '@/components/explorer/results-table'
import { validateSqlQuery, ValidationError } from '@/components/explorer/sql-validation'
import { AiQueryInput } from '@/components/explorer/ai-query-input'

const GET_SCHEMA_METADATA = gql`
  query GetSchemaMetadata {
    getSchemaMetadata {
      tables {
        name
        type
        columns {
          name
          type
          nullable
          isPrimaryKey
          isForeignKey
          referencedTable
          referencedColumn
        }
      }
    }
  }
`

const EXECUTE_SQL = gql`
  mutation ExecuteSql($sql: String!) {
    executeSql(sql: $sql) {
      runId
      columns
      rows
      rowCount
      executionTimeMs
      status
    }
  }
`

const CANCEL_QUERY = gql`
  mutation CancelQuery($runId: ID!) {
    cancelQuery(runId: $runId)
  }
`

interface SqlResult {
  runId: string
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  executionTimeMs: number
  status: string
}

export default function ExplorerPage() {
  const [sqlQuery, setSqlQuery] = useState('-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;')
  const [currentResult, setCurrentResult] = useState<SqlResult | null>(null)
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const resultsTableRef = useRef<{ exportToCsv: () => void }>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [resultsFadeIn, setResultsFadeIn] = useState(false)
  const [whiteFadeOpacity, setWhiteFadeOpacity] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [hasRunQuery, setHasRunQuery] = useState(false)
  const fadeTimeoutRef = useRef<any>(null)

  // Fetch schema metadata for autocomplete
  const { data: schemaData } = useQuery(GET_SCHEMA_METADATA, {
    fetchPolicy: 'cache-first',
  })

  // GraphQL mutations
  const [executeSql, { loading: isExecuting, error: executionError }] = useMutation(EXECUTE_SQL, {
    onCompleted: (data) => {
      const result = data.executeSql
      setCurrentResult(result)
      setCurrentRunId(null)
      toast.success(`Query completed in ${result.executionTimeMs}ms. ${result.rowCount} rows returned.`)

      // Start fade immediately
      setShowResults(true)
      requestAnimationFrame(() => {
        setResultsFadeIn(true)
      })
    },
    onError: (error) => {
      toast.error(`Query failed: ${error.message}`)
      setCurrentRunId(null)
    }
  })

  const [cancelQuery] = useMutation(CANCEL_QUERY, {
    onCompleted: () => {
      toast.info('Query canceled')
      setCurrentRunId(null)
    },
    onError: (error) => {
      toast.error(`Failed to cancel query: ${error.message}`)
    }
  })

  const schema = schemaData?.getSchemaMetadata

  // Handler functions
  const handleRunQuery = useCallback(async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query')
      return
    }

    // Mark that user has attempted to run a query
    setHasRunQuery(true)

    // Validate on run; show errors in results panel
    const errors = validateSqlQuery(sqlQuery)
    setValidationErrors(errors)
    setCurrentResult(null)
    setShowResults(false)
    setResultsFadeIn(false)
    if (errors.length > 0) {
      return
    }

    try {
      const result = await executeSql({
        variables: { sql: sqlQuery }
      })
      if (result.data?.executeSql) {
        setCurrentRunId(result.data.executeSql.runId)
      }
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  }, [sqlQuery, executeSql])

  const handleCancelQuery = useCallback(() => {
    if (currentRunId) {
      cancelQuery({
        variables: { runId: currentRunId }
      })
    }
  }, [currentRunId, cancelQuery])

  const handleExportResults = useCallback(() => {
    if (resultsTableRef.current) {
      resultsTableRef.current.exportToCsv()
      toast.success('Results exported to CSV')
    }
  }, [])

  // Add keyboard shortcut for running queries
  useHotkeys('meta+enter, ctrl+enter', (event) => {
    event.preventDefault()
    handleRunQuery()
  }, {
    enableOnContentEditable: true,
    enableOnFormTags: true
  }, [handleRunQuery])

  // Fade-in effect for results when they load
  useEffect(() => {
    if (currentResult && validationErrors.length === 0 && !isExecuting) {
      setResultsFadeIn(false)
      // Trigger content fade-in
      const id = requestAnimationFrame(() => setResultsFadeIn(true))
      // Trigger white overlay fade-out
      setWhiteFadeOpacity(1)
      const id2 = requestAnimationFrame(() => setWhiteFadeOpacity(0))
      return () => {
        cancelAnimationFrame(id)
        cancelAnimationFrame(id2)
      }
    } else {
      setResultsFadeIn(false)
      setWhiteFadeOpacity(0)
    }
  }, [currentResult, validationErrors, isExecuting])

  // Keyboard shortcuts
  useHotkeys(['cmd+enter', 'ctrl+enter'], handleRunQuery, {
    enableOnFormTags: true,
    preventDefault: true,
  })

  // Determine the CSS class for results panel
  const getResultsPanelClass = () => {
    if (!hasRunQuery) return 'results-panel-visible'
    if (showResults && resultsFadeIn) return 'results-panel-visible'
    return 'results-panel-hidden'
  }

  return (
    <AppLayout>
      <style jsx>{`
        .results-panel-visible {
          transition: opacity 300ms ease-in-out;
          opacity: 1;
        }
        .results-panel-hidden {
          transition: opacity 300ms ease-in-out;
          opacity: 0;
        }
        .load-spinner {
          z-index: 50;
          position: relative;
        }
      `}</style>
      <div className="h-full flex flex-col">
        <div className="border-b border-border pb-4 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Data Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Advanced SQL query interface for data exploration
          </p>
        </div>

        <Toolbar 
          onRun={handleRunQuery}
          onCancel={handleCancelQuery}
          onExport={handleExportResults}
          isRunning={isExecuting}
          hasResults={!!currentResult && currentResult.rows.length > 0}
        />

        <div className="flex-1 min-h-0">
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Schema Browser */}
            <Panel
              defaultSize={25}
              minSize={15}
              maxSize={40}
              className="bg-card border-r border-border"
            >
              <SchemaBrowser />
            </Panel>

            <PanelResizeHandle className="w-1 bg-border hover:bg-muted-foreground/20 transition-colors" />

            {/* Main Panel - SQL Editor and Results */}
            <Panel defaultSize={75} minSize={60}>
              <PanelGroup direction="vertical" className="h-full">
                {/* SQL Editor Panel */}
                <Panel
                  defaultSize={50}
                  minSize={30}
                  className="border-b border-border"
                >
                  <div className="h-full bg-background p-4 flex flex-col">
                    {/* AI Query Input */}
                    <AiQueryInput
                      schema={schema}
                      onSqlGenerated={setSqlQuery}
                      className="mb-4 pb-4 border-b border-border"
                    />

                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-foreground mb-1">SQL Query</h3>
                      <p className="text-xs text-muted-foreground">
                        Write SELECT queries to explore your data. Start typing for table/column suggestions, or use Ctrl+Space to trigger autocomplete.
                      </p>
                    </div>
                    <div className="flex-1 min-h-0">
                      <SqlEditor
                        value={sqlQuery}
                        onChange={setSqlQuery}
                        schema={schema}
                        placeholder="-- Write your SQL query here
SELECT * FROM customers LIMIT 10;"
                      />
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1 bg-border hover:bg-muted-foreground/20 transition-colors" />

                                                  {/* Results Panel */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="relative h-full bg-background">
                    {/* Spinner Overlay - Outside the results panel to remain visible */}
                    {isExecuting && (
                      <div className="absolute inset-0 z-50 bg-background flex items-center justify-center min-h-full load-spinner">
                        <div className="text-center">
                          <svg className="mx-auto w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24" aria-label="Loading">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <div className="mt-3 text-sm text-muted-foreground">Running query...</div>
                        </div>
                      </div>
                    )}

                    {/* Results Panel Content */}
                    <div className={`h-full flex flex-col ${getResultsPanelClass()}`}>
                      {/* Validation Errors */}
                      {validationErrors.length > 0 && (
                        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/30">
                          <div className="text-sm font-medium text-red-400 mb-1">Query Validation Errors:</div>
                          <ul className="list-disc ml-5 space-y-1">
                            {validationErrors.map((e, i) => (
                              <li key={i} className="text-sm text-red-400">{e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Execution Summary */}
                      {currentResult && validationErrors.length === 0 && (
                        <div className="px-4 py-3 bg-muted/50 border-b border-border">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                <span className="font-medium text-foreground">{currentResult.rowCount.toLocaleString()}</span> rows returned
                              </span>
                              <span className="text-muted-foreground">
                                Executed in <span className="font-medium text-foreground">{currentResult.executionTimeMs}ms</span>
                              </span>
                              <span className="text-muted-foreground">
                                Status: <span className="font-medium text-foreground capitalize">{currentResult.status}</span>
                              </span>
                            </div>
                            {currentResult.runId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                Run ID: {currentResult.runId}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Results Content */}
                      <div className="flex-1 min-h-0">
                        {currentResult && validationErrors.length === 0 ? (
                          <div className={`relative h-full transition-opacity duration-700 ${showResults && resultsFadeIn ? 'opacity-100' : 'opacity-0'}`}>
                            {/* White overlay that fades out to reveal results */}
                            <div
                              className="pointer-events-none absolute inset-0 bg-background"
                              style={{ opacity: whiteFadeOpacity, transition: 'opacity 700ms ease' }}
                            />
                            <ResultsTable
                              ref={resultsTableRef}
                              columns={currentResult.columns}
                              rows={currentResult.rows}
                              loading={isExecuting}
                            />
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            {validationErrors.length > 0 ? (
                              <div className="text-center text-destructive">
                                <h3 className="text-lg font-medium mb-2">Query Validation Errors</h3>
                                <p className="text-sm">Fix the issues above and run again.</p>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground">
                                <h3 className="text-lg font-medium mb-2">Query Results</h3>
                                <p className="text-sm">Run a SQL query to see results here</p>
                                <p className="text-xs mt-2 text-muted-foreground/60">
                                  Use <kbd className="px-1 py-0.5 text-xs bg-muted border border-border rounded">Cmd+Enter</kbd> to execute
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </AppLayout>
  )
}