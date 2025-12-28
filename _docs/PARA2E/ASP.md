# Agent Super Prompt (ASP)

**Purpose**: This is a comprehensive one-shot prompt for an AI agent to implement all 10 features for the Chart Studio application.

---

## SYSTEM CONTEXT

You are implementing features for Chart Studio, a Next.js dashboard and data visualization platform.

**Tech Stack**:
- Next.js 15.4.6 (App Router)
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4 (OKLCH colors)
- Apollo Client/Server (GraphQL)
- Recharts 3.1.2 (charts)
- CodeMirror 6 (SQL editor)
- dnd-kit 6.3.1 (drag-and-drop)
- AG Grid (data tables)
- Clerk (authentication)
- Motion (animations)

**Project Root**: The codebase follows Next.js App Router structure with `src/` directory.

---

## FEATURES TO IMPLEMENT

Implement these 10 features in the exact order specified:

### PHASE 1: Foundation

#### FEATURE F6: Loading Spinner with Fade-in

**Requirement**: Add a loading spinner on all pages with a 2-second minimum delay, then fade in content.

**CREATE** `src/components/ui/loading-spinner.tsx`:
```tsx
'use client'

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    </div>
  )
}
```

**CREATE** `src/components/providers/loading-provider.tsx`:
```tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface LoadingContextType {
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({ isLoading: true })

export function useLoading() {
  return useContext(LoadingContext)
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 2 second artificial delay per requirements
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="spinner"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </LoadingContext.Provider>
  )
}
```

**MODIFY** `src/app/layout.tsx`:
- Import LoadingProvider
- Wrap the main content with LoadingProvider inside the body

---

#### FEATURE F2: Futuristic Business Styling

**Requirement**: Apply a futuristic business aesthetic with dark tones and electric accents.

**MODIFY** `src/app/globals.css` - Replace the `:root` and `.dark` CSS variable sections:

```css
:root {
  --radius: 0.5rem;
  --primary: oklch(0.7 0.15 220);
  --primary-foreground: oklch(0.98 0 0);
  --background: oklch(0.14 0.02 260);
  --foreground: oklch(0.93 0.01 260);
  --card: oklch(0.18 0.02 260);
  --card-foreground: oklch(0.93 0.01 260);
  --popover: oklch(0.18 0.02 260);
  --popover-foreground: oklch(0.93 0.01 260);
  --secondary: oklch(0.25 0.03 260);
  --secondary-foreground: oklch(0.93 0.01 260);
  --muted: oklch(0.22 0.02 260);
  --muted-foreground: oklch(0.65 0.02 260);
  --accent: oklch(0.65 0.18 180);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.3 0.02 260);
  --input: oklch(0.25 0.02 260);
  --ring: oklch(0.7 0.15 220);
  --chart-1: oklch(0.7 0.15 220);
  --chart-2: oklch(0.65 0.18 180);
  --chart-3: oklch(0.7 0.15 280);
  --chart-4: oklch(0.65 0.15 320);
  --chart-5: oklch(0.75 0.12 80);
}

.dark {
  --primary: oklch(0.75 0.15 220);
  --primary-foreground: oklch(0.12 0.02 260);
  --background: oklch(0.12 0.02 260);
  --foreground: oklch(0.95 0.01 260);
  --card: oklch(0.16 0.02 260);
  --card-foreground: oklch(0.95 0.01 260);
  --popover: oklch(0.16 0.02 260);
  --popover-foreground: oklch(0.95 0.01 260);
  --secondary: oklch(0.22 0.03 260);
  --secondary-foreground: oklch(0.95 0.01 260);
  --muted: oklch(0.2 0.02 260);
  --muted-foreground: oklch(0.6 0.02 260);
  --accent: oklch(0.65 0.18 180);
  --accent-foreground: oklch(0.12 0.02 260);
  --destructive: oklch(0.5 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.28 0.02 260);
  --input: oklch(0.22 0.02 260);
  --ring: oklch(0.75 0.15 220);
}
```

The design uses:
- Deep navy/slate backgrounds (oklch 0.12-0.18 in 260 hue)
- Electric blue primary (oklch 0.7-0.75 in 220 hue)
- Cyan accents (oklch 0.65 in 180 hue)
- Subtle border definition
- Sharp 0.5rem radius

