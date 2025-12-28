'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  Table as TableIcon, 
  Eye,
  Key,
  Link2
} from 'lucide-react'

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

interface ColumnMetadata {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  referencedTable?: string
  referencedColumn?: string
}

interface TableMetadata {
  name: string
  type: string
  columns: ColumnMetadata[]
}

interface SchemaMetadata {
  tables: TableMetadata[]
}

export function SchemaBrowser() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  const { data, loading, error, refetch } = useQuery<{ getSchemaMetadata: SchemaMetadata }>(
    GET_SCHEMA_METADATA,
    {
      fetchPolicy: 'cache-first',
    }
  )

  const handleRefresh = () => {
    refetch()
  }

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
    }
    setExpandedTables(newExpanded)
  }

  const filteredTables = data?.getSchemaMetadata.tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.columns.some(column => 
      column.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || []

  const getColumnIcon = (column: ColumnMetadata) => {
    if (column.isPrimaryKey) {
      return <Key className="w-3 h-3 text-amber-400" />
    }
    if (column.isForeignKey) {
      return <Link2 className="w-3 h-3 text-cyan-400" />
    }
    return null
  }

  const getTableIcon = (tableType: string) => {
    if (tableType === 'view') {
      return <Eye className="w-4 h-4 text-cyan-500" />
    }
    return <TableIcon className="w-4 h-4 text-muted-foreground" />
  }

  if (loading) {
    return (
      <div className="h-full p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-sm font-medium">Failed to load schema</p>
          <p className="text-xs mt-1 text-muted-foreground">{error.message}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Database Schema</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter tables and columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Schema Tree */}
      <div className="flex-1 overflow-auto p-2">
        {filteredTables.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No tables found</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try adjusting your search term</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTables.map((table) => (
              <Collapsible
                key={table.name}
                open={expandedTables.has(table.name)}
                onOpenChange={() => toggleTable(table.name)}
              >
                <CollapsibleTrigger className="flex items-center w-full text-left p-2 rounded hover:bg-muted group">
                  <div className="flex items-center flex-1 min-w-0">
                    {expandedTables.has(table.name) ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground mr-1 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground mr-1 flex-shrink-0" />
                    )}
                    {getTableIcon(table.type)}
                    <span className="text-sm font-medium text-foreground ml-2 truncate">
                      {table.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      ({table.columns.length} cols)
                    </span>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="ml-6 mt-1">
                  <div className="space-y-1">
                    {table.columns.map((column) => (
                      <div
                        key={column.name}
                        className="flex items-center p-1.5 text-xs text-foreground hover:bg-muted/50 rounded"
                      >
                        <div className="w-4 flex justify-center mr-2">
                          {getColumnIcon(column)}
                        </div>
                        <span className="font-medium mr-2 min-w-0 flex-shrink truncate">
                          {column.name}
                        </span>
                        <span className="text-muted-foreground text-xs ml-auto flex-shrink-0">
                          {column.type}
                        </span>
                        {!column.nullable && (
                          <span className="text-red-500 text-xs ml-1 flex-shrink-0">*</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Legend */}
      <div className="p-3 border-t border-border bg-muted/50">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center">
            <Key className="w-3 h-3 text-amber-400 mr-2" />
            <span>Primary Key</span>
          </div>
          <div className="flex items-center">
            <Link2 className="w-3 h-3 text-cyan-400 mr-2" />
            <span>Foreign Key</span>
          </div>
          <div className="flex items-center">
            <span className="text-red-500 mr-2">*</span>
            <span>Required (NOT NULL)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
