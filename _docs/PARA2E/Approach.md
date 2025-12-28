# Implementation Approach

This document outlines the implementation order and strategy for all 10 features, optimized for a multi-agent approach with minimal conflicts.

---

## Implementation Philosophy

### Guiding Principles

1. **Foundation First**: Implement infrastructure changes before feature-specific changes
2. **Isolated Changes**: Group features that touch different files to enable parallel work
3. **Dependency Awareness**: Complete prerequisite features before dependent ones
4. **Test Early**: Styling changes first to verify visual feedback during development

### Conflict Avoidance Strategy

Features are organized into **phases** where items within each phase can be worked on in parallel (different files), while phases must be completed sequentially.

---

## Phase Overview

```
Phase 1: Foundation (Sequential - touches core files)
├── F6: Loading Spinner     → layout.tsx, new providers
├── F2: Styling             → globals.css, theme
└── F7: Security            → route.ts

Phase 2: Editor Features (Parallel - isolated components)
├── F3: SQL Line Wrapping   → sql-editor.tsx
└── F4: Table Sorting       → renderer.tsx (table section)

Phase 3: Chart Features (Sequential - same file)
├── F9: Scatter Plot        → renderer.tsx, chart-spec.ts
└── F5: Column Reordering   → renderer.tsx (after F4)

Phase 4: Dashboard Features (Sequential - same page)
├── F1: Dashboard Reorder   → dashboards/page.tsx
└── F10: Dashboard Folders  → dashboards/page.tsx (after F1)

Phase 5: AI Integration (Isolated - new files)
└── F8: AI SQL Agent        → new API route, new component
```

---

## Detailed Implementation Order

### Phase 1: Foundation

**Objective**: Establish core infrastructure that other features depend on.

#### Step 1.1: F6 - Loading Spinner with Fade-in

**Why First**: Creates the loading/animation infrastructure used by all pages.

**Files to Create**:
- `src/components/providers/loading-provider.tsx`
- `src/components/ui/loading-spinner.tsx`

**Files to Modify**:
- `src/app/layout.tsx` - Wrap app with LoadingProvider

**Implementation Notes**:
- Use Motion library (already installed)
- 2 second artificial delay per requirements
- Fade-in animation on content

---

#### Step 1.2: F2 - Futuristic Business Styling

**Why Second**: Visual changes affect all subsequent development and testing.

**Files to Modify**:
- `src/app/globals.css` - Theme variables

**Styling Direction**:
- Dark background tones (navy/slate)
- Electric blue/cyan accent colors
- Subtle glass morphism effects
- Sharp or minimal border radius
- High contrast for accessibility

**CSS Variable Updates**:
```css
:root {
  --primary: /* Electric blue */
  --background: /* Dark slate */
  --card: /* Translucent dark */
  /* Glass effect variables */
}
```

---

#### Step 1.3: F7 - Security Fixes

**Why Third**: Security should be in place before adding new features.

**Files to Modify**:
- `src/app/api/graphql/route.ts`

**Implementation**:
1. Add `validateSqlServer()` function
2. Integrate into `executeSql` resolver
3. Add security logging
4. Add comment about introspection for production

---

### Phase 2: Editor Features (Can Run in Parallel)

**Objective**: Enhance SQL editor and table display.

#### Step 2.1: F3 - SQL Line Wrapping (Agent A)

**Files to Modify**:
- `src/components/explorer/sql-editor.tsx`

**Implementation**:
1. Add `lineWrap` state with localStorage persistence
2. Add Alt+Z keyboard shortcut via CodeMirror keymap
3. Conditionally include `EditorView.lineWrapping` extension
4. Add visual indicator for wrap state

---

#### Step 2.2: F4 - Table Chart Sorting (Agent B - Parallel)

**Files to Modify**:
- `src/components/charts/renderer.tsx` (table section only)

**Implementation**:
1. Add `sortConfig` state to table rendering
2. Implement sort logic with useMemo
3. Add click handlers on headers
4. Add sort direction indicators (▲/▼)
5. Handle numeric vs string sorting

---

### Phase 3: Chart Features (Sequential)

**Objective**: Add new chart type and column reordering.

#### Step 3.1: F9 - Scatter Plot Chart

**Why Before F5**: Adds to chart types before modifying table interaction.

**Files to Modify**:
- `src/types/chart-spec.ts` - Add 'scatter' type
- `src/components/charts/renderer.tsx` - Add scatter rendering
- `src/components/charts/data-transform.ts` - Handle scatter data
- `src/app/dashboards/[dashboardId]/cards/[cardId]/edit/page.tsx` - Add to type selector