---

#### FEATURE F7: Security Fixes

**Requirement**: Add server-side SQL validation to block dangerous queries.

**MODIFY** `src/app/api/graphql/route.ts`:

Add this function near the top of the file (after imports):

```typescript
// Server-side SQL validation - SECURITY CRITICAL
function validateSqlServer(sql: string): { valid: boolean; error?: string } {
  // Remove comments for analysis
  const sqlWithoutComments = sql
    .split('\n')
    .map(line => line.replace(/--.*$/, ''))
    .join(' ')
    .trim()

  // Block dangerous keywords
  const dangerousKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE',
    'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC',
    'EXECUTE', 'CALL', 'MERGE', 'REPLACE'
  ]

  const dangerousPattern = new RegExp(
    `\\b(${dangerousKeywords.join('|')})\\b`, 'i'
  )

  if (dangerousPattern.test(sqlWithoutComments)) {
    console.warn(`[SECURITY] Blocked dangerous SQL attempt`)
    return {
      valid: false,
      error: 'Query contains prohibited operations. Only SELECT queries are allowed.'
    }
  }

  // Only allow SELECT and WITH (CTEs)
  const normalized = sqlWithoutComments.toLowerCase().trim()
  if (!normalized.startsWith('select') && !normalized.startsWith('with')) {
    console.warn(`[SECURITY] Blocked non-SELECT query`)
    return {
      valid: false,
      error: 'Only SELECT queries are allowed.'
    }
  }

  return { valid: true }
}
```

In the `executeSql` resolver, add validation at the start:

```typescript
executeSql: async (_, { sql }) => {
  // SERVER-SIDE VALIDATION
  const validation = validateSqlServer(sql)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // ... rest of existing code
}
```

---

### PHASE 2: Editor Features

#### FEATURE F3: SQL Line Wrapping

**Requirement**: Toggle line wrapping with Alt+Z (Option+Z on Mac).

**MODIFY** `src/components/explorer/sql-editor.tsx`:

Add state and effect for line wrap:

```typescript
const [lineWrap, setLineWrap] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sql-line-wrap') === 'true'
  }
  return false
})

useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sql-line-wrap', String(lineWrap))
  }
}, [lineWrap])
```

Add keymap for Alt+Z:

```typescript
import { keymap } from '@codemirror/view'
import { EditorView } from '@codemirror/view'

const toggleWrapKeymap = useMemo(() => keymap.of([{
  key: 'Alt-z',
  run: () => {
    setLineWrap(prev => !prev)
    return true
  }
}]), [])
```

Add to extensions array conditionally:

```typescript
const extensions = useMemo(() => {
  const exts = [
    // ... existing extensions
    toggleWrapKeymap,
  ]
  if (lineWrap) {
    exts.push(EditorView.lineWrapping)
  }
  return exts
}, [lineWrap, /* other deps */])
```

Add visual indicator button:

```tsx
<button
  onClick={() => setLineWrap(prev => !prev)}
  className={cn(
    "px-2 py-1 text-xs rounded",
    lineWrap ? "bg-primary text-primary-foreground" : "bg-muted"
  )}
  title="Toggle line wrap (Alt+Z)"
>
  {lineWrap ? 'Wrap: On' : 'Wrap: Off'}
</button>
```

---

#### FEATURE F4: Table Chart Sorting

**Requirement**: Make table charts sortable by clicking column headers.

**MODIFY** `src/components/charts/renderer.tsx`:

In the table rendering section, add sort state and logic:

```typescript
const [sortConfig, setSortConfig] = useState<{
  key: string
  direction: 'asc' | 'desc'
} | null>(null)

const sortedData = useMemo(() => {
  if (!sortConfig || spec.type !== 'table') return chartData

  return [...chartData].sort((a, b) => {
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]

    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    let comparison = 0
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal))
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison
  })
}, [chartData, sortConfig, spec.type])

const handleSort = (key: string) => {
  setSortConfig(prev => {
    if (prev?.key !== key) return { key, direction: 'asc' }
    if (prev.direction === 'asc') return { key, direction: 'desc' }
    return null
  })
}
```

