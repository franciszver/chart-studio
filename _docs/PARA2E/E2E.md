# End-to-End File Changes

This document lists all files created or modified for each feature, organized by feature for traceability.

---

## Summary Table

| Feature | Files Created | Files Modified | Total |
|---------|---------------|----------------|-------|
| F1: Dashboard Reordering | 1 | 1 | 2 |
| F2: Styling Enhancements | 0 | 1 | 1 |
| F3: SQL Line Wrapping | 0 | 1 | 1 |
| F4: Table Chart Sorting | 0 | 1 | 1 |
| F5: Column Reordering | 0 | 2 | 2 |
| F6: Loading Spinner | 2 | 1 | 3 |
| F7: Security Fixes | 0 | 1 | 1 |
| F8: AI SQL Agent | 2 | 1 | 3 |
| F9: Scatter Plot | 0 | 4 | 4 |
| F10: Dashboard Folders | 1 | 1 | 2 |
| **Total Unique Files** | **6** | **~10** | **~16** |

---

## Feature F1: Dashboard Reordering

**Purpose**: Enable drag-and-drop reordering of dashboards on the /dashboards page with localStorage persistence.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `src/components/dashboard/sortable-dashboard-card.tsx` | Draggable wrapper for dashboard cards using dnd-kit |

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/app/dashboards/page.tsx` | Add DndContext, SortableContext, order state, localStorage read/write |

### localStorage Keys

| Key | Data Type | Purpose |
|-----|-----------|---------|
| `dashboard-order` | `string[]` | Array of dashboard IDs in user's preferred order |

---

## Feature F2: Styling Enhancements

**Purpose**: Apply futuristic business aesthetic with dark tones and electric accents.

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/app/globals.css` | Update CSS custom properties for theme |

### CSS Variables Changed

```css
--primary          /* Electric blue/cyan */
--primary-foreground
--background       /* Dark navy/slate */
--foreground       /* Light text */
--card             /* Glass effect background */
--card-foreground
--accent           /* Complementary accent */
--muted            /* Subdued backgrounds */
--border           /* Subtle borders */
--ring             /* Focus rings */
```

---

## Feature F3: SQL Line Wrapping

**Purpose**: Toggle line wrapping in SQL editor with Alt+Z keyboard shortcut.

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/components/explorer/sql-editor.tsx` | Add lineWrap state, keymap extension, EditorView.lineWrapping toggle, visual indicator |

### localStorage Keys

| Key | Data Type | Purpose |
|-----|-----------|---------|
| `sql-line-wrap` | `boolean` | User's line wrap preference |

---

## Feature F4: Table Chart Sorting

**Purpose**: Enable column sorting on table charts with asc/desc toggle.

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/components/charts/renderer.tsx` | Add sortConfig state, sort logic, header click handlers, sort indicators in table section |

### State Structure

```typescript
interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}
```

---

## Feature F5: Table Column Reordering

**Purpose**: Drag-and-drop column reordering with database persistence.

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/types/chart-spec.ts` | Add `columnOrder?: string[]` to ChartOptions interface |
| `src/components/charts/renderer.tsx` | Add dnd-kit to table headers, column order state, debounced save via upsertCard |

### Schema Changes

```typescript
// In ChartOptions
export interface ChartOptions {
  // ... existing
  columnOrder?: string[]  // NEW: Ordered array of column field names
}
```

---

## Feature F6: Loading Spinner with Fade-in

**Purpose**: Global loading spinner on all pages with 2s delay and fade-in animation.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `src/components/providers/loading-provider.tsx` | Context provider managing loading state and animation |
| `src/components/ui/loading-spinner.tsx` | Spinner component with centered overlay |

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/app/layout.tsx` | Wrap children with LoadingProvider |

### Component Structure

```tsx
// layout.tsx structure after modification
<ClerkProvider>
  <html>
    <body>
      <LoadingProvider>
        <ApolloProvider>
          {children}
        </ApolloProvider>
      </LoadingProvider>
    </body>
  </html>
</ClerkProvider>
```

---

## Feature F7: Security Fixes

**Purpose**: Add server-side SQL validation to prevent injection attacks.

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/app/api/graphql/route.ts` | Add validateSqlServer function, integrate into executeSql resolver, add security logging |

### Functions Added

```typescript
function validateSqlServer(sql: string): { valid: boolean; error?: string }
```

### Resolver Changes

```typescript
// In executeSql resolver, add at start:
const validation = validateSqlServer(sql)
if (!validation.valid) {
  throw new Error(validation.error)
}
```

---

## Feature F8: AI SQL Agent

**Purpose**: Natural language to SQL conversion using OpenAI with fallback.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `src/app/api/ai/generate-sql/route.ts` | API endpoint for OpenAI integration with fallback |
| `src/components/explorer/ai-query-input.tsx` | Input component for natural language queries |

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/app/explorer/page.tsx` | Import and render AiQueryInput component, pass schema and SQL setter |

