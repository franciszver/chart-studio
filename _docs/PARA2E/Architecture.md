# Architecture Document

This document provides system architecture diagrams for all 10 features using Mermaid notation. Diagrams are designed to be readable by both humans and AI agents.

---

## System Overview

```mermaid
flowchart TB
    subgraph Client["Browser Client"]
        UI[React UI Components]
        Apollo[Apollo Client Cache]
        LS[localStorage]
    end

    subgraph NextJS["Next.js Server"]
        Pages[App Router Pages]
        API[API Routes]
        GQL[GraphQL Server]
        AI[AI Route]
    end

    subgraph External["External Services"]
        Clerk[Clerk Auth]
        OpenAI[OpenAI API]
    end

    subgraph Data["Data Layer"]
        Mock[Mock In-Memory DB]
    end

    UI --> Apollo
    Apollo --> GQL
    UI --> LS
    Pages --> UI
    API --> GQL
    API --> AI
    AI --> OpenAI
    GQL --> Mock
    UI --> Clerk
    Pages --> Clerk
```

---

## Feature Architecture Diagrams

### F1: Dashboard Reordering

```mermaid
flowchart LR
    subgraph UI["Dashboard List Page"]
        DndContext[DndContext Provider]
        SortableContext[SortableContext]
        Cards[Dashboard Cards]
    end

    subgraph State["State Management"]
        LocalOrder[localStorage: dashboard-order]
    end

    subgraph Events["User Events"]
        DragStart[onDragStart]
        DragEnd[onDragEnd]
    end

    User((User)) --> DragStart
    DragStart --> DndContext
    DndContext --> SortableContext
    SortableContext --> Cards
    DragEnd --> LocalOrder
    LocalOrder --> |"Page Load"| SortableContext
```

**Data Flow**:
1. User drags dashboard card
2. DndContext captures drag events
3. SortableContext updates visual order
4. onDragEnd saves order to localStorage
5. Page load reads order from localStorage and applies

---

### F2: Styling System

```mermaid
flowchart TB
    subgraph Theme["Theme Configuration"]
        CSS[globals.css]
        Variables[CSS Custom Properties]
    end

    subgraph Components["Styled Components"]
        UI[UI Components]
        Layout[Layout Components]
        Charts[Chart Components]
    end

    subgraph Output["Visual Output"]
        Light[Light Mode]
        Dark[Dark Mode]
    end

    CSS --> Variables
    Variables --> |"--primary, --background, etc."| UI
    Variables --> Layout
    Variables --> Charts
    UI --> Light
    UI --> Dark
    Layout --> Light
    Layout --> Dark
```

**CSS Variable Categories**:
- Colors: `--primary`, `--background`, `--foreground`, `--accent`
- Spacing: `--radius`, `--radius-sm`, `--radius-lg`
- Effects: shadows, gradients, glass effects

---

### F3: SQL Line Wrapping

```mermaid
flowchart LR
    subgraph Editor["SQL Editor Component"]
        CM[CodeMirror Instance]
        Extensions[Extensions Array]
        WrapExt[EditorView.lineWrapping]
    end

    subgraph State["Component State"]
        WrapState[lineWrap: boolean]
        LocalStorage[localStorage: sql-line-wrap]
    end

    subgraph Input["User Input"]
        AltZ[Alt+Z Keypress]
    end

    AltZ --> |"Toggle"| WrapState
    WrapState --> |"Conditionally add"| Extensions
    Extensions --> CM
    WrapState --> LocalStorage
    LocalStorage --> |"Initial load"| WrapState
```

**Toggle Logic**:
```
if (lineWrap) {
  extensions.push(EditorView.lineWrapping)
}
```

---

### F4: Table Chart Sorting

```mermaid
flowchart TB
    subgraph Renderer["Chart Renderer"]
        TableComponent[Table Component]
        Headers[Column Headers]
        Rows[Data Rows]
    end

    subgraph State["Sort State"]
        SortConfig["{ key: string, direction: 'asc' | 'desc' }"]
    end

    subgraph Logic["Sort Logic"]
        SortFn[useMemo Sort Function]
        SortedData[Sorted Data Array]
    end

    User((User)) --> |"Click header"| Headers
    Headers --> SortConfig
    SortConfig --> SortFn
    Rows --> SortFn
    SortFn --> SortedData
    SortedData --> TableComponent
```

**Sort Cycle**: none → asc → desc → none

---

### F5: Table Column Reordering