Update table header rendering:

```tsx
<th
  key={key}
  onClick={() => handleSort(key)}
  className="p-2 text-left font-medium cursor-pointer hover:bg-muted/50 select-none"
>
  <div className="flex items-center gap-1">
    {key}
    {sortConfig?.key === key && (
      <span className="text-primary">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    )}
  </div>
</th>
```

Use `sortedData` instead of `chartData` in the table body.

---

### PHASE 3: Chart Features

#### FEATURE F9: Scatter Plot Chart

**Requirement**: Add scatter plot as a new chart type.

**MODIFY** `src/types/chart-spec.ts`:

```typescript
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'scatter'

export interface Encodings {
  // ... existing fields
  xValue?: MeasureRef    // For scatter X axis (numeric)
  yValue?: MeasureRef    // For scatter Y axis (numeric)
  size?: MeasureRef      // For bubble size (optional)
}
```

**MODIFY** `src/components/charts/renderer.tsx`:

Add scatter plot rendering:

```tsx
import { ScatterChart, Scatter, ZAxis } from 'recharts'

// In the render logic, add before the final return:
if (spec.type === 'scatter') {
  const xKey = spec.encodings.xValue?.field || Object.keys(chartData[0] || {})[0]
  const yKey = spec.encodings.yValue?.field || Object.keys(chartData[0] || {})[1]
  const sizeKey = spec.encodings.size?.field

  return (
    <div className="w-full h-full flex flex-col">
      {(spec.options?.title || spec.options?.subtitle) && (
        <div className="mb-2">
          {spec.options?.title && <h3 className="text-lg font-semibold">{spec.options.title}</h3>}
          {spec.options?.subtitle && <p className="text-sm text-muted-foreground">{spec.options.subtitle}</p>}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey={xKey}
              name={xKey}
              stroke="var(--foreground)"
              tick={{ fill: 'var(--foreground)' }}
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name={yKey}
              stroke="var(--foreground)"
              tick={{ fill: 'var(--foreground)' }}
            />
            {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[60, 400]} />}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}
            />
            <Scatter data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

**MODIFY** `src/components/charts/data-transform.ts`:

Add scatter handling in transformRowsForRecharts:

```typescript
if (spec.type === 'scatter') {
  // Scatter plots use raw data, no transformation needed
  return {
    chartData: rows,
    seriesKeys: [],
    xKey: spec.encodings.xValue?.field,
    valueKey: spec.encodings.yValue?.field,
  }
}
```

**MODIFY** `src/app/dashboards/[dashboardId]/cards/[cardId]/edit/page.tsx`:

Add scatter to CHART_TYPES:

```typescript
const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'table', label: 'Table' },
  { value: 'scatter', label: 'Scatter Plot' },
] as const
```

---

#### FEATURE F5: Table Column Reordering

**Requirement**: Drag-and-drop column reordering with database persistence.

**MODIFY** `src/types/chart-spec.ts`:

```typescript
export interface ChartOptions {
  // ... existing fields
  columnOrder?: string[]
}
```

**MODIFY** `src/components/charts/renderer.tsx`:

Add dnd-kit imports and column reordering to table:

```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// In table section:
const [columnOrder, setColumnOrder] = useState<string[]>(() => {
  const keys = Object.keys(chartData[0] || {})
  return spec.options?.columnOrder || keys
})

const orderedColumns = useMemo(() => {
  const allKeys = Object.keys(chartData[0] || {})
  // Maintain order but include any new columns
  const ordered = columnOrder.filter(k => allKeys.includes(k))
  allKeys.forEach(k => {
    if (!ordered.includes(k)) ordered.push(k)
  })
  return ordered
}, [chartData, columnOrder])

function SortableHeader({ column }: { column: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => handleSort(column)}
      className="p-2 text-left font-medium cursor-grab hover:bg-muted/50"
    >
      {/* header content with sort indicator */}
    </th>
  )
}

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  if (over && active.id !== over.id) {
    const oldIndex = orderedColumns.indexOf(String(active.id))
    const newIndex = orderedColumns.indexOf(String(over.id))
    const newOrder = arrayMove(orderedColumns, oldIndex, newIndex)
    setColumnOrder(newOrder)
    // Debounce save to spec.options.columnOrder via upsertCard
  }
}

