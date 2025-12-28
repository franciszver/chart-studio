'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import AppLayout from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Plus, Funnel, FolderPlus } from 'phosphor-react'
import { CreateDashboardDialog } from '@/components/dashboard/create-dashboard-form'
import { SortableDashboardCard } from '@/components/dashboard/dashboard-card'
import { DashboardFolder } from '@/components/dashboard/dashboard-folder'
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

const DASHBOARD_ORDER_KEY = 'dashboard-order'
const DASHBOARD_FOLDERS_KEY = 'dashboard-folders'

interface FolderData {
  id: string
  name: string
  dashboardIds: string[]
  isExpanded: boolean
}

interface FolderState {
  folders: FolderData[]
  rootDashboardIds: string[]
}

const GET_DASHBOARDS = gql`
  query GetDashboards {
    dashboards {
      id
      name
      description
      category
      lastModified
      createdAt
      cards {
        id
        chartSpec
      }
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

interface Dashboard {
  id: string
  name: string
  description?: string
  category: string
  lastModified: string
  createdAt: string
  cards?: Array<{ id: string; chartSpec: Record<string, unknown> }>
}

const DEFAULT_FOLDER_STATE: FolderState = {
  folders: [],
  rootDashboardIds: [],
}

export default function DashboardsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([])
  const [folderState, setFolderState] = useState<FolderState>(DEFAULT_FOLDER_STATE)

  // Load saved order and folders from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedOrder = localStorage.getItem(DASHBOARD_ORDER_KEY)
        if (savedOrder) {
          setDashboardOrder(JSON.parse(savedOrder))
        }

        const savedFolders = localStorage.getItem(DASHBOARD_FOLDERS_KEY)
        if (savedFolders) {
          setFolderState(JSON.parse(savedFolders))
        }
      } catch {
        console.warn('Failed to load dashboard data from localStorage')
      }
    }
  }, [])

  // Save folder state to localStorage
  const saveFolderState = useCallback((newState: FolderState) => {
    setFolderState(newState)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(DASHBOARD_FOLDERS_KEY, JSON.stringify(newState))
      } catch {
        console.warn('Failed to save folder state to localStorage')
      }
    }
  }, [])

  const { data, loading, refetch } = useQuery(GET_DASHBOARDS)
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

  const dashboards: Dashboard[] = data?.dashboards || []

  // Sort dashboards based on saved order
  const orderedDashboards = useMemo(() => {
    if (dashboardOrder.length === 0) return dashboards

    const orderMap = new Map(dashboardOrder.map((id, index) => [id, index]))
    const sorted = [...dashboards].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
      const bIndex = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
      return aIndex - bIndex
    })
    return sorted
  }, [dashboards, dashboardOrder])

  const filteredDashboards = selectedCategory === 'All Categories'
    ? orderedDashboards
    : orderedDashboards.filter((dashboard) => dashboard.category === selectedCategory)

  // dnd-kit sensors
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

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropped on a folder
    if (overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '')
      // Move dashboard to folder
      const newFolderState = { ...folderState }

      // Remove from any existing folder
      newFolderState.folders = newFolderState.folders.map(f => ({
        ...f,
        dashboardIds: f.dashboardIds.filter(id => id !== activeId)
      }))

      // Remove from root if present
      newFolderState.rootDashboardIds = newFolderState.rootDashboardIds.filter(id => id !== activeId)

      // Add to target folder
      const targetFolder = newFolderState.folders.find(f => f.id === folderId)
      if (targetFolder && !targetFolder.dashboardIds.includes(activeId)) {
        targetFolder.dashboardIds.push(activeId)
      }

      saveFolderState(newFolderState)
      return
    }

    // Regular reordering within the same context
    if (active.id !== over.id) {
      const oldIndex = orderedDashboards.findIndex((d) => d.id === active.id)
      const newIndex = orderedDashboards.findIndex((d) => d.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedDashboards.map((d) => d.id), oldIndex, newIndex)
        setDashboardOrder(newOrder)

        // Persist to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(DASHBOARD_ORDER_KEY, JSON.stringify(newOrder))
          } catch {
            console.warn('Failed to save dashboard order to localStorage')
          }
        }
      }
    }
  }, [orderedDashboards, folderState, saveFolderState])

  // Create a new folder
  const handleCreateFolder = useCallback(() => {
    const newFolder: FolderData = {
      id: `folder-${Date.now()}`,
      name: 'New Folder',
      dashboardIds: [],
      isExpanded: true,
    }
    saveFolderState({
      ...folderState,
      folders: [...folderState.folders, newFolder],
    })
  }, [folderState, saveFolderState])

  // Toggle folder expansion
  const handleToggleFolderExpanded = useCallback((folderId: string) => {
    saveFolderState({
      ...folderState,
      folders: folderState.folders.map(f =>
        f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f
      ),
    })
  }, [folderState, saveFolderState])

  // Rename folder
  const handleRenameFolder = useCallback((folderId: string, newName: string) => {
    saveFolderState({
      ...folderState,
      folders: folderState.folders.map(f =>
        f.id === folderId ? { ...f, name: newName } : f
      ),
    })
  }, [folderState, saveFolderState])

  // Delete folder (moves dashboards back to root)
  const handleDeleteFolder = useCallback((folderId: string) => {
    const folder = folderState.folders.find(f => f.id === folderId)
    if (!folder) return

    saveFolderState({
      folders: folderState.folders.filter(f => f.id !== folderId),
      rootDashboardIds: [...folderState.rootDashboardIds, ...folder.dashboardIds],
    })
  }, [folderState, saveFolderState])

  // Get dashboards that are in folders
  const dashboardsInFolders = useMemo(() => {
    const ids = new Set<string>()
    folderState.folders.forEach(f => f.dashboardIds.forEach(id => ids.add(id)))
    return ids
  }, [folderState])

  // Get root dashboards (not in any folder)
  const rootDashboards = useMemo(() => {
    return filteredDashboards.filter(d => !dashboardsInFolders.has(d.id))
  }, [filteredDashboards, dashboardsInFolders])

  const handleCreateDashboard = (formData: { name: string; description?: string; category: string }) => {
    createDashboard({
      variables: {
        input: formData,
      },
    })
  }

  const handleDuplicate = (dashboard: Dashboard) => {
    duplicateDashboard({
      variables: { id: dashboard.id },
    })
  }

  const handleDelete = (dashboard: Dashboard) => {
    if (confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
      deleteDashboard({
        variables: { id: dashboard.id },
      })
    }
  }

  const handleEdit = (dashboard: Dashboard) => {
    window.location.href = `/dashboards/${dashboard.id}/edit`
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-48"></div>
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
            <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
            <p className="mt-2 text-muted-foreground">
              Create and manage your reporting dashboards
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCreateFolder}>
              <FolderPlus size={16} className="mr-2" />
              New Folder
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Dashboard
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-muted-foreground" />
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
          <div className="text-sm text-muted-foreground">
            {filteredDashboards.length} dashboard{filteredDashboards.length !== 1 ? 's' : ''}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Folders */}
          {folderState.folders.length > 0 && (
            <div className="space-y-4 mb-6">
              {folderState.folders.map((folder) => {
                const folderDashboards = folder.dashboardIds
                  .map((id) => filteredDashboards.find((d) => d.id === id))
                  .filter((d): d is Dashboard => d !== undefined)

                return (
                  <DashboardFolder
                    key={folder.id}
                    id={folder.id}
                    name={folder.name}
                    dashboards={folderDashboards}
                    isExpanded={folder.isExpanded}
                    onToggleExpanded={() => handleToggleFolderExpanded(folder.id)}
                    onRename={(newName) => handleRenameFolder(folder.id, newName)}
                    onDelete={() => handleDeleteFolder(folder.id)}
                    onEditDashboard={handleEdit}
                    onDuplicateDashboard={handleDuplicate}
                    onDeleteDashboard={handleDelete}
                  />
                )
              })}
            </div>
          )}

          {/* Root dashboards (not in folders) */}
          <SortableContext
            items={rootDashboards.map((d) => d.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rootDashboards.map((dashboard) => (
                <SortableDashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredDashboards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground/50 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No dashboards found
            </h3>
            <p className="text-muted-foreground mb-4">
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
