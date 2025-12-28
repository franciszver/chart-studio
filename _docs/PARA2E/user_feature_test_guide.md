# Chart Studio Feature Test Guide

This guide walks you through testing each of the 10 implemented features to verify they work correctly.

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open http://localhost:3019 in your browser

---

## Design System

**Theme:** Dark mode inspired by Linear/Vercel/Raycast

| Element | Color |
|---------|-------|
| Background | `#0a0a0b` (deep black) |
| Cards | `#131316` (elevated dark gray) |
| Primary accent | `#8b5cf6` (violet) |
| Borders | `#27272a` (subtle gray) |
| Text | `#fafafa` (white) |
| Muted text | `#a1a1aa` (gray) |

**Chart Colors:** Violet, Cyan, Light violet, Amber, Emerald

---

## F1: Dashboard Reordering

**Location:** `/dashboards`

**How to Test:**
1. Navigate to the Dashboards page
2. Look for the drag handle (⋮⋮ icon) on the left side of each dashboard card
3. Click and hold the drag handle on any dashboard card
4. Drag the card to a new position in the grid
5. Release to drop

**Expected Behavior:**
- Cards smoothly animate to new positions
- Dragged card shows reduced opacity while dragging
- Order persists after page refresh (stored in localStorage)

**Verify Persistence:**
1. Reorder a few dashboards
2. Refresh the page (F5)
3. Dashboards should remain in the new order

---

## F2: Dark Theme Styling

**Location:** Global styling across all pages

**How to Test:**
1. Browse through different pages (Dashboards, Explorer, individual dashboards)
2. Observe the visual styling

**Expected Behavior:**
- Dark background (`#0a0a0b`) throughout the app
- Cards have subtle elevation (`#131316` background)
- Violet accent color (`#8b5cf6`) for primary actions and active states
- Clean, modern design with consistent color palette
- Subtle borders (`#27272a`) separating sections
- Charts pop with vibrant colors against dark background
- Professional, developer-focused appearance similar to Linear or Raycast

**Component-Specific Dark Theme:**
- **SQL Editor:** Dark background with syntax highlighting (purple keywords, green strings, yellow numbers, cyan operators)
- **Schema Browser:** Table/column names in white, types in muted gray, primary keys in amber, foreign keys in cyan
- **Results Table:** AG Grid with dark theme, dark header row, alternating row backgrounds
- **Dashboard Cards:** Dark card backgrounds with white text, muted descriptions
- **Chart Builder:** Dark drop shelves, violet highlights on drag-over

---

## F3: SQL Line Wrapping

**Location:** `/explorer`

**How to Test:**
1. Navigate to the Explorer page
2. Look for the "Wrap: Off" / "Wrap: On" toggle button in the top-right of the SQL editor
3. In the SQL Editor, type or paste a very long SQL query that exceeds the editor width
4. Toggle line wrapping on/off using the button or press `Alt+Z`

**Expected Behavior:**
- Toggle button switches between "Wrap: On" (violet) and "Wrap: Off" (gray)
- When enabled, long lines wrap to the next line instead of requiring horizontal scrolling
- Line numbers remain aligned with wrapped content
- Query remains fully readable without horizontal scrolling
- SQL editor has dark theme with syntax highlighting (purple keywords, green strings, yellow numbers)
- Preference persists after page refresh (stored in localStorage)

**Test Query:**
```sql
SELECT customer_id, customer_name, email_address, phone_number, street_address, city, state, postal_code, country FROM customers WHERE status = 'active' ORDER BY customer_name ASC LIMIT 100;
```

---

## F4: Table Sorting

**Location:** Any dashboard with a table chart, or Explorer results

**How to Test:**
1. Open a dashboard containing a table chart, or run a query in Explorer
2. Click on any column header in the table

**Expected Behavior:**
- First click: Sort ascending (▲ indicator appears)
- Second click: Sort descending (▼ indicator appears)
- Third click: Remove sort (neutral ⇅ indicator)
- Data rows reorder based on the sort
- Numeric columns sort numerically
- Text columns sort alphabetically

