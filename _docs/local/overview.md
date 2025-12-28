# Codebase Overview

## What the Codebase Does and the Purpose of the App

This is **Leap Dashboard Studio** - an AI-First CRM Reporting and Dashboard Platform built with Next.js. It's a web-based tool designed for enterprise CRM teams to create reporting dashboards without requiring SQL or coding expertise.

### Core Features

- **Dashboard Management**: Create, manage, and organize custom dashboards for CRM reporting
- **Chart Builder**: Build interactive charts and visualizations through a visual drag-and-drop interface
- **Data Explorer**: Execute SQL queries against business databases with a CodeMirror-powered editor featuring autocomplete and linting
- **Pre-built Templates**: Access dashboard templates for sales performance, financial metrics, operational data, and administrative reporting

### Tech Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: TailwindCSS 4
- **Data Layer**: Apollo Client/Server for GraphQL
- **Charting**: Recharts for visualizations (bar, line, pie charts) and ag-grid for data tables
- **UI Components**: Radix UI primitives with custom components
- **Authentication**: Clerk for user management
- **Layout**: react-grid-layout for dashboard card positioning

---

## How the Data Model is Designed

The data model is built around a **chart specification (ChartSpec) architecture** defined in [chart-spec.ts](src/types/chart-spec.ts).

### Core Data Types

#### ChartSpec (Root Object)
The central data structure containing:
- `version`: Schema version for compatibility
- `type`: Chart type (`bar`, `line`, `pie`, `table`)
- `dataQuery`: What data to fetch
- `encodings`: How data maps to visual elements
- `options`: Display properties

#### DataQuery
Defines what data to fetch:
- `source`: Logical table/view name (e.g., `customers`, `deals`, `revenue_summary`)
- `dimensions`: Categorical grouping fields (dates, categories)
- `measures`: Numeric aggregation fields with operations (sum, avg, min, max, count)
- `filters`: WHERE conditions for filtering data
- `limit` / `orderBy`: Result constraints and sorting

#### Encodings
Visual mapping of data to chart elements:
- **X/Y axes**: For bar and line charts
- **Series**: For multi-line visualization
- **Category/Value**: For pie charts
- **Colors, labels, stacking options**

#### ChartOptions
Display properties:
- Title and subtitle
- Legend position
- Chart height
- Color schemes

### Data Organization Hierarchy

```
Dashboard
├── name, description, category
├── layout (react-grid-layout format)
└── cards[]
    └── Card
        ├── id
        ├── position (x, y, w, h)
        └── chartSpec (ChartSpec object)
```

### Database Schema (Mock Data)

The GraphQL resolver provides mock tables:
- `customers`: Basic customer records
- `accounts`: Customer accounts with revenue data
- `deals`: Sales pipeline stages and values
- `contacts`: Contact information
- `sales_activities`: Activity tracking
- `revenue_summary`: Aggregated revenue views

---

## How User's Charts Are Persisted

Charts are persisted through a **GraphQL API** with Apollo Client/Server. Currently implemented with in-memory storage, designed for production database integration.

### Persistence Flow

1. **Creation**: User builds a chart through the Chart Builder UI
2. **Save**: `upsertCard` mutation sends the complete chart specification
3. **Storage**: Chart spec stored as JSON within the dashboard's `cards` array
4. **Layout Updates**: Separate `updateDashboardLayout` mutation for drag/resize changes

### GraphQL Operations

Located in [route.ts](src/app/api/graphql/route.ts):

**Mutations:**
- `upsertCard(dashboardId, chartSpec, cardId?)`: Create or update a chart
- `deleteCard(dashboardId, cardId)`: Remove a chart from a dashboard
- `updateDashboardLayout(dashboardId, layout)`: Persist grid layout changes
- `createDashboard(...)`: Create a new dashboard
- `updateDashboard(...)`: Update dashboard metadata
- `deleteDashboard(id)`: Remove an entire dashboard

**Queries:**
- `GetDashboard(id)`: Fetch single dashboard with all cards and layout
- `GetDashboards`: Fetch user's dashboard list
- `ExecuteChart(chartSpec)`: Run a chart specification and return data

### Implementation Details

- **Current Storage**: In-memory arrays in the GraphQL resolver (mock data)
- **Layout Persistence**: Uses debounced updates (500ms delay) to avoid excessive API calls during drag/resize
- **Data Format**: ChartSpec stored as JSON, layout uses react-grid-layout format
- **Pre-loaded Data**: 7 sample dashboards with multiple chart cards for demonstration

### Future Production Considerations

The architecture uses GraphQL as an abstraction layer, making it straightforward to swap the in-memory storage for a persistent database (PostgreSQL, MongoDB, etc.) without changing the client-side code.
