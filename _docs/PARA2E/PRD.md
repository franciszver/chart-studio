# Product Requirements Document: Chart Studio Enhancements

**Version**: 1.0
**Date**: December 28, 2025
**Project**: Leap Dashboard Studio (chart-studio)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technical Context](#technical-context)
3. [Feature Requirements](#feature-requirements)
   - [F1: Dashboard Reordering with Persistence](#f1-dashboard-reordering-with-persistence)
   - [F2: Frontend Styling Enhancements](#f2-frontend-styling-enhancements)
   - [F3: SQL Query Viewer Line Wrapping](#f3-sql-query-viewer-line-wrapping)
   - [F4: Table Chart Sorting](#f4-table-chart-sorting)
   - [F5: Table Column Reordering with Persistence](#f5-table-column-reordering-with-persistence)
   - [F6: Page Load Spinner with Fade-in](#f6-page-load-spinner-with-fade-in)
   - [F7: Security Audit and Fix](#f7-security-audit-and-fix)
   - [F8: AI Agent for Natural Language SQL](#f8-ai-agent-for-natural-language-sql)
   - [F9: Scatter Plot Chart Type](#f9-scatter-plot-chart-type)
   - [F10: Dashboard Folders with Drag-and-Drop](#f10-dashboard-folders-with-drag-and-drop)
4. [Codebase Architecture Reference](#codebase-architecture-reference)

---

## Executive Summary

This PRD outlines 10 feature enhancements for the Chart Studio application. The features range from UX improvements (loading spinners, styling) to significant functionality additions (AI-powered SQL agent, dashboard folders, new chart types).

---

## Technical Context

### Tech Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 15.4.6 (App Router) |
| UI Library | React 19.1.0 |
| Styling | Tailwind CSS 4 + Radix UI |
| State Management | Apollo Client 3.13.9 |
| API Layer | Apollo Server 5.0.0 (GraphQL) |
| Charts | Recharts 3.1.2 |
| Data Grid | AG Grid Community 34.1.1 |
| SQL Editor | CodeMirror 6 (@uiw/react-codemirror) |
| Drag & Drop | dnd-kit 6.3.1 + react-grid-layout 1.5.2 |
| Authentication | Clerk 6.29.0 |
| Animation | Motion 12.23.12 |

### Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Dashboards List Page | `src/app/dashboards/page.tsx` |
| Dashboard View | `src/app/dashboards/[dashboardId]/page.tsx` |
| Data Explorer Page | `src/app/explorer/page.tsx` |
| SQL Editor | `src/components/explorer/sql-editor.tsx` |
| Results Table | `src/components/explorer/results-table.tsx` |
| Chart Renderer | `src/components/charts/renderer.tsx` |
| Chart Types | `src/types/chart-spec.ts` |
| GraphQL API | `src/app/api/graphql/route.ts` |
| Global Styles | `src/app/globals.css` |
| UI Components | `src/components/ui/` |

### Current Data Model

**Dashboard Object**:
```typescript
{
  id: string
  name: string
  description: string
  category: string  // 'Sales & Performance' | 'Financial' | 'Operations' | 'Administrative' | 'Custom'
  lastModified: ISO8601
  createdAt: ISO8601
  layout: LayoutItem[]  // react-grid-layout format
  cards: Card[]
}
```

**Chart Types Currently Supported**:
- `bar` - Bar charts with Recharts
- `line` - Line charts with Recharts
- `pie` - Pie charts with Recharts
- `table` - HTML tables (basic implementation)

---

## Feature Requirements

---

### F1: Dashboard Reordering with Persistence

**Request**: Make it possible to reorder the reporting dashboards at /dashboards and persist that ordering on page refresh.

#### Current State

- **Location**: [page.tsx](src/app/dashboards/page.tsx)
- Dashboards are displayed in a grid layout (3 columns desktop, responsive)
- Fetched via `GET_DASHBOARDS` GraphQL query
- Category filtering exists via dropdown
- **No reordering functionality** - dashboards render in server-returned order

#### Technical Implementation Path

**Option A: User-specific ordering (localStorage)**
- Store order as array of dashboard IDs in localStorage
- Apply ordering client-side after fetch
- Simpler but not synced across devices

**Option B: Server-persisted ordering**
- Add `order: Int` field to Dashboard schema
- Add GraphQL mutation `updateDashboardOrder(ids: [ID!]!)`
- Store in database (currently mock in-memory)
- Syncs across sessions/devices

**Drag-and-Drop Library**: Use existing `@dnd-kit/core` (already installed v6.3.1)

**Components Needed**:
- `<DndContext>` wrapper around dashboard grid
- `<SortableContext>` with dashboard items
- `useSortable` hook on each dashboard card
- `DragOverlay` for visual feedback

**GraphQL Schema Addition** (if server-persisted):
```graphql
type Mutation {
  updateDashboardOrder(ids: [ID!]!): [Dashboard!]!
}
```

#### Acceptance Criteria
- [ ] User can drag dashboards to reorder them on `/dashboards` page
- [ ] Order persists on page refresh
- [ ] Visual drag feedback (ghost/overlay of dragged item)
- [ ] Works with category filtering (filtered view maintains relative order)

---

### F2: Frontend Styling Enhancements

**Request**: Put your own spin on the frontend styling and show us your sense of aesthetics and taste.

#### Current State

- **Styling System**: Tailwind CSS 4 with OKLCH color space
- **Theme Variables**: Defined in [globals.css](src/app/globals.css)
- **Component Library**: Radix UI primitives + custom shadcn/ui-style components
- **Primary Color**: `#26d07c` (green)
- **Dark Mode**: Supported via `.dark` class
- **Animation**: Motion library for entrance animations

#### Current Theme Variables
```css
:root {
  --primary: #26d07c;
  --background: rgb(248, 250, 252);
  --radius: 0.625rem;
  /* ... additional OKLCH variables */
}
```

#### Areas for Enhancement

1. **Color Palette**: Adjust primary/accent colors for personality
2. **Typography**: Font sizing, weights, line heights
3. **Spacing**: Padding/margins on cards, headers, nav
4. **Shadows & Depth**: Card shadows, elevation system
5. **Borders & Radius**: Corner rounding, border weights
6. **Animation**: Micro-interactions, hover states, transitions
7. **Dark Mode**: Refine dark theme contrast and vibrancy

#### Key Files to Modify
- `src/app/globals.css` - Theme variables
- `src/components/ui/button.tsx` - Button variants
- `src/components/ui/card.tsx` - Card styling
- `src/components/dashboard/dashboard-card.tsx` - Dashboard preview cards
- `src/components/layout/` - Navigation and layout components

#### Acceptance Criteria
- [ ] Cohesive visual identity applied
- [ ] Maintains accessibility (contrast ratios)
- [ ] Works in both light and dark modes
- [ ] Consistent styling across all pages

---

### F3: SQL Query Viewer Line Wrapping

**Request**: Implement line-wrapping in the SQL query viewer that can be turned on and off by pressing Option+Z or Alt+Z.

#### Current State

- **Component**: [sql-editor.tsx](src/components/explorer/sql-editor.tsx)
- **Library**: CodeMirror 6 via `@uiw/react-codemirror`
- **Current Behavior**: Horizontal scrolling for long lines (no wrapping)
- **Existing Features**: Line numbers, code folding, bracket matching, autocomplete

#### Technical Implementation

**CodeMirror Extension for Line Wrapping**:
```typescript
import { EditorView } from '@codemirror/view'

// Toggle between these:
EditorView.lineWrapping  // Wrapping enabled
// Default (no extension) = no wrapping
```

**Keyboard Shortcut Implementation**:
```typescript
import { keymap } from '@codemirror/view'

const toggleWrapKeymap = keymap.of([{
  key: 'Alt-z',  // Works for both Alt+Z and Option+Z
  run: (view) => {
    // Toggle wrapping state
    return true
  }
}])
```

**State Management**:
- Use React state: `const [lineWrap, setLineWrap] = useState(false)`
- Conditionally include `EditorView.lineWrapping` in extensions array
- Optionally persist preference to localStorage

**Visual Indicator**:
- Add toggle button or status indicator showing current wrap state
- Consider tooltip: "Toggle line wrap (Alt+Z)"

#### Acceptance Criteria
- [ ] Alt+Z / Option+Z toggles line wrapping on/off
- [ ] Long SQL lines wrap when enabled
- [ ] Long SQL lines scroll horizontally when disabled
- [ ] Visual indicator shows current state
- [ ] Preference persists across sessions (optional)

---

### F4: Table Chart Sorting

**Request**: Make the table charts sortable in asc/desc order.

#### Current State

**Dashboard Tables** ([renderer.tsx](src/components/charts/renderer.tsx)):
- Simple HTML `<table>` element
- **No sorting functionality**
- Headers rendered from `Object.keys(chartData[0])`
- Rows rendered with `.map()`

**SQL Results Table** ([results-table.tsx](src/components/explorer/results-table.tsx)):
- Uses AG Grid
- **Sorting already enabled** (`sortable: true` in column defs)
- Click column header to sort

#### Technical Implementation

**Option A: Enhance HTML table with custom sorting**
```typescript
const [sortConfig, setSortConfig] = useState<{
  key: string
  direction: 'asc' | 'desc'
} | null>(null)

const sortedData = useMemo(() => {
  if (!sortConfig) return chartData
  return [...chartData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === 'asc' ? -1 : 1
    // ...
  })
}, [chartData, sortConfig])
```

**Option B: Replace with AG Grid (consistent with Results Table)**
- Already installed: `ag-grid-react@^34.1.1`
- Provides sorting, filtering, resizing out of box
- Consistent UX across application

**Visual Indicators**:
- Sort arrows in headers (▲ asc, ▼ desc)
- Click header to cycle: none → asc → desc → none
- Highlight sorted column

#### Acceptance Criteria
- [ ] Clicking table column header sorts by that column
- [ ] First click = ascending, second click = descending
- [ ] Visual indicator shows sort column and direction
- [ ] Numeric columns sort numerically (not lexicographically)
- [ ] Works for all table charts on dashboards

---

### F5: Table Column Reordering with Persistence

**Request**: Make it possible to drag and reorder columns on the table charts and then persist that setting to the database.

#### Current State

- **Dashboard Tables**: HTML table, no reordering capability
- **Results Table**: AG Grid, reordering not explicitly configured
- **Persistence**: Chart specs saved via `upsertCard` mutation
- **ChartSpec Schema**: No column order field currently exists

#### Technical Implementation

**Schema Enhancement** (in [chart-spec.ts](src/types/chart-spec.ts)):
```typescript
export interface ChartOptions {
  // ... existing fields
  columnOrder?: string[]  // Ordered array of column names
}
```

**Option A: AG Grid implementation**
```typescript
// Enable column reordering
const defaultColDef = {
  // ...existing
  enableCellChangeFlash: true,
}

// Track column moves
const onColumnMoved = (event: ColumnMovedEvent) => {
  const newOrder = event.columnApi.getAllDisplayedColumns()
    .map(col => col.getColId())
  // Persist to chartSpec.options.columnOrder
}
```

**Option B: dnd-kit with HTML table**
- Wrap headers in `<DndContext>`
- Use `<SortableContext>` for header cells
- Track order in state, persist on change

**Persistence Flow**:
1. User drags column to new position
2. Update local state with new column order
3. Debounce (500ms) and call `upsertCard` mutation
4. Save `columnOrder` in `chartSpec.options`
5. On load, apply saved column order to rendering

**GraphQL**: No schema changes needed - `chartSpec` is already `JSON!` type

#### Acceptance Criteria
- [ ] User can drag table column headers to reorder
- [ ] Visual feedback during drag operation
- [ ] New order persists to database
- [ ] Order restored on page refresh
- [ ] Works for all table charts on dashboards

---

### F6: Page Load Spinner with Fade-in

**Request**: Add a load spinner on page load for all pages; after loading is complete, fade in the page from zero opacity. Include a sleep(2) so that the load spinner is always triggered to simulate a slow loading experience.

#### Current State

- No global loading spinner
- Individual pages have their own loading states (skeletons)
- Motion library installed for animations
- `BlurFade` component exists in [blur-fade.tsx](src/components/magicui/blur-fade.tsx)

#### Technical Implementation

**Create Loading Provider Component**:
```typescript
// src/components/providers/loading-provider.tsx
'use client'

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Artificial 2-second delay
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </>
  )
}
```

**Spinner Component**:
```typescript
// src/components/ui/loading-spinner.tsx
export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  )
}
```

**Integration** (in [layout.tsx](src/app/layout.tsx)):
```tsx
<LoadingProvider>
  <AppLayout>{children}</AppLayout>
</LoadingProvider>
```

**Considerations**:
- Use `usePathname()` hook to trigger on route changes
- Consider showing spinner on navigation between pages too
- The 2-second delay is artificial per requirements

#### Acceptance Criteria
- [ ] Spinner appears immediately on page load
- [ ] Spinner displays for minimum 2 seconds
- [ ] Content fades in smoothly after spinner
- [ ] Works on all pages (dashboards, explorer, etc.)
- [ ] Spinner is visually centered and styled appropriately

---

### F7: Security Audit and Fix

**Request**: Test for security and fix the most critical issue.

#### Current Security Implementation

| Layer | Implementation |
|-------|----------------|
| Authentication | Clerk middleware protects all routes except /sign-in, /sign-up |
| SQL Validation | Client-side validation blocks dangerous keywords (DROP, DELETE, etc.) |
| Form Validation | Zod schemas for dashboard creation |
| Environment | .env files properly gitignored |

#### Identified Security Concerns

**CRITICAL - SQL Injection Risk**:
- **Location**: [route.ts](src/app/api/graphql/route.ts) lines 837-1048
- **Issue**: SQL queries are parsed via regex, not parameterized
- **Current Mitigation**: Client-side validation only
- **Problem**: Malicious client could bypass validation and send crafted SQL

**Regex-based SQL parsing** (vulnerable):
```typescript
const fromMatch = sql.match(/from\s+(\w+)/i)
const whereMatch = sql.match(/where\s+(.+?)(?:\s+order\s+by|...)/i)
```

**Other Concerns**:
1. GraphQL introspection enabled in production (`introspection: true`)
2. No rate limiting on GraphQL endpoint
3. No server-side SQL validation (client validation only)

#### Recommended Fix

**Add Server-Side SQL Validation**:
```typescript
// In route.ts, before processing SQL
function validateSqlServer(sql: string): { valid: boolean; error?: string } {
  const dangerous = /\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC)\b/i
  if (dangerous.test(sql)) {
    return { valid: false, error: 'Dangerous SQL operation not allowed' }
  }
  // Only allow SELECT and WITH (CTEs)
  const trimmed = sql.trim().toLowerCase()
  if (!trimmed.startsWith('select') && !trimmed.startsWith('with')) {
    return { valid: false, error: 'Only SELECT queries are allowed' }
  }
  return { valid: true }
}
```

**In the executeSql resolver**:
```typescript
executeSql: async (_, { sql }) => {
  const validation = validateSqlServer(sql)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  // ... continue processing
}
```

#### Acceptance Criteria
- [ ] Server-side SQL validation implemented
- [ ] Dangerous SQL keywords rejected at API level
- [ ] Error messages returned for invalid queries
- [ ] Audit log for rejected queries (console.warn)

---

### F8: AI Agent for Natural Language SQL

**Request**: Add an AI agent on the Data Explorer page that translates natural language queries into SQL commands and runs them.

#### Current State

- **Page**: [page.tsx](src/app/explorer/page.tsx)
- **SQL Editor**: CodeMirror with autocomplete
- **Schema Browser**: Shows tables/columns with metadata
- **Query Execution**: GraphQL mutation `executeSql`
- **No AI/NLP features** currently

#### Technical Implementation

**UI Addition**:
```tsx
// Add input field above SQL editor
<div className="flex gap-2 p-4 border-b">
  <Input
    placeholder="Ask in plain English, e.g., 'Show me total revenue by month'"
    value={naturalQuery}
    onChange={(e) => setNaturalQuery(e.target.value)}
  />
  <Button onClick={handleAIQuery}>
    <SparklesIcon className="w-4 h-4 mr-2" />
    Generate SQL
  </Button>
</div>
```

**AI Integration Options**:

**Option A: OpenAI API (Server-side)**
```typescript
// New API route: src/app/api/ai/generate-sql/route.ts
import OpenAI from 'openai'

export async function POST(req: Request) {
  const { query, schema } = await req.json()

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: `You are a SQL expert. Given the following schema: ${JSON.stringify(schema)}. Generate a valid SQL SELECT query.` },
      { role: 'user', content: query }
    ]
  })

  return Response.json({ sql: response.choices[0].message.content })
}
```

**Option B: Anthropic Claude API**
```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// Similar implementation
```

**Schema Context**:
Pass current schema to AI for accurate table/column references:
```typescript
const { data: schemaData } = useQuery(GET_SCHEMA_METADATA)
// Include in AI prompt
```

**Workflow**:
1. User types natural language query
2. Click "Generate SQL" button
3. Send to AI API with schema context
4. AI returns SQL query
5. Populate SQL editor with result
6. User can review/edit before executing
7. Execute with existing `executeSql` mutation

#### Environment Variables Needed
```
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

#### Acceptance Criteria
- [ ] Natural language input field on Explorer page
- [ ] "Generate SQL" button triggers AI translation
- [ ] Generated SQL populates the editor
- [ ] User can edit before executing
- [ ] Handles schema context for accurate column names
- [ ] Error handling for AI API failures
- [ ] Loading state while AI processes

---

### F9: Scatter Plot Chart Type

**Request**: Add a new chart type: scatter plot.

#### Current State

- **Chart Types**: bar, line, pie, table
- **Defined In**: [chart-spec.ts](src/types/chart-spec.ts)
- **Rendered By**: [renderer.tsx](src/components/charts/renderer.tsx)
- **Library**: Recharts (ScatterChart available)

#### Technical Implementation

**1. Update ChartType** ([chart-spec.ts](src/types/chart-spec.ts)):
```typescript
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'scatter'
```

**2. Add Scatter Encodings**:
```typescript
export interface Encodings {
  // ... existing
  xValue?: MeasureRef   // Numeric X for scatter
  yValue?: MeasureRef   // Numeric Y for scatter
  size?: MeasureRef     // Optional: bubble size
}
```

**3. Add to Chart Type Selector** ([edit/page.tsx](src/app/dashboards/[dashboardId]/cards/[cardId]/edit/page.tsx)):
```typescript
const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'table', label: 'Table' },
  { value: 'scatter', label: 'Scatter Plot' },  // Add
] as const
```

**4. Implement Renderer** ([renderer.tsx](src/components/charts/renderer.tsx)):
```typescript
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'

if (spec.type === 'scatter') {
  const xKey = spec.encodings.xValue?.field || 'x'
  const yKey = spec.encodings.yValue?.field || 'y'
  const sizeKey = spec.encodings.size?.field

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey={xKey} name={xKey} />
        <YAxis type="number" dataKey={yKey} name={yKey} />
        {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[60, 400]} />}
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter
          data={chartData}
          fill={COLORS[0]}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
```

**5. Data Transformation** ([data-transform.ts](src/components/charts/data-transform.ts)):
```typescript
if (spec.type === 'scatter') {
  // Scatter plots use raw data points, no pivoting
  return {
    chartData: rows,
    seriesKeys: [],
    xKey: spec.encodings.xValue?.field,
    valueKey: spec.encodings.yValue?.field,
  }
}
```

**6. Add Shelves for Scatter** (in editor):
```typescript
// For Scatter:
// X-Value shelf (accepts number fields, max 1)
// Y-Value shelf (accepts number fields, max 1)
// Size shelf (accepts number fields, max 1, optional)
// Series shelf (accepts string fields, max 1, optional for color grouping)
```

#### Acceptance Criteria
- [ ] "Scatter Plot" appears in chart type selector
- [ ] Scatter plot renders with X/Y numeric axes
- [ ] Points displayed with appropriate size
- [ ] Tooltip shows data on hover
- [ ] Optional: Size encoding for bubble chart variant
- [ ] Optional: Series encoding for color grouping
- [ ] Works with existing data sources

---

### F10: Dashboard Folders with Drag-and-Drop

**Request**: Make it possible to organize dashboards into collapsible folders with a drag-and-drop system.

#### Current State

- **Dashboards Page**: Flat grid of dashboard cards
- **Category Filter**: Dropdown filter (not folders)
- **Existing Categories**: Sales & Performance, Financial, Operations, Administrative, Custom
- **Drag-and-Drop Library**: dnd-kit installed

#### Technical Implementation

**1. New Data Model**:
```typescript
// Folder structure
interface DashboardFolder {
  id: string
  name: string
  order: number
  isExpanded: boolean
  dashboardIds: string[]  // Ordered list
}

// Or add to Dashboard:
interface Dashboard {
  // ... existing fields
  folderId?: string | null  // null = root level
  orderInFolder?: number
}
```

**2. GraphQL Schema Additions**:
```graphql
type Folder {
  id: ID!
  name: String!
  order: Int!
  isExpanded: Boolean!
  dashboards: [Dashboard!]!
}

type Query {
  folders: [Folder!]!
}

type Mutation {
  createFolder(name: String!): Folder!
  updateFolder(id: ID!, name: String, isExpanded: Boolean): Folder!
  deleteFolder(id: ID!): Boolean!
  moveDashboardToFolder(dashboardId: ID!, folderId: ID, order: Int): Dashboard!
}
```

**3. UI Component Structure**:
```tsx
<DndContext onDragEnd={handleDragEnd}>
  {/* Root-level dashboards */}
  <SortableContext items={rootDashboardIds}>
    {rootDashboards.map(d => <SortableDashboardCard key={d.id} {...d} />)}
  </SortableContext>

  {/* Folders */}
  {folders.map(folder => (
    <Collapsible key={folder.id} open={folder.isExpanded}>
      <CollapsibleTrigger>
        <FolderIcon /> {folder.name}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SortableContext items={folder.dashboardIds}>
          {folder.dashboards.map(d => <SortableDashboardCard key={d.id} {...d} />)}
        </SortableContext>
      </CollapsibleContent>
    </Collapsible>
  ))}

  <DragOverlay>
    {activeId && <DashboardCardOverlay id={activeId} />}
  </DragOverlay>
</DndContext>
```

**4. Drag Operations to Support**:
- Drag dashboard to reorder within folder
- Drag dashboard into/out of folder
- Drag dashboard between folders
- Drag folder to reorder folders
- Visual drop indicators

**5. Collapsible State**:
- Use Radix Collapsible (already installed)
- Persist expanded/collapsed state per folder
- Remember state on page refresh (localStorage or server)

**6. Create Folder UI**:
- "New Folder" button
- Inline rename on double-click
- Delete folder (moves dashboards to root)

#### Acceptance Criteria
- [ ] User can create new folders
- [ ] User can rename folders
- [ ] User can delete folders (dashboards move to root)
- [ ] Folders are collapsible (expand/collapse)
- [ ] User can drag dashboards into folders
- [ ] User can drag dashboards out of folders
- [ ] User can reorder dashboards within folders
- [ ] User can reorder folders
- [ ] Folder state persists on refresh
- [ ] Visual feedback during drag operations

---

## Codebase Architecture Reference

### Directory Structure

```
src/
├── app/                           # Next.js App Router
│   ├── api/graphql/route.ts       # GraphQL API endpoint
│   ├── dashboards/                # Dashboard routes
│   │   ├── page.tsx               # Dashboard list
│   │   └── [dashboardId]/         # Individual dashboard
│   ├── explorer/page.tsx          # SQL Explorer
│   └── layout.tsx                 # Root layout
├── components/
│   ├── charts/                    # Chart components
│   │   ├── renderer.tsx           # Main chart renderer
│   │   └── data-transform.ts      # Data transformation
│   ├── dashboard/                 # Dashboard components
│   ├── explorer/                  # SQL Explorer components
│   │   ├── sql-editor.tsx         # CodeMirror editor
│   │   └── results-table.tsx      # AG Grid table
│   ├── layout/                    # Layout components
│   ├── providers/                 # Context providers
│   └── ui/                        # Reusable UI components
├── graphql/
│   ├── generated/                 # Auto-generated types
│   └── operations/                # GraphQL queries/mutations
├── lib/
│   ├── apollo-client.ts           # Apollo Client setup
│   └── utils.ts                   # Utility functions
└── types/
    └── chart-spec.ts              # Chart type definitions
```

### GraphQL Operations

**Queries**:
- `dashboards` - List all dashboards
- `dashboard(id)` - Get single dashboard
- `getSchemaMetadata` - Get database schema
- `executeChart(spec)` - Execute chart query

**Mutations**:
- `createDashboard` / `updateDashboard` / `deleteDashboard`
- `duplicateDashboard`
- `updateDashboardLayout`
- `upsertCard` / `deleteCard`
- `executeSql` / `cancelQuery`

### Installed Dependencies (Relevant to Features)

| Package | Version | Used For |
|---------|---------|----------|
| @dnd-kit/core | ^6.3.1 | Drag and drop |
| @dnd-kit/sortable | ^10.0.0 | Sortable lists |
| react-grid-layout | ^1.5.2 | Dashboard grid |
| recharts | ^3.1.2 | Charts |
| ag-grid-react | ^34.1.1 | Data tables |
| @uiw/react-codemirror | ^4.24.2 | SQL editor |
| @codemirror/lang-sql | ^6.9.1 | SQL syntax |
| motion | ^12.23.12 | Animations |
| @radix-ui/react-collapsible | ^1.1.11 | Collapsible folders |
| zod | ^4.0.15 | Validation |

---

*End of PRD*