---

## F5: Table Column Reordering

**Location:** Any dashboard with a table chart

**How to Test:**
1. Open a dashboard containing a table chart
2. Look for the drag handle (⋮⋮) on the left of each column header
3. Click and hold the drag handle
4. Drag the column to a new position
5. Release to drop

**Expected Behavior:**
- Column headers can be dragged horizontally
- Column order updates in real-time
- Data columns follow header reordering
- Order persists after page refresh (saved to chart spec)

**Verify Persistence:**
1. Reorder columns
2. Navigate away and back to the dashboard
3. Column order should be preserved

---

## F6: Loading Spinner

**Location:** Initial page load and navigation

**How to Test:**

**Initial Load:**
1. Hard refresh the page (Ctrl+Shift+R)
2. Observe the loading state

**Navigation:**
1. Click on any navigation link (e.g., from Dashboards to Explorer)
2. Observe the transition

**Expected Behavior:**
- Skeleton placeholders appear during data fetch (dark muted rectangles)
- Smooth transition once content loads
- No layout shift when content appears
- Loading spinner uses violet primary color

---

## F7: Security Fixes

**Location:** `/explorer` SQL Editor

**How to Test:**
1. Navigate to the Explorer page
2. Try entering potentially dangerous SQL:

**Test Cases:**
```sql
-- Should be blocked:
DROP TABLE customers;
DELETE FROM orders;
INSERT INTO users VALUES ('hacker');
UPDATE accounts SET balance = 0;

-- Should work:
SELECT * FROM customers LIMIT 10;
```

**Expected Behavior:**
- Only SELECT statements are allowed
- DROP, DELETE, INSERT, UPDATE, ALTER, TRUNCATE are blocked
- Error toast appears when dangerous SQL is attempted
- Query does not execute for blocked statements

---

## F8: AI SQL Agent

**Location:** `/explorer` (top of SQL panel)

**How to Test:**
1. Navigate to the Explorer page
2. Find the "Ask AI" input field above the SQL editor
3. Type a natural language query
4. Click "Generate" or press Enter

**Test Queries:**
- "Show me all customers"
- "Total revenue by month"
- "Top 10 orders by amount"
- "Count of products by category"

**Expected Behavior:**
- SQL query is generated and populated in the editor
- Badge shows source: "AI" (OpenAI) or "Pattern" (fallback)
- Toast notification confirms generation
- Generated SQL is syntactically correct

**Note:** If OPENAI_API_KEY is not configured, the system uses pattern-based fallback which handles common query patterns.

---

## F9: Scatter Plot

**Location:** Dashboard chart creation/editing

**How to Test:**
1. Navigate to a dashboard (e.g., `/dashboards/1`)
2. Click the **edit (pencil) icon** on any existing chart card (e.g., "Pipeline by Stage")
3. In the Chart Type dropdown, change from "Bar Chart" to **"Scatter Plot"**
4. Notice that the X-Axis shelf clears (scatter plots require numeric X values, not categories)
5. In the **Data Source** dropdown, select **`deals`** table
6. Drag **`amount`** (DECIMAL) to the **X-Axis (Numeric)** shelf
7. Drag **`probability`** (DECIMAL) to the **Y-Axis (Numeric)** shelf
8. Optionally drag **`stage`** (VARCHAR) to the **Color By** shelf for grouping

**Step-by-Step with `deals` Table:**
| Step | Action | Field | Shelf |
|------|--------|-------|-------|
| 1 | Select data source | `deals` | - |
| 2 | Drag numeric field | `amount` | X-Axis (Numeric) |
| 3 | Drag numeric field | `probability` | Y-Axis (Numeric) |
| 4 | (Optional) Drag category | `stage` | Color By |