// Wrap table headers:
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={orderedColumns} strategy={horizontalListSortingStrategy}>
    <tr>
      {orderedColumns.map(col => <SortableHeader key={col} column={col} />)}
    </tr>
  </SortableContext>
</DndContext>
```

---

### PHASE 4: Dashboard Features

#### FEATURE F1: Dashboard Reordering

**Requirement**: Drag-and-drop dashboard reordering with localStorage persistence.

**CREATE** `src/components/dashboard/sortable-dashboard-card.tsx`:

```tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ReactNode } from 'react'

interface SortableDashboardCardProps {
  id: string
  children: ReactNode
}

export function SortableDashboardCard({ id, children }: SortableDashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
```

**MODIFY** `src/app/dashboards/page.tsx`:

Add DndContext and reordering:

```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { SortableDashboardCard } from '@/components/dashboard/sortable-dashboard-card'

const [dashboardOrder, setDashboardOrder] = useState<string[]>([])

useEffect(() => {
  const saved = localStorage.getItem('dashboard-order')
  if (saved) {
    setDashboardOrder(JSON.parse(saved))
  }
}, [])

useEffect(() => {
  if (dashboardOrder.length > 0) {
    localStorage.setItem('dashboard-order', JSON.stringify(dashboardOrder))
  }
}, [dashboardOrder])

const orderedDashboards = useMemo(() => {
  if (!dashboards) return []
  const ordered: typeof dashboards = []
  dashboardOrder.forEach(id => {
    const d = dashboards.find(dash => dash.id === id)
    if (d) ordered.push(d)
  })
  dashboards.forEach(d => {
    if (!ordered.find(od => od.id === d.id)) ordered.push(d)
  })
  return ordered
}, [dashboards, dashboardOrder])

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  if (over && active.id !== over.id) {
    const ids = orderedDashboards.map(d => d.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    setDashboardOrder(arrayMove(ids, oldIndex, newIndex))
  }
}

// In render:
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={orderedDashboards.map(d => d.id)} strategy={rectSortingStrategy}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orderedDashboards.map(dashboard => (
        <SortableDashboardCard key={dashboard.id} id={dashboard.id}>
          {/* existing dashboard card content */}
        </SortableDashboardCard>
      ))}
    </div>
  </SortableContext>
</DndContext>
```

---

#### FEATURE F10: Dashboard Folders

**Requirement**: Organize dashboards into collapsible folders.

**CREATE** `src/components/dashboard/dashboard-folder.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight, Folder, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardFolderProps {
  id: string
  name: string
  isExpanded: boolean
  onToggle: () => void
  onRename: (name: string) => void
  onDelete: () => void
  children: React.ReactNode
}

export function DashboardFolder({
  id,
  name,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  children,
}: DashboardFolderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="border border-border rounded-lg bg-card/50 mb-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50">
            <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            <Folder className="h-4 w-4 text-primary" />
            {isEditing ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="bg-transparent border-b border-primary outline-none"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="font-medium">{name}</span>
            )}
            <div className="ml-auto flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} className="p-1 hover:bg-muted rounded">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 hover:bg-destructive/20 rounded">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
```

**MODIFY** `src/app/dashboards/page.tsx`:

Add folder state and UI (integrates with F1 reordering):

```typescript
interface FolderData {
  id: string
  name: string
  dashboardIds: string[]
  isExpanded: boolean
}

const [folders, setFolders] = useState<FolderData[]>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dashboard-folders')
    return saved ? JSON.parse(saved) : []
  }
  return []
})

useEffect(() => {
  localStorage.setItem('dashboard-folders', JSON.stringify(folders))
}, [folders])

const createFolder = () => {
  const newFolder: FolderData = {
    id: `folder-${Date.now()}`,
    name: 'New Folder',
    dashboardIds: [],
    isExpanded: true,
  }
  setFolders(prev => [...prev, newFolder])
}