```mermaid
flowchart TB
    subgraph Table["Table Component"]
        DndContext[DndContext]
        HeaderRow[Draggable Headers]
        DataRows[Data Rows]
    end

    subgraph Persistence["Persistence"]
        ChartSpec[ChartSpec.options.columnOrder]
        UpsertCard[upsertCard Mutation]
    end

    User((User)) --> |"Drag column"| HeaderRow
    HeaderRow --> |"onDragEnd"| DndContext
    DndContext --> |"New order"| ChartSpec
    ChartSpec --> |"Debounced save"| UpsertCard
    UpsertCard --> |"GraphQL"| Server[(Server)]
```

---

### F6: Loading Spinner

```mermaid
flowchart TB
    subgraph Provider["LoadingProvider"]
        IsLoading[isLoading: boolean]
        Timer[2s setTimeout]
    end

    subgraph UI["UI Layer"]
        Spinner[Loading Spinner]
        Content[Page Content]
        Overlay[Opacity Overlay]
    end

    subgraph Animation["Motion Animation"]
        FadeIn[opacity: 0 → 1]
    end

    PageLoad((Page Load)) --> IsLoading
    IsLoading --> |"true"| Spinner
    IsLoading --> |"true"| Overlay
    Timer --> |"After 2s"| IsLoading
    IsLoading --> |"false"| FadeIn
    FadeIn --> Content
```

**Flow**:
1. Page loads → isLoading = true
2. Spinner displays, content hidden (opacity: 0)
3. 2 second timer completes
4. isLoading = false
5. Content fades in over 500ms

---

### F7: Security Flow

```mermaid
flowchart TB
    subgraph Client["Client Side"]
        SQLInput[SQL Input]
        ClientValidation[Client Validation]
    end

    subgraph Server["Server Side"]
        ServerValidation[Server Validation]
        Resolver[executeSql Resolver]
        MockDB[Mock Database]
    end

    subgraph Security["Security Layer"]
        BlockList[Dangerous Keywords]
        AllowList[SELECT/WITH Only]
        Logger[Security Logger]
    end

    SQLInput --> ClientValidation
    ClientValidation --> |"GraphQL"| ServerValidation
    ServerValidation --> BlockList
    ServerValidation --> AllowList
    BlockList --> |"Blocked"| Logger
    AllowList --> |"Passed"| Resolver
    Resolver --> MockDB
```

**Validation Chain**:
1. Client validates (UX - immediate feedback)
2. Server validates (Security - cannot be bypassed)
3. Both use same rules (consistency)

---

### F8: AI SQL Agent

```mermaid
flowchart TB
    subgraph Explorer["Data Explorer Page"]
        NLInput[Natural Language Input]
        GenerateBtn[Generate SQL Button]
        SQLEditor[SQL Editor]
    end

    subgraph API["API Layer"]
        AIRoute[/api/ai/generate-sql]
        SchemaContext[Schema Metadata]
    end

    subgraph AI["AI Processing"]
        OpenAI[OpenAI GPT-4]
        Fallback[Keyword Fallback]
    end

    subgraph Output["Result"]
        GeneratedSQL[Generated SQL]
        ExecuteBtn[Execute Button]
    end

    User((User)) --> NLInput
    NLInput --> GenerateBtn
    GenerateBtn --> AIRoute
    SchemaContext --> AIRoute
    AIRoute --> |"API Key exists"| OpenAI
    AIRoute --> |"No API Key"| Fallback
    OpenAI --> GeneratedSQL
    Fallback --> |"+ Warning message"| GeneratedSQL
    GeneratedSQL --> SQLEditor
    SQLEditor --> ExecuteBtn
```

**Fallback Keywords**:
- "customer" → `SELECT * FROM customers`
- "revenue" → `SELECT * FROM revenue_summary`
- "deal" → `SELECT * FROM deals`

---

### F9: Scatter Plot

```mermaid
flowchart TB
    subgraph ChartSpec["Chart Specification"]
        Type["type: 'scatter'"]
        Encodings[encodings: xValue, yValue, size?]
        Data[data: DataQuery]
    end

    subgraph Renderer["Chart Renderer"]
        TypeCheck{spec.type === 'scatter'?}
        ScatterChart[Recharts ScatterChart]
        OtherCharts[Other Chart Types]
    end

    subgraph Recharts["Recharts Components"]
        XAxis[XAxis numeric]
        YAxis[YAxis numeric]
        Scatter[Scatter points]
        ZAxis[ZAxis size - optional]
    end

    ChartSpec --> Renderer
    TypeCheck --> |"Yes"| ScatterChart
    TypeCheck --> |"No"| OtherCharts
    ScatterChart --> XAxis
    ScatterChart --> YAxis
    ScatterChart --> Scatter
    Encodings --> |"size field"| ZAxis
```

---

### F10: Dashboard Folders

