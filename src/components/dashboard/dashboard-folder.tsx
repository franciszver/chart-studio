'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CaretDown, CaretRight, Folder, FolderOpen, PencilSimple, Trash, Check, X } from 'phosphor-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { SortableDashboardCard } from './dashboard-card'
import { cn } from '@/lib/utils'

interface Dashboard {
  id: string
  name: string
  description?: string
  category: string
  lastModified: string
  createdAt: string
  cards?: Array<{ id: string; chartSpec: Record<string, unknown> }>
}

interface DashboardFolderProps {
  id: string
  name: string
  dashboards: Dashboard[]
  isExpanded: boolean
  onToggleExpanded: () => void
  onRename: (newName: string) => void
  onDelete: () => void
  onEditDashboard: (dashboard: Dashboard) => void
  onDuplicateDashboard: (dashboard: Dashboard) => void
  onDeleteDashboard: (dashboard: Dashboard) => void
}

export function DashboardFolder({
  id,
  name,
  dashboards,
  isExpanded,
  onToggleExpanded,
  onRename,
  onDelete,
  onEditDashboard,
  onDuplicateDashboard,
  onDeleteDashboard,
}: DashboardFolderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)

  // Make the folder a drop target
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
  })

  const handleSaveRename = () => {
    if (editName.trim()) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancelRename = () => {
    setEditName(name)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border transition-colors bg-card",
        isOver ? "border-primary bg-primary/10" : "border-border"
      )}
    >
      {/* Folder Header */}
      <div className="group flex items-center gap-2 p-3 bg-secondary/50 rounded-t-lg border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggleExpanded}
        >
          {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
        </Button>

        {isExpanded ? (
          <FolderOpen size={20} className="text-primary" />
        ) : (
          <Folder size={20} className="text-muted-foreground" />
        )}

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm"
              autoFocus
            />
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSaveRename}>
              <Check size={14} className="text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelRename}>
              <X size={14} className="text-red-600" />
            </Button>
          </div>
        ) : (
          <>
            <span className="font-medium flex-1">{name}</span>
            <span className="text-xs text-muted-foreground">
              {dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
              onClick={() => setIsEditing(true)}
            >
              <PencilSimple size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-red-600"
              onClick={onDelete}
            >
              <Trash size={14} />
            </Button>
          </>
        )}
      </div>

      {/* Folder Content */}
      {isExpanded && (
        <div className="p-4">
          {dashboards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Drag dashboards here to add them to this folder
            </div>
          ) : (
            <SortableContext
              items={dashboards.map((d) => d.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.map((dashboard) => (
                  <SortableDashboardCard
                    key={dashboard.id}
                    dashboard={dashboard}
                    onEdit={onEditDashboard}
                    onDuplicate={onDuplicateDashboard}
                    onDelete={onDeleteDashboard}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  )
}