**Alternative Tables with Multiple Numeric Fields:**
- **`revenue_summary`**: Use `total_revenue` (X) and `avg_deal_size` (Y), optionally `deal_count`
- **`accounts`**: Use `id` (X) and `revenue` (Y)

**Expected Behavior:**
- Scatter plot renders with violet dots for each data point (8 data points total)
- X-Axis shows "amount" values ($18,000 to $125,000)
- Y-Axis shows "probability" values (0.20 to 1.00)
- Tooltip shows both values on hover (styled for dark theme with dark background)
- If Color By is set, points are colored by stage (Prospecting, Qualification, Proposal, Negotiation, Closed Won)
- Grid lines use theme border color

**Important Notes:**
- Scatter plots require **numeric fields for both X and Y axes**
- When switching from Bar/Line to Scatter, the X-axis clears because bar/line X-axes typically use string fields
- The shelves show "(Numeric)" hint to indicate they only accept numeric fields

**Editing Existing Charts:**
- Click the edit (pencil) icon on any dashboard card
- The chart builder loads with the existing configuration pre-populated
- Static demo charts (Revenue, Pipeline, AR Aging, Top Accounts) are editable
- Changes can be saved back to the dashboard

**Sample Spec Structure:**
```json
{
  "type": "scatter",
  "data": {
    "source": "deals",
    "measures": [
      { "field": "amount", "aggregate": "sum" },
      { "field": "probability", "aggregate": "sum" }
    ]
  },
  "encodings": {
    "x": { "field": "amount" },
    "y": { "field": "probability" },
    "series": { "field": "stage" }
  }
}
```

---

## F10: Dashboard Folders

**Location:** `/dashboards`

**How to Test:**

**Create Folder:**
1. Click "New Folder" button in the top right (outline style button)
2. A new folder appears with name "New Folder"

**Rename Folder:**
1. Hover over a folder header
2. Click the pencil icon
3. Type a new name
4. Press Enter or click the checkmark

**Add Dashboard to Folder:**
1. Drag a dashboard card by its handle
2. Drop it onto a folder (folder highlights with violet border when dragging over)
3. Dashboard moves into the folder

**Expand/Collapse Folder:**
1. Click the caret icon (▶/▼) on the folder header
2. Folder content shows/hides

**Delete Folder:**
1. Hover over a folder header
2. Click the trash icon
3. Folder is deleted, dashboards return to root

**Expected Behavior:**
- Folders persist after page refresh (localStorage)
- Dashboards inside folders show in a grid when expanded
- Empty folders show "Drag dashboards here" message
- Folder count shows number of dashboards inside
- Folder header has subtle dark background (`bg-secondary/50`)

---

## Quick Verification Checklist

| Feature | Test Action | Pass |
|---------|-------------|------|
| F1 Dashboard Reorder | Drag dashboard cards | [ ] |
| F2 Dark Theme | Visual inspection | [ ] |
| F3 SQL Wrap | Long query in editor | [ ] |
| F4 Table Sort | Click column headers | [ ] |
| F5 Column Reorder | Drag table columns | [ ] |
| F6 Loading | Refresh/navigate | [ ] |
| F7 Security | Try DROP TABLE | [ ] |
| F8 AI SQL | "Show all customers" | [ ] |
| F9 Scatter Plot | View scatter chart | [ ] |
| F10 Folders | Create/use folder | [ ] |

---

## Troubleshooting

**Features not working?**
1. Clear localStorage: Open DevTools > Application > Local Storage > Clear
2. Hard refresh: Ctrl+Shift+R
3. Check console for errors: F12 > Console tab

**AI SQL not using OpenAI?**
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- The system gracefully falls back to pattern matching if not configured

**Drag and drop not working?**
- Ensure you're clicking the drag handle (⋮⋮), not the card itself
- Try with a mouse instead of trackpad for better precision

**Theme looks wrong?**
- The app uses a dark theme by default (no toggle)
- If you see light backgrounds, try a hard refresh (Ctrl+Shift+R)
- Check that globals.css was properly loaded
