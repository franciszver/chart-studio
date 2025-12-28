'use client'

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
  isDraggable?: boolean
}

const getChartTypeIcon = (chartType: string) => {
  switch (chartType) {
    case 'bar':
      return <ChartBar size={16} className="text-gray-500" />
    case 'pie':
      return <ChartPie size={16} className="text-gray-500" />
    case 'line':
      return <ChartLineUp size={16} className="text-gray-500" />
    case 'table':
      return <Table size={16} className="text-gray-500" />
    default:
      return <ChartBar size={16} className="text-gray-500" />
  }
}

const getAllChartTypes = (dashboard: Dashboard) => {
  if (!dashboard.cards || dashboard.cards.length === 0) return []
  
  const chartTypes = dashboard.cards
    .map((card: any) => card.chartSpec?.type)
    .filter((type: string) => type) // Remove undefined/null
  
  return chartTypes // Keep all, including duplicates
}

export function DashboardCard({
  dashboard,
  onEdit,
  onDuplicate,
  onDelete,
  isDraggable = false,
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
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Link href={`/dashboards/${dashboard.id}`} className="block">
        <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full gap-0">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              {isDraggable && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-2 text-gray-400 hover:text-gray-600"
                  onClick={(e) => e.preventDefault()}
                >
                  <DotsSixVertical size={20} />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-1">{dashboard.name}</CardTitle>
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
          <p className="text-xs text-gray-600"><b>Category:</b> {dashboard.category}</p>
            {dashboard.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                <b>Description:</b> {dashboard.description}
              </p>
            )}
            <p className="text-xs text-gray-600"><b>Charts in this Dashboard: </b>
              {dashboard.cards && dashboard.cards.length > 0 
                ? dashboard.cards.map((card: any) => card.chartSpec?.options?.title || 'Untitled Chart').join(', ')
                : 'No charts yet'
              }
            </p>
          
            {/* <p className="text-xs text-gray-600">
              Modified {formatDate(dashboard.lastModified)}
            </p> */}
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
