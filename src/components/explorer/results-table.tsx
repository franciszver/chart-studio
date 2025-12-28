'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import { ColDef, GridApi } from 'ag-grid-community'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Create dark theme for AG Grid
const darkTheme = themeQuartz.withParams({
  backgroundColor: '#0a0a0b',
  foregroundColor: '#fafafa',
  headerBackgroundColor: '#131316',
  headerTextColor: '#fafafa',
  oddRowBackgroundColor: '#131316',
  rowHoverColor: '#1c1c1f',
  borderColor: '#27272a',
  accentColor: '#8b5cf6',
  selectedRowBackgroundColor: '#8b5cf620',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
})

interface ResultsTableProps {
  columns: string[]
  rows: Record<string, any>[]
  loading?: boolean
}

interface ResultsTableRef {
  exportToCsv: () => void
}

export const ResultsTable = React.forwardRef<ResultsTableRef, ResultsTableProps>(
  ({ columns, rows, loading = false }, ref) => {
    const gridRef = useRef<AgGridReact>(null)
    
    // Generate column definitions dynamically
  const columnDefs: ColDef[] = useMemo(() => {
    return columns.map(column => ({
      field: column,
      headerName: column.charAt(0).toUpperCase() + column.slice(1),
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 120,
      // Format numbers and dates appropriately
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) {
          return ''
        }
        if (typeof params.value === 'number') {
          // Format large numbers with commas
          if (Number.isInteger(params.value)) {
            return params.value.toLocaleString()
          } else {
            return params.value.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })
          }
        }
        return String(params.value)
      }
    }))
  }, [columns])

  // Grid configuration
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    resizable: true,
  }), [])

  const exportToCsv = useCallback(() => {
    if (gridRef.current) {
      const gridApi: GridApi = gridRef.current.api
      gridApi.exportDataAsCsv({
        fileName: `query_results_${new Date().toISOString().split('T')[0]}.csv`
      })
    }
  }, [])

  // Expose the export function to parent components
  React.useImperativeHandle(ref, () => ({
    exportToCsv
  }))

  if (loading) {
    return (
      <div className="h-full bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading results...</div>
        </div>
      </div>
    )
  }

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="h-full bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">No results to display</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={rows}
        defaultColDef={defaultColDef}
        theme={darkTheme}
        animateRows={true}
        rowSelection="multiple"
        enableBrowserTooltips={true}
        pagination={true}
        paginationPageSize={100}
        paginationPageSizeSelector={[50, 100, 200, 500]}
        suppressExcelExport={true}
        enableCellTextSelection={true}
        ensureDomOrder={true}
        suppressRowHoverHighlight={false}
        rowHeight={35}
        headerHeight={40}
      />
    </div>
  )
})

ResultsTable.displayName = 'ResultsTable'

// Export function that can be called from parent components
export const exportResultsToCsv = (gridRef: React.RefObject<AgGridReact>) => {
  if (gridRef.current) {
    const gridApi: GridApi = gridRef.current.api
    gridApi.exportDataAsCsv({
      fileName: `query_results_${new Date().toISOString().split('T')[0]}.csv`
    })
  }
}