**Implementation**:
1. Add `'scatter'` to ChartType union
2. Add scatter encodings (xValue, yValue, size)
3. Implement ScatterChart with Recharts
4. Add to chart type selector in editor
5. Add shelf configuration for scatter

---

#### Step 3.2: F5 - Table Column Reordering

**Why After F9**: Builds on table work from F4.

**Files to Modify**:
- `src/components/charts/renderer.tsx` (table section)
- `src/types/chart-spec.ts` - Add columnOrder to options

**Implementation**:
1. Add `columnOrder?: string[]` to ChartOptions
2. Wrap table headers with dnd-kit
3. Track column order in state
4. Persist via debounced upsertCard mutation
5. Apply saved order on render

---

### Phase 4: Dashboard Features (Sequential)

**Objective**: Add dashboard organization features.

#### Step 4.1: F1 - Dashboard Reordering

**Why Before F10**: Simpler feature, establishes drag-drop pattern.

**Files to Modify**:
- `src/app/dashboards/page.tsx`

**Files to Create**:
- `src/components/dashboard/sortable-dashboard-card.tsx`

**Implementation**:
1. Wrap dashboard grid with DndContext
2. Create SortableDashboardCard component
3. Store order in localStorage
4. Apply order on page load
5. Handle category filter interaction

---

#### Step 4.2: F10 - Dashboard Folders

**Why Last in Phase**: Most complex dashboard feature, builds on F1.

**Files to Modify**:
- `src/app/dashboards/page.tsx`

**Files to Create**:
- `src/components/dashboard/dashboard-folder.tsx`

**Implementation**:
1. Define folder state structure
2. Create DashboardFolder component with Radix Collapsible
3. Enable drag between folders
4. Add create/rename/delete folder UI
5. Persist folder state to localStorage
6. Handle expanded/collapsed state

---

### Phase 5: AI Integration

**Objective**: Add natural language SQL generation.

#### Step 5.1: F8 - AI SQL Agent

**Why Last**: Most isolated feature, doesn't affect other components.

**Files to Create**:
- `src/app/api/ai/generate-sql/route.ts`
- `src/components/explorer/ai-query-input.tsx`

**Files to Modify**:
- `src/app/explorer/page.tsx` - Add AI input component

**Implementation**:
1. Create API route with OpenAI integration
2. Implement fallback for missing API key
3. Create AI query input component
4. Integrate into Explorer page
5. Pass schema context to AI
6. Handle loading and error states

---

## Parallel Execution Map

```
Timeline →

Agent 1    [F6: Loading]──[F2: Styling]──[F7: Security]──[F9: Scatter]──[F1: Reorder]───[F8: AI Agent]
                                              ↓               ↓              ↓
Agent 2                        [F3: Line Wrap]──────────[F4: Table Sort]──[F5: Columns]──[F10: Folders]

Legend:
── Sequential (same agent)
↓  Sync point (wait for completion)
```

---

## Risk Mitigation

### Potential Conflicts

| Risk | Mitigation |
|------|------------|
| Multiple edits to renderer.tsx | Phase 2/3 sequential ordering |
| Multiple edits to page.tsx | Phase 4 sequential ordering |
| Styling affects testing | Complete F2 early |
| Security gaps | Complete F7 before new features |

### Rollback Strategy

Each feature is atomic. If a feature fails:
1. Revert files touched by that feature only
2. Other features remain functional
3. localStorage data isolated per feature key

---

## Verification Checkpoints

### After Phase 1
- [ ] Loading spinner appears on all pages
- [ ] Spinner lasts 2+ seconds
- [ ] Content fades in smoothly
- [ ] New styling applied consistently
- [ ] SQL injection attempts blocked server-side

### After Phase 2
- [ ] Alt+Z toggles line wrapping in SQL editor
- [ ] Table charts show sort indicators
- [ ] Clicking headers sorts data

### After Phase 3
- [ ] Scatter plot appears in chart type selector
- [ ] Scatter plots render with X/Y axes
- [ ] Table columns can be dragged to reorder
- [ ] Column order persists on refresh

### After Phase 4
- [ ] Dashboards can be dragged to reorder
- [ ] Dashboard order persists on refresh
- [ ] Folders can be created/renamed/deleted
- [ ] Dashboards can be moved to/from folders
- [ ] Folder collapse state persists

### After Phase 5
- [ ] AI input field visible on Explorer page
- [ ] Natural language generates SQL
- [ ] Fallback works without API key
- [ ] Generated SQL populates editor

---

## Agent Instructions Summary

**For AI/Agents implementing these features**:

1. **Read** the corresponding PRD section for full requirements
2. **Check** E2E.md for complete file list per feature
3. **Follow** the phase order strictly
4. **Test** after each feature before proceeding
5. **Document** any deviations in commit messages

---

*End of Approach Document*
