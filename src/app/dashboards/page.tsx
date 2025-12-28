'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import AppLayout from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Plus, Funnel } from 'phosphor-react'
import { CreateDashboardDialog } from '@/components/dashboard/create-dashboard-form'
import { DashboardCard } from '@/components/dashboard/dashboard-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { gql } from '@apollo/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'

const GET_DASHBOARDS = gql`
  query GetDashboards {
    dashboards {
      id
      name
      description
      category
      lastModified
      createdAt
      order
      cards {
        id
        chartSpec
      }
    }
  }
`

const UPDATE_DASHBOARDS_ORDER = gql`
  mutation UpdateDashboardsOrder($order: [DashboardOrderInput!]!) {
    updateDashboardsOrder(order: $order) {
      id
      order
    }
  }
`

const CREATE_DASHBOARD = gql`
  mutation CreateDashboard($input: CreateDashboardInput!) {
    createDashboard(input: $input) {
      id
      name
      description
      category
      lastModified
      createdAt
    }
  }
`

const DUPLICATE_DASHBOARD = gql`
  mutation DuplicateDashboard($id: ID!) {
    duplicateDashboard(id: $id) {
      id
      name
      description
      category
      lastModified
      createdAt
    }
  }
`

const DELETE_DASHBOARD = gql`
  mutation DeleteDashboard($id: ID!) {
    deleteDashboard(id: $id)
  }
`

const categories = [
  'All Categories',
  'Sales & Performance',
  'Financial',
  'Operations',
  'Administrative',
  'Custom',
]

export default function DashboardsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [localDashboards, setLocalDashboards] = useState<any[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data, loading, refetch } = useQuery(GET_DASHBOARDS, {
    onCompleted: (data) => {
      setLocalDashboards(data?.dashboards || [])
    },
  })
  const [createDashboard, { loading: createLoading }] = useMutation(CREATE_DASHBOARD, {
    onCompleted: () => {
      refetch()
      setCreateDialogOpen(false)
    },
  })
  const [duplicateDashboard] = useMutation(DUPLICATE_DASHBOARD, {
    onCompleted: () => refetch(),
  })
  const [deleteDashboard] = useMutation(DELETE_DASHBOARD, {
    onCompleted: () => refetch(),
  })
  const [updateDashboardsOrder] = useMutation(UPDATE_DASHBOARDS_ORDER)

  const dashboards = localDashboards.length > 0 ? localDashboards : (data?.dashboards || [])
  const filteredDashboards = selectedCategory === 'All Categories'
    ? dashboards
    : dashboards.filter((dashboard: any) => dashboard.category === selectedCategory)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = dashboards.findIndex((d: any) => d.id === active.id)
      const newIndex = dashboards.findIndex((d: any) => d.id === over.id)

      const reorderedDashboards = arrayMove(dashboards, oldIndex, newIndex)
      setLocalDashboards(reorderedDashboards)

      // Persist the new order
      const orderUpdates = reorderedDashboards.map((dashboard: any, index: number) => ({
        id: dashboard.id,
        order: index,
      }))

      updateDashboardsOrder({
        variables: { order: orderUpdates },
      })
    }
  }

  const handleCreateDashboard = (formData: any) => {
    createDashboard({
      variables: {
        input: formData,
      },
    })
  }

  const handleDuplicate = (dashboard: any) => {
    duplicateDashboard({
      variables: { id: dashboard.id },
    })
  }

  const handleDelete = (dashboard: any) => {
    if (confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
      deleteDashboard({
        variables: { id: dashboard.id },
      })
    }
  }

  const handleEdit = (dashboard: any) => {
    window.location.href = `/dashboards/${dashboard.id}/edit`
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
            <p className="mt-2 text-gray-600">
              Create and manage your reporting dashboards
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            Create Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-gray-500" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500">
            {filteredDashboards.length} dashboard{filteredDashboards.length !== 1 ? 's' : ''}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredDashboards.map((d: any) => d.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDashboards.map((dashboard: any) => (
                <DashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  isDraggable={selectedCategory === 'All Categories'}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredDashboards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No dashboards found
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory === 'All Categories' 
                ? 'Get started by creating your first dashboard.'
                : `No dashboards found in "${selectedCategory}" category.`}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Your First Dashboard
            </Button>
          </div>
        )}

        <CreateDashboardDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateDashboard}
          isLoading={createLoading}
        />
      </div>
    </AppLayout>
  )
}