### API Endpoint

```
POST /api/ai/generate-sql

Request:
{
  "query": "Show me total revenue by month",
  "schema": { /* SchemaMetadata */ }
}

Response:
{
  "sql": "SELECT month, SUM(total_revenue) FROM revenue_summary GROUP BY month",
  "source": "openai" | "fallback",
  "message"?: "Fallback warning message"
}
```

### Environment Variables

```bash
OPENAI_API_KEY=sk-...    # Required for OpenAI
OPENAI_MODEL=gpt-4       # Optional, defaults to gpt-4
```

---

## Feature F9: Scatter Plot Chart

**Purpose**: Add scatter plot as a new chart type option.

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/types/chart-spec.ts` | Add 'scatter' to ChartType union, add xValue/yValue/size to Encodings |
| `src/components/charts/renderer.tsx` | Add scatter plot rendering with Recharts ScatterChart |
| `src/components/charts/data-transform.ts` | Handle scatter data transformation (pass-through) |
| `src/app/dashboards/[dashboardId]/cards/[cardId]/edit/page.tsx` | Add scatter to CHART_TYPES, add scatter shelf configuration |

### Type Changes

```typescript
// chart-spec.ts
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'scatter'

export interface Encodings {
  // ... existing
  xValue?: MeasureRef    // For scatter X axis
  yValue?: MeasureRef    // For scatter Y axis
  size?: MeasureRef      // For bubble size (optional)
}
```

---

## Feature F10: Dashboard Folders

**Purpose**: Organize dashboards into collapsible folders with drag-and-drop.

### Files Created

| File Path | Purpose |
|-----------|---------|
| `src/components/dashboard/dashboard-folder.tsx` | Collapsible folder component with drag targets |

### Files Modified

| File Path | Changes |
|-----------|---------|
| `src/app/dashboards/page.tsx` | Add folder state management, create folder UI, integrate DashboardFolder components |

### localStorage Keys

| Key | Data Type | Purpose |
|-----|-----------|---------|
| `dashboard-folders` | `FolderState` | Folder structure and assignment |

### State Structure

```typescript
interface FolderState {
  folders: {
    id: string
    name: string
    dashboardIds: string[]
    isExpanded: boolean
  }[]
  rootDashboardIds: string[]
}
```

---

## Complete File List (Alphabetical)

### New Files (6)

1. `src/app/api/ai/generate-sql/route.ts`
2. `src/components/dashboard/dashboard-folder.tsx`
3. `src/components/dashboard/sortable-dashboard-card.tsx`
4. `src/components/explorer/ai-query-input.tsx`
5. `src/components/providers/loading-provider.tsx`
6. `src/components/ui/loading-spinner.tsx`

### Modified Files (10)

1. `src/app/dashboards/[dashboardId]/cards/[cardId]/edit/page.tsx` (F9)
2. `src/app/dashboards/page.tsx` (F1, F10)
3. `src/app/explorer/page.tsx` (F8)
4. `src/app/globals.css` (F2)
5. `src/app/layout.tsx` (F6)
6. `src/app/api/graphql/route.ts` (F7)
7. `src/components/charts/data-transform.ts` (F9)
8. `src/components/charts/renderer.tsx` (F4, F5, F9)
9. `src/components/explorer/sql-editor.tsx` (F3)
10. `src/types/chart-spec.ts` (F5, F9)

---

## Dependency Graph

```
F6 (Loading)
 └── layout.tsx ← all pages depend on this

F2 (Styling)
 └── globals.css ← all components use theme

F7 (Security)
 └── route.ts ← all GraphQL operations

F3 (Line Wrap)          F4 (Sorting)
 └── sql-editor.tsx      └── renderer.tsx
                              ↓
F9 (Scatter)            F5 (Columns)
 ├── chart-spec.ts       ├── chart-spec.ts
 ├── renderer.tsx        └── renderer.tsx
 ├── data-transform.ts
 └── edit/page.tsx

F1 (Reorder)
 └── dashboards/page.tsx
      ↓
F10 (Folders)
 └── dashboards/page.tsx

F8 (AI Agent)
 ├── api/ai/route.ts (NEW)
 ├── ai-query-input.tsx (NEW)
 └── explorer/page.tsx
```

---

*End of E2E Document*