```mermaid
flowchart TB
    subgraph UI["Dashboard Page"]
        DndContext[DndContext]
        RootDashboards[Root Level Dashboards]
        Folders[Folder Components]
    end

    subgraph Folder["Folder Structure"]
        Collapsible[Radix Collapsible]
        FolderHeader[Folder Header]
        FolderContent[Folder Content]
        NestedDashboards[Dashboards in Folder]
    end

    subgraph State["State Management"]
        FolderState[localStorage: dashboard-folders]
        ExpandedState[Expanded/Collapsed State]
    end

    User((User)) --> |"Create folder"| Folders
    User --> |"Drag to folder"| DndContext
    DndContext --> FolderState
    Folders --> Collapsible
    Collapsible --> FolderHeader
    Collapsible --> FolderContent
    FolderContent --> NestedDashboards
    FolderHeader --> |"Click toggle"| ExpandedState
    ExpandedState --> FolderState
```

**Folder Data Structure**:
```typescript
interface FolderState {
  folders: {
    id: string
    name: string
    dashboardIds: string[]
    isExpanded: boolean
  }[]
  rootDashboardIds: string[]  // Dashboards not in any folder
}
```

---

## Complete User Flow

```mermaid
flowchart TB
    subgraph Entry["Application Entry"]
        Load[Page Load]
        Spinner[Loading Spinner - 2s]
        FadeIn[Content Fade In]
    end

    subgraph Auth["Authentication"]
        Clerk[Clerk Check]
        SignIn[Sign In Page]
        Protected[Protected Routes]
    end

    subgraph Dashboard["Dashboard Management"]
        List[Dashboard List]
        Folders[Folders]
        Reorder[Drag Reorder]
        View[View Dashboard]
    end

    subgraph Charts["Chart Interaction"]
        ChartView[View Charts]
        TableSort[Sort Tables]
        ColumnReorder[Reorder Columns]
        ScatterPlot[Scatter Plots]
    end

    subgraph Explorer["Data Explorer"]
        SQLEditor[SQL Editor]
        LineWrap[Toggle Line Wrap]
        AIAgent[AI Query Input]
        Execute[Execute Query]
        Results[View Results]
    end

    Load --> Spinner
    Spinner --> FadeIn
    FadeIn --> Clerk
    Clerk --> |"Not authenticated"| SignIn
    Clerk --> |"Authenticated"| Protected

    Protected --> List
    List --> Folders
    List --> Reorder
    List --> View

    View --> ChartView
    ChartView --> TableSort
    ChartView --> ColumnReorder
    ChartView --> ScatterPlot

    Protected --> SQLEditor
    SQLEditor --> LineWrap
    SQLEditor --> AIAgent
    AIAgent --> SQLEditor
    SQLEditor --> Execute
    Execute --> Results
```

---

## State Management Overview

```mermaid
flowchart LR
    subgraph LocalStorage["localStorage Keys"]
        LS1[dashboard-order]
        LS2[dashboard-folders]
        LS3[sql-line-wrap]
        LS4[sql-editor-content]
    end

    subgraph ApolloCache["Apollo Client Cache"]
        AC1[dashboards]
        AC2[dashboard by ID]
        AC3[schemaMetadata]
    end

    subgraph ServerState["Server State - Mock DB"]
        SS1[dashboards array]
        SS2[cards/chartSpecs]
        SS3[layouts]
    end

    LocalStorage --> |"Client preference"| UI((UI))
    ApolloCache --> |"Fetched data"| UI
    UI --> |"Mutations"| ServerState
    ServerState --> |"Query response"| ApolloCache
```

---

## File Dependency Graph

```mermaid
flowchart TB
    subgraph Pages["Pages"]
        LP[layout.tsx]
        DP[dashboards/page.tsx]
        EP[explorer/page.tsx]
        VP[dashboards/id/page.tsx]
    end

    subgraph Providers["Providers"]
        LoadP[loading-provider.tsx]
        ApolloP[apollo-provider.tsx]
    end

    subgraph Components["Components"]
        Spinner[loading-spinner.tsx]
        SQLEd[sql-editor.tsx]
        ChartR[renderer.tsx]
        DashCard[dashboard-card.tsx]
        Folder[dashboard-folder.tsx]
        AIInput[ai-query-input.tsx]
    end

    subgraph API["API Routes"]
        GQL[graphql/route.ts]
        AIAPI[ai/generate-sql/route.ts]
    end

    subgraph Styles["Styles"]
        Global[globals.css]
    end

    LP --> LoadP
    LP --> ApolloP
    LP --> Global
    LoadP --> Spinner
    DP --> DashCard
    DP --> Folder
    EP --> SQLEd
    EP --> AIInput
    VP --> ChartR
    AIInput --> AIAPI
    SQLEd --> GQL
    ChartR --> GQL
```

---

*End of Architecture Document*
