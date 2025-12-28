'use client'

import { useQuery, useMutation } from '@apollo/client'
import { useParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '@/components/layout/app-layout'
import { SilentErrorBoundary } from '@/components/common/silent-error-boundary'
import { Button } from '@/components/ui/button'
import { ArrowLeft, PencilSimple, Plus } from 'phosphor-react'
import Link from 'next/link'
import { gql } from '@apollo/client'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { DashboardCard } from '@/components/dashboard/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChartSpec } from '@/types/chart-spec'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Hardcoded layout for Phase 3 (Static Dashboard) - Clean 2x2 grid
const STATIC_LAYOUT = [
  { i: 'revenue-chart', x: 0, y: 0, w: 6, h: 4 },
  { i: 'pipeline-chart', x: 6, y: 0, w: 6, h: 4 },
  { i: 'ar-aging-chart', x: 0, y: 4, w: 6, h: 4 },
  { i: 'top-accounts-table', x: 6, y: 4, w: 6, h: 4 },
]

// Hardcoded chart specs for Phase 3
const CHART_SPECS: Record<string, ChartSpec> = {
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

const GET_DASHBOARD = gql`
  query GetDashboard($id: ID!) {
    dashboard(id: $id) {
      id
      name
      description
      category
      lastModified
      createdAt
      layout
      cards {
        id
        chartSpec
      }
    }
  }
`

const UPDATE_DASHBOARD_LAYOUT = gql`
  mutation UpdateDashboardLayout($id: ID!, $layout: JSON!) {
    updateDashboardLayout(id: $id, layout: $layout) {
      id
      name
      description
      category
      lastModified
      createdAt
      layout
      cards {
        id
        chartSpec
      }
    }
  }
`

export default function DashboardPage() {
  const params = useParams()
  const dashboardId = params.dashboardId as string
  const isUserInteractingRef = useRef(false)
  const [currentLayout, setCurrentLayout] = useState<any[]>([])

  const { data, loading, error } = useQuery(GET_DASHBOARD, {
    variables: { id: dashboardId },
  })

  const [updateDashboardLayout] = useMutation(UPDATE_DASHBOARD_LAYOUT)

  // Debounced function to save layout changes
  const debouncedSaveLayout = useDebouncedCallback(
    async (layout: any[]) => {
      try {
        await updateDashboardLayout({
          variables: {
            id: dashboardId,
            layout,
          },
          // Optimistically update the cache
          optimisticResponse: {
            updateDashboardLayout: {
              ...data?.dashboard,
              layout,
              lastModified: new Date().toISOString(),
            },
          },
        })
      } catch {
        // Layout save failed silently - non-critical
      }
    },
    500 // 500ms delay
  )

  const handleDragStart = () => {
    isUserInteractingRef.current = true
  }

  const handleDragStop = () => {
    // Keep the flag true briefly to capture the layout change, then reset
    setTimeout(() => {
      isUserInteractingRef.current = false
    }, 100)
  }

  const handleResizeStart = () => {
    isUserInteractingRef.current = true
  }

  const handleResizeStop = () => {
    // Keep the flag true briefly to capture the layout change, then reset
    setTimeout(() => {
      isUserInteractingRef.current = false
    }, 100)
  }

  const dashboard = data?.dashboard

  // Sync local layout state with server-provided layout (or static fallback) once data loads/changes
  // Helper to shallow-compare layout arrays
  const layoutsEqual = (a: any[], b: any[]) => {
    if (!a || !b) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      const ai = a[i]
      const bi = b[i]
      if (!bi || ai.i !== bi.i || ai.x !== bi.x || ai.y !== bi.y || ai.w !== bi.w || ai.h !== bi.h) {
        return false
      }
    }
    return true
  }

  useEffect(() => {
    if (!dashboard) return
    const initial = (Array.isArray(dashboard.layout) && dashboard.layout.length > 0)
      ? dashboard.layout
      : STATIC_LAYOUT
    setCurrentLayout(prev => (layoutsEqual(prev, initial) ? prev : initial))
  }, [dashboard])

  const cards = dashboard?.cards || []

  // Create responsive layouts for different screen sizes
  const layouts = useMemo(() => {
    const base = currentLayout && currentLayout.length > 0 ? currentLayout : STATIC_LAYOUT
    return {
      lg: base, // 12 cols
      md: base.map((item: any, index: number) => ({ ...item, w: 10, x: 0, y: index * 5 })), // 10 cols
      sm: base.map((item: any, index: number) => ({ ...item, w: 6, x: 0, y: index * 5 })), // 6 cols
      xs: base.map((item: any, index: number) => ({ ...item, w: 4, x: 0, y: index * 5 })), // 4 cols
      xxs: base.map((item: any, index: number) => ({ ...item, w: 2, x: 0, y: index * 5 })), // 2 cols
    }
  }, [currentLayout])

  // After declaring hooks, we can return early based on loading/error states
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboards">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            </Link>
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="min-h-[600px]">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !dashboard) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Link href="/dashboards">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboards
            </Button>
          </Link>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Dashboard not found
            </h3>
            <p className="text-muted-foreground">
              The dashboard you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboards">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="mt-2 text-muted-foreground">{dashboard.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {dashboard.category} • Last modified {new Date(dashboard.lastModified).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboards/${dashboardId}/cards/new/edit`}>
              <Button variant="outline" size="sm">
                <Plus size={16} className="mr-2" />
                Add Chart
              </Button>
            </Link>
            <Link href={`/dashboards/${dashboardId}/edit`}>
              <Button>
                <PencilSimple size={16} className="mr-2" />
                Edit Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="min-h-[600px]">
          <SilentErrorBoundary>
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            margin={[16, 16]}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".drag-handle"
            onLayoutChange={(layout) => {
              // Update local state only if layout actually changed to avoid render loops
              setCurrentLayout(prev => (layoutsEqual(prev, layout) ? prev : layout))
            }}
            onDragStart={handleDragStart}
            onDragStop={(layout) => {
              handleDragStop()
              // Persist once the interaction stops using the latest provided layout
              debouncedSaveLayout(layout as any[])
            }}
            onResizeStart={handleResizeStart}
            onResizeStop={(layout) => {
              handleResizeStop()
              debouncedSaveLayout(layout as any[])
            }}
          >
            {(currentLayout && currentLayout.length > 0 ? currentLayout : STATIC_LAYOUT).map((item: any) => {
              // Find the card data for this layout item
              const card = cards.find((c: any) => c.id === item.i)
              // Fall back to static data if no card found
              const chartSpec = card?.chartSpec || CHART_SPECS[item.i]
              
              if (!chartSpec) return null
              
              return (
                <div key={item.i}>
                  <DashboardCard
                    title={chartSpec.options?.title || item.i}
                    spec={chartSpec}
                    cardId={item.i}
                    dashboardId={dashboardId}
                  />
                </div>
              )
            })}
          </ResponsiveGridLayout>
          </SilentErrorBoundary>
        </div>
      </div>
    </AppLayout>
  )
}
