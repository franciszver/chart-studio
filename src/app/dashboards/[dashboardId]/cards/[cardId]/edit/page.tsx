'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartRenderer } from '@/components/charts/renderer'
import AppLayout from '@/components/layout/app-layout'
import { useGetSchemaMetadataQuery, useExecuteChartQuery, useUpsertCardMutation, useGetDashboardQuery } from '@/graphql/generated/graphql'
import { ChartSpec, ChartType } from '@/types/chart-spec'
import { setChartType } from '@/lib/chart-spec-builder'
import { toast } from 'sonner'
import { ArrowLeft, X } from 'lucide-react'

interface Field {
  name: string
  type: string
  table: string
  nullable?: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

// Available chart types
const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'table', label: 'Table' },
] as const

// Static chart specs for demo cards (same as dashboard page)
const STATIC_CHART_SPECS: Record<string, ChartSpec> = {
  'revenue-chart': {
    v: 1,
    type: 'line',
    data: {
      source: 'sales_revenue',
      dimensions: [{ field: 'month' }, { field: 'lead_source' }],
      measures: [{ field: 'revenue', aggregate: 'sum', label: 'Revenue' }],
    },
    encodings: {
      x: { field: 'month' },
      y: { field: 'revenue', aggregate: 'sum', label: 'Revenue' },
      series: { field: 'lead_source' },
      smooth: true,
    },
    options: {
      title: 'Revenue by Month',
      subtitle: 'Track revenue trends across different lead sources over time to identify seasonal patterns and channel performance.',
      legend: 'bottom',
      height: 240,
    },
  },
  'pipeline-chart': {
    v: 1,
    type: 'bar',
    data: {
      source: 'pipeline_stages',
      dimensions: [{ field: 'stage' }],
      measures: [{ field: 'amount', aggregate: 'sum' }],
    },
    encodings: {
      x: { field: 'stage' },
      y: { field: 'amount', aggregate: 'sum' },
    },
    options: {
      title: 'Pipeline by Stage',
      subtitle: 'Visualize deal progression through your sales pipeline to identify bottlenecks and conversion opportunities.',
      height: 240,
    },
  },
  'ar-aging-chart': {
    v: 1,
    type: 'pie',
    data: {
      source: 'ar_aging',
      dimensions: [{ field: 'aging_bucket' }],
      measures: [{ field: 'amount_due', aggregate: 'sum' }],
    },
    encodings: {
      series: { field: 'aging_bucket' },
      y: { field: 'amount_due', aggregate: 'sum' },
    },
    options: {
      title: 'A/R by Aging',
      subtitle: 'Monitor outstanding receivables by aging buckets to manage cash flow and identify collection priorities.',
      legend: 'right',
      height: 240,
    },
  },
  'top-accounts-table': {
    v: 1,
    type: 'table',
    data: {
      source: 'top_accounts',
      dimensions: [{ field: 'account_name' }],
      measures: [{ field: 'revenue_90d', aggregate: 'sum', label: 'Revenue (90d)' }],
    },
    encodings: {},
    options: {
      title: 'Top Accounts',
      subtitle: 'Review your highest-value customer accounts by 90-day revenue to focus retention and growth efforts.',
    },
  },
}

interface DroppableShelf {
  id: string
  label: string
  encoding: 'x' | 'y' | 'series' | 'category' | 'value' | 'columns'
  accepts: string[]
  maxItems?: number
}