// Render folders with nested dashboards, plus root-level dashboards
```

---

### PHASE 5: AI Integration

#### FEATURE F8: AI SQL Agent

**Requirement**: Natural language to SQL using OpenAI with fallback.

**CREATE** `src/app/api/ai/generate-sql/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const FALLBACK_PATTERNS: Record<string, string> = {
  'customer': 'SELECT * FROM customers LIMIT 100',
  'revenue': 'SELECT * FROM revenue_summary LIMIT 100',
  'deal': 'SELECT * FROM deals LIMIT 100',
  'account': 'SELECT * FROM accounts LIMIT 100',
  'contact': 'SELECT * FROM contacts LIMIT 100',
  'activity': 'SELECT * FROM sales_activities LIMIT 100',
}

function generateFallbackSql(query: string): string {
  const lowerQuery = query.toLowerCase()
  for (const [keyword, sql] of Object.entries(FALLBACK_PATTERNS)) {
    if (lowerQuery.includes(keyword)) {
      return sql
    }
  }
  return 'SELECT * FROM customers LIMIT 10'
}

export async function POST(request: NextRequest) {
  const { query, schema } = await request.json()

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    // Fallback mode
    const fallbackSql = generateFallbackSql(query)
    return NextResponse.json({
      sql: fallbackSql,
      source: 'fallback',
      message: "AI Fallback: OpenAI key not configured. Using basic pattern matching."
    })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a SQL expert. Generate valid SELECT queries based on this schema: ${JSON.stringify(schema)}. Return ONLY the SQL query, no explanations.`
          },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const sql = data.choices[0]?.message?.content?.trim()

    return NextResponse.json({ sql, source: 'openai' })
  } catch (error) {
    console.error('[AI] OpenAI error:', error)
    const fallbackSql = generateFallbackSql(query)
    return NextResponse.json({
      sql: fallbackSql,
      source: 'fallback',
      message: "AI Fallback: OpenAI request failed. Using basic pattern matching."
    })
  }
}
```

**CREATE** `src/components/explorer/ai-query-input.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AiQueryInputProps {
  schema: unknown
  onSqlGenerated: (sql: string) => void
}

export function AiQueryInput({ schema, onSqlGenerated }: AiQueryInputProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, schema }),
      })

      const data = await response.json()

      if (data.message) {
        toast.warning(data.message)
      } else {
        toast.success('SQL generated successfully')
      }

      onSqlGenerated(data.sql)
    } catch (error) {
      toast.error('Failed to generate SQL')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2 p-3 border-b border-border bg-muted/30">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask in plain English, e.g., 'Show me total revenue by month'"
        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        className="flex-1"
      />
      <Button onClick={handleGenerate} disabled={isLoading || !query.trim()}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        <span className="ml-2">Generate SQL</span>
      </Button>
    </div>
  )
}
```

**MODIFY** `src/app/explorer/page.tsx`:

Import and add AiQueryInput above the SQL editor:

```tsx
import { AiQueryInput } from '@/components/explorer/ai-query-input'

// In render, above SqlEditor:
<AiQueryInput
  schema={schemaData?.getSchemaMetadata}
  onSqlGenerated={(sql) => setSqlQuery(sql)}
/>
```

---

## VERIFICATION STEPS

After implementation, verify each feature works:

1. **F6**: Page shows spinner for 2s, then content fades in
2. **F2**: Dark navy theme with electric blue accents visible
3. **F7**: Try `DELETE FROM users` in explorer - should be blocked
4. **F3**: Press Alt+Z in SQL editor - lines should wrap/unwrap
5. **F4**: Click table column headers - data should sort
6. **F9**: Create a scatter chart in chart editor
7. **F5**: Drag table columns to reorder
8. **F1**: Drag dashboard cards to reorder, refresh to verify persistence
9. **F10**: Create folders, drag dashboards into them
10. **F8**: Type "show customers" in AI input, verify SQL generated

---

## ENVIRONMENT REQUIREMENTS

Ensure `.env.local` contains:

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Optional (for AI feature)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

---

## DEPENDENCIES TO INSTALL

```bash
npm install openai
```

All other dependencies are already in package.json.

---

*End of Agent Super Prompt*
