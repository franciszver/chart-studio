'use client'

import { HTMLAttributes } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DotsThree, Eye, Copy, PencilSimple, Trash, ChartBar, ChartPie, ChartLineUp, Table, DotsSixVertical } from 'phosphor-react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Dashboard {
  id: string
  name: string
  description?: string
  category: string
  lastModified: string
  createdAt: string
}

interface DashboardCardProps {
  dashboard: Dashboard
  onEdit: (dashboard: Dashboard) => void
  onDuplicate: (dashboard: Dashboard) => void
  onDelete: (dashboard: Dashboard) => void
}

const getChartTypeIcon = (chartType: string) => {
  switch (chartType) {
    case 'bar':
      return <ChartBar size={16} className="text-muted-foreground" />
    case 'pie':
      return <ChartPie size={16} className="text-muted-foreground" />
    case 'line':
      return <ChartLineUp size={16} className="text-muted-foreground" />
    case 'table':
      return <Table size={16} className="text-muted-foreground" />
    default:
      return <ChartBar size={16} className="text-muted-foreground" />
  }
}

const getAllChartTypes = (dashboard: Dashboard) => {
  if (!dashboard.cards || dashboard.cards.length === 0) return []
  
  const chartTypes = dashboard.cards
    .map((card: any) => card.chartSpec?.type)
    .filter((type: string) => type) // Remove undefined/null
  
  return chartTypes // Keep all, including duplicates
}

// Base card content component (without drag functionality)
function DashboardCardContent({
  dashboard,
  onEdit,
  onDuplicate,
  onDelete,
  dragHandleProps,
}: DashboardCardProps & { dragHandleProps?: HTMLAttributes<HTMLDivElement> }) {
  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full gap-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          {/* Drag handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary mr-2 -ml-1"
              title="Drag to reorder"
            >
              <DotsSixVertical size={16} />
            </div>
          )}
          <div className="flex-1">
            <Link href={`/dashboards/${dashboard.id}`} className="block">
              <CardTitle className="text-lg line-clamp-1 hover:text-primary transition-colors">{dashboard.name}</CardTitle>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              {getAllChartTypes(dashboard).map((chartType, index) => (
                <div key={index}>
                  {getChartTypeIcon(chartType)}
                </div>
              ))}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <DotsThree size={16} />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboards/${dashboard.id}`}>
                  <Eye size={16} className="mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(dashboard)}>
                <PencilSimple size={16} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(dashboard)}>
                <Copy size={16} className="mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(dashboard)}
                className="text-red-600"
              >
                <Trash size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Category:</span> {dashboard.category}</p>
          {dashboard.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              <span className="font-medium text-foreground">Description:</span> {dashboard.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Charts:</span>{' '}
            {dashboard.cards && dashboard.cards.length > 0
              ? dashboard.cards.map((card: { chartSpec?: { options?: { title?: string } } }) => card.chartSpec?.options?.title || 'Untitled Chart').join(', ')
              : 'No charts yet'
            }
          </p>
      </CardContent>
    </Card>
  )
}

// Sortable version of DashboardCard for drag-and-drop reordering
export function SortableDashboardCard({
  dashboard,
  onEdit,
  onDuplicate,
  onDelete,
}: DashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dashboard.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DashboardCardContent
        dashboard={dashboard}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  )
}

// Original DashboardCard (for backwards compatibility)
export function DashboardCard({
  dashboard,
  onEdit,
  onDuplicate,
  onDelete,
}: DashboardCardProps) {
  return (
    <DashboardCardContent
      dashboard={dashboard}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    />
  )
}