export default function ChartBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.dashboardId as string
  const cardId = params.cardId as string
  const isNewCard = cardId === 'new'

  // Schema data
  const { data: schemaData, loading: schemaLoading } = useGetSchemaMetadataQuery()

  // Fetch existing card data when editing
  const { data: dashboardData, loading: dashboardLoading } = useGetDashboardQuery({
    variables: { id: dashboardId },
    skip: isNewCard,
  })

  // Chart spec state
  const [chartSpec, setChartSpec] = useState<ChartSpec>({
    v: 1,
    type: 'bar',
    data: {
      source: '',
      dimensions: [],
      measures: []
    },
    encodings: {},
    options: {
      title: 'New Chart',
      height: 300
    }
  })

  // Track if we've initialized from existing card
  const [initialized, setInitialized] = useState(false)

  // UI state
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [draggedField, setDraggedField] = useState<Field | null>(null)

  // Initialize chart spec from existing card data or static specs
  useEffect(() => {
    if (!isNewCard && !initialized) {
      // First, try to find the card in the database
      const existingCard = dashboardData?.dashboard?.cards?.find(card => card.id === cardId)

      if (existingCard?.chartSpec) {
        // Card found in database
        const spec = existingCard.chartSpec as ChartSpec
        setChartSpec(spec)
        if (spec.data?.source) {
          setSelectedTable(spec.data.source)
        }
        setInitialized(true)
      } else if (STATIC_CHART_SPECS[cardId]) {
        // Fall back to static chart spec for demo cards
        const spec = STATIC_CHART_SPECS[cardId]
        setChartSpec(spec)
        if (spec.data?.source) {
          setSelectedTable(spec.data.source)
        }
        setInitialized(true)
      } else if (!dashboardLoading) {
        // Dashboard loaded but card not found anywhere - mark as initialized anyway
        // This allows creating a new card with the given ID
        setInitialized(true)
      }
    }
  }, [isNewCard, dashboardData, dashboardLoading, cardId, initialized])
  
  // Mutations
  const [upsertCard, { loading: saving }] = useUpsertCardMutation({
    update(cache, { data }) {
      if (data?.upsertCard) {
        // Update the GET_DASHBOARD cache to include the new/updated card
        const dashboardCacheId = cache.identify({ __typename: 'Dashboard', id: dashboardId })
        if (dashboardCacheId) {
          cache.modify({
            id: dashboardCacheId,
            fields: {
              cards(existingCards) {
                const newCard = data.upsertCard
                // Ensure existingCards is an array
                const cards = Array.isArray(existingCards) ? existingCards : []
                // If it's a new card, add it to the list
                if (isNewCard) {
                  return [...cards, newCard]
                }
                // If updating existing card, replace it
                return cards.map((card: any) => 
                  card.id === newCard.id ? newCard : card
                )
              },
              layout(existingLayout) {
                const newCard = data.upsertCard
                // Ensure existingLayout is an array
                const layout = Array.isArray(existingLayout) ? existingLayout : []
                // If it's a new card and not in layout, add layout entry
                if (isNewCard && !layout.find((item: any) => item.i === newCard.id)) {
                  const maxY = layout.length > 0 ? Math.max(...layout.map((item: any) => item.y + item.h)) : 0
                  return [...layout, {
                    i: newCard.id,
                    x: 0,
                    y: maxY,
                    w: 4,
                    h: 5
                  }]
                }
                return layout
              }
            }
          })
        }
      }
    }
  })

  // Live preview with debounced execution
  const { data: previewData, loading: previewLoading, error: previewError } = useExecuteChartQuery({
    variables: { spec: chartSpec },
    skip: !chartSpec.data.source || chartSpec.data.measures.length === 0,
    fetchPolicy: 'cache-and-network',
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  )

  // Get available fields from selected table
  const availableFields: Field[] = selectedTable && schemaData?.getSchemaMetadata ? 
    schemaData.getSchemaMetadata.tables
      .find(table => table.name === selectedTable)?.columns
      .map(col => ({
        name: col.name,
        type: col.type,
        table: selectedTable,
        nullable: col.nullable,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: col.isForeignKey
      })) || [] : []

  // Define drop targets (shelves) based on chart type
  const getShelvesForChartType = (type: string): DroppableShelf[] => {
    switch (type) {
      case 'pie':
        return [
          { id: 'category', label: 'Category', encoding: 'category', accepts: ['string', 'date'] },
          { id: 'value', label: 'Value', encoding: 'value', accepts: ['number'], maxItems: 1 },
        ]
      case 'table':
        return [
          { id: 'columns', label: 'Columns', encoding: 'columns', accepts: ['string', 'number', 'date'], maxItems: 10 },
        ]
      case 'scatter':
        return [
          { id: 'x-axis', label: 'X-Axis (Numeric)', encoding: 'x', accepts: ['number'], maxItems: 1 },
          { id: 'y-axis', label: 'Y-Axis (Numeric)', encoding: 'y', accepts: ['number'], maxItems: 1 },
          { id: 'series', label: 'Color By', encoding: 'series', accepts: ['string'], maxItems: 1 },
        ]
      default: // bar, line
        return [
          { id: 'x-axis', label: 'X-Axis', encoding: 'x', accepts: ['string', 'date'], maxItems: 1 },
          { id: 'y-axis', label: 'Y-Axis', encoding: 'y', accepts: ['number'], maxItems: 1 },
          { id: 'series', label: 'Series', encoding: 'series', accepts: ['string'], maxItems: 1 },
        ]
    }
  }

  const shelves = getShelvesForChartType(chartSpec.type)

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const field = availableFields.find(f => f.name === event.active.id)
    setDraggedField(field || null)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedField(null)

    if (!over) return

    // Get field from active - either from data.current or find by id
    let field = active.data.current as Field
    if (!field) {
      field = availableFields.find(f => f.name === active.id)
    }
    
    // Get shelf from over - either from data.current or find by id
    let shelf = over.data.current as DroppableShelf
    if (!shelf) {
      shelf = shelves.find(s => s.id === over.id)
    }
    
    if (!field || !shelf) {
      return
    }

    // Check if field type is accepted by the shelf
    const fieldType = getFieldDataType(field.type)
    if (!shelf.accepts.includes(fieldType)) {
      toast.error(`Cannot drop ${field.type} field into ${shelf.label}`)
      return
    }

    // Update chart spec based on the shelf
    addFieldToShelf(field, shelf)
  }

  // Map database types to general data types
  const getFieldDataType = (dbType: string): string => {
    const lowerType = dbType.toLowerCase()
    if (lowerType.includes('int') || lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('number')) {
      return 'number'
    }
    if (lowerType.includes('date') || lowerType.includes('time')) {
      return 'date'
    }
    return 'string'
  }

  // Add field to a shelf (update chart spec)
  const addFieldToShelf = (field: Field, shelf: DroppableShelf) => {
    setChartSpec(prev => {
      const newSpec = { ...prev }
      
      // Update data source if not set
      if (!newSpec.data.source) {
        newSpec.data.source = field.table
      }

      // Handle different shelf types
      switch (shelf.encoding) {
        case 'x':
          newSpec.encodings = { ...newSpec.encodings, x: { field: field.name } }
          // For scatter plots, X is numeric and should be added to measures
          // For bar/line, X is typically a dimension (string/date)
          if (newSpec.type === 'scatter') {
            // Scatter X is numeric - add to measures if not already present
            if (!newSpec.data.measures.some(m => m.field === field.name)) {
              newSpec.data.measures.push({
                field: field.name,
                aggregate: 'sum',
                label: field.name
              })
            }
          } else {
            // Bar/line X is a dimension
            if (getFieldDataType(field.type) !== 'number') {
              if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
                newSpec.data.dimensions.push({ field: field.name })
              }
            }
          }
          break
          
        case 'y':
          newSpec.encodings = { ...newSpec.encodings, y: { field: field.name } }
          // Add to measures
          if (!newSpec.data.measures.some(m => m.field === field.name)) {
            newSpec.data.measures.push({ 
              field: field.name, 
              aggregate: 'sum',
              label: field.name 
            })
          }
          break
          
        case 'series':
          newSpec.encodings = { ...newSpec.encodings, series: { field: field.name } }
          if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
            newSpec.data.dimensions.push({ field: field.name })
          }
          break
          
        case 'category':
          newSpec.encodings = { ...newSpec.encodings, category: { field: field.name } }
          if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
            newSpec.data.dimensions.push({ field: field.name })
          }
          break
          
        case 'value':
          newSpec.encodings = { ...newSpec.encodings, value: { field: field.name } }
          if (!newSpec.data.measures.some(m => m.field === field.name)) {
            newSpec.data.measures.push({ 
              field: field.name, 
              aggregate: 'sum',
              label: field.name 
            })
          }
          break
          
        case 'columns':
          // For table columns, we store multiple fields in a columns array
          const currentColumns = (newSpec.encodings as any).columns || []
          const newColumns = [...currentColumns]
          
          // Check if field is already added
          if (!newColumns.some((col: any) => col.field === field.name)) {
            newColumns.push({ field: field.name })
            
            // Add to dimensions for string/date fields, measures for number fields
            const fieldType = getFieldDataType(field.type)
            if (fieldType === 'number') {
              if (!newSpec.data.measures.some(m => m.field === field.name)) {
                newSpec.data.measures.push({ 
                  field: field.name, 
                  aggregate: 'sum',
                  label: field.name 
                })
              }
            } else {
              if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
                newSpec.data.dimensions.push({ field: field.name })
              }
            }
          }
          
          newSpec.encodings = { ...newSpec.encodings, columns: newColumns }
          break
      }

      return newSpec
    })
  }

  // Remove field from shelf
  const removeFieldFromShelf = (shelf: DroppableShelf) => {
    setChartSpec(prev => {
      const newSpec = { ...prev }
      
      // Remove from encodings
      if (newSpec.encodings && (newSpec.encodings as any)[shelf.encoding]) {
        delete (newSpec.encodings as any)[shelf.encoding]
      }
      
      return newSpec
    })
  }

  // Remove specific field from columns shelf
  const removeFieldFromColumnsShelf = (fieldToRemove: Field) => {
    setChartSpec(prev => {
      const newSpec = { ...prev }
      const currentColumns = (newSpec.encodings as any).columns || []
      
      // Remove the field from columns
      const newColumns = currentColumns.filter((col: any) => col.field !== fieldToRemove.name)
      
      // Remove from dimensions/measures
      newSpec.data.dimensions = newSpec.data.dimensions.filter(d => d.field !== fieldToRemove.name)
      newSpec.data.measures = newSpec.data.measures.filter(m => m.field !== fieldToRemove.name)
      
      // Update encodings
      if (newColumns.length > 0) {
        (newSpec.encodings as any).columns = newColumns
      } else {
        delete (newSpec.encodings as any).columns
      }
      
      return newSpec
    })
  }

  // Get field currently in a shelf
  const getFieldInShelf = (shelf: DroppableShelf): string | null => {
    if (!chartSpec.encodings) return null
    const encoding = (chartSpec.encodings as any)[shelf.encoding]
    
    // Handle columns encoding which stores multiple fields
    if (shelf.encoding === 'columns' && Array.isArray(encoding)) {
      return encoding.length > 0 ? `${encoding.length} columns` : null
    }
    
    return encoding?.field || null
  }

  // Get all fields in a shelf (for multi-field shelves like table columns)
  const getFieldsInShelf = (shelf: DroppableShelf): Field[] => {
    if (!chartSpec.encodings) return []
    const encoding = (chartSpec.encodings as any)[shelf.encoding]
    
    if (shelf.encoding === 'columns' && Array.isArray(encoding)) {
      return encoding.map((col: any) => 
        availableFields.find(f => f.name === col.field)
      ).filter((field): field is Field => field !== undefined)
    }
    
    if (encoding?.field) {
      const field = availableFields.find(f => f.name === encoding.field)
      return field ? [field] : []
    }
    
    return []
  }

  // Handle chart type change while preserving fields
  const handleChartTypeChange = (newType: ChartType) => {
    setChartSpec(prev => setChartType(prev, newType))
  }

  // Handle save
  const handleSave = async () => {
    if (!chartSpec.data.source || chartSpec.data.measures.length === 0) {
      toast.error('Please add at least one measure to the chart')
      return
    }

    try {
      await upsertCard({
        variables: {
          dashboardId,
          cardId: isNewCard ? undefined : cardId,
          chartSpec
        }
      })
      
      toast.success(isNewCard ? 'Chart created successfully!' : 'Chart updated successfully!')
      router.push(`/dashboards/${dashboardId}`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save chart')
    }
  }

  // Show loading state when fetching existing card
  if (!isNewCard && (dashboardLoading || !initialized)) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Edit Chart</h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="w-8 h-8 rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              {isNewCard ? 'Create New Chart' : 'Edit Chart'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Chart'}
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Fields and Data Source */}
            <div className="w-80 border-r border-border bg-muted/50 flex flex-col">
              <div className="p-4 border-b border-border bg-card">
                <h2 className="font-medium mb-3 text-foreground">Data Source</h2>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {schemaLoading ? (
                      <div className="p-2">Loading tables...</div>
                    ) : (
                      schemaData?.getSchemaMetadata?.tables.map(table => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-medium mb-3 text-foreground">Available Fields</h3>
                  {!selectedTable ? (
                    <p className="text-sm text-muted-foreground">Select a table to see fields</p>
                  ) : availableFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No fields found</p>
                  ) : (
                    <div className="space-y-2">
                      {availableFields.map(field => (
                        <FieldItem key={field.name} field={field} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Chart Configuration */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="chart-title">Chart Title</Label>
                    <Input
                      id="chart-title"
                      value={chartSpec.options?.title || ''}
                      onChange={(e) => setChartSpec(prev => ({
                        ...prev,
                        options: { ...prev.options, title: e.target.value }
                      }))}
                      placeholder="Enter chart title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select
                      value={chartSpec.type}
                      onValueChange={handleChartTypeChange}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Drop Shelves */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {shelves.map(shelf => 
                    shelf.encoding === 'columns' ? (
                      <MultiFieldDropShelf
                        key={shelf.id}
                        shelf={shelf}
                        fields={getFieldsInShelf(shelf)}
                        onRemoveField={(field) => removeFieldFromColumnsShelf(field)}
                      />
                    ) : (
                      <DropShelf
                        key={shelf.id}
                        shelf={shelf}
                        fieldName={getFieldInShelf(shelf)}
                        onRemove={() => removeFieldFromShelf(shelf)}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Chart Preview */}
              <div className="flex-1 p-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    {!chartSpec.data.source ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Select a data source and add fields to see preview
                      </div>
                    ) : chartSpec.data.measures.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Add at least one measure to see preview
                      </div>
                    ) : previewLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Skeleton className="w-full h-64" />
                      </div>
                    ) : previewError ? (
                      <div className="h-full flex items-center justify-center text-red-400">
                        Error loading preview: {previewError.message}
                      </div>
                    ) : (
                      <ChartRenderer
                        spec={{
                          ...chartSpec,
                          data: {
                            ...chartSpec.data,
                            rows: previewData?.executeChart?.rows || []
                          }
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {draggedField ? (
              <div className="bg-primary/20 border border-primary rounded px-3 py-2 shadow-lg">
                <div className="font-medium text-foreground">{draggedField.name}</div>
                <div className="text-xs text-muted-foreground">{draggedField.type}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  )
}

// Field Item Component (Draggable)
function FieldItem({ field }: { field: Field }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: field.name,
    data: field,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-sm transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate text-foreground">{field.name}</div>
          <div className="text-xs text-muted-foreground">{field.type}</div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {field.isPrimaryKey && (
            <span className="bg-amber-500/20 text-amber-400 text-xs px-1 rounded">PK</span>
          )}
          {field.isForeignKey && (
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-1 rounded">FK</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Multi-Field Drop Shelf Component (for Table columns)
function MultiFieldDropShelf({
  shelf,
  fields,
  onRemoveField
}: {
  shelf: DroppableShelf
  fields: Field[]
  onRemoveField: (field: Field) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: shelf.id,
    data: shelf,
  })

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-32 transition-colors ${
        isOver
          ? 'border-primary bg-primary/10'
          : 'border-border bg-muted/50'
      }`}
    >
      <div className="text-sm font-medium text-foreground mb-3">{shelf.label}</div>

      {fields.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {fields.map(field => (
            <div
              key={field.name}
              className="bg-primary/20 border border-primary/50 rounded px-2 py-1 flex items-center justify-between text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-foreground">{field.name}</div>
                <div className="text-muted-foreground truncate">{field.type}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => onRemoveField(field)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">
          Drop {shelf.accepts.join('/')} fields here
          <br />
          <span className="text-muted-foreground/70">Multiple fields supported</span>
        </div>
      )}
    </div>
  )
}

// Drop Shelf Component
function DropShelf({
  shelf,
  fieldName,
  onRemove
}: {
  shelf: DroppableShelf
  fieldName: string | null
  onRemove: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: shelf.id,
    data: shelf,
  })

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-20 transition-colors ${
        isOver
          ? 'border-primary bg-primary/10'
          : 'border-border bg-muted/50'
      }`}
    >
      <div className="text-sm font-medium text-foreground mb-2">{shelf.label}</div>
      {fieldName ? (
        <div className="bg-primary/20 border border-primary/50 rounded px-2 py-1 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{fieldName}</span>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Drop {shelf.accepts.join('/')} field here
        </div>
      )}
    </div>
  )
}
