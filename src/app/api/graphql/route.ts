import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'

// Mock schema metadata
const MOCK_SCHEMA_METADATA = {
  tables: [
    {
      name: 'customers',
      type: 'table',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'name', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'email', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'phone', type: 'VARCHAR(20)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: 'accounts',
      type: 'table',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'customer_id', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'customers', referencedColumn: 'id' },
        { name: 'account_name', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'industry', type: 'VARCHAR(100)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'revenue', type: 'DECIMAL(12,2)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: 'deals',
      type: 'table',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'account_id', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'accounts', referencedColumn: 'id' },
        { name: 'deal_name', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'stage', type: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'amount', type: 'DECIMAL(12,2)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'probability', type: 'DECIMAL(3,2)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'close_date', type: 'DATE', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: 'contacts',
      type: 'table',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'account_id', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'accounts', referencedColumn: 'id' },
        { name: 'first_name', type: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'last_name', type: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'email', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'title', type: 'VARCHAR(100)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: 'sales_activities',
      type: 'table',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'deal_id', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: true, referencedTable: 'deals', referencedColumn: 'id' },
        { name: 'contact_id', type: 'INTEGER', nullable: true, isPrimaryKey: false, isForeignKey: true, referencedTable: 'contacts', referencedColumn: 'id' },
        { name: 'activity_type', type: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'subject', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'notes', type: 'TEXT', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'activity_date', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: 'revenue_summary',
      type: 'view',
      columns: [
        { name: 'month', type: 'DATE', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'total_revenue', type: 'DECIMAL(15,2)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'deal_count', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'avg_deal_size', type: 'DECIMAL(12,2)', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
}

// Mock data
const dashboards: any[] = [
  {
    id: '1',
    name: 'Sales Performance',
    description: 'KPIs by rep, team, and time period',
    category: 'Sales & Performance',
    lastModified: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-10T09:00:00Z',
    order: 0,
    layout: [
      { i: 'revenue-chart', x: 0, y: 0, w: 6, h: 4 },
      { i: 'pipeline-chart', x: 6, y: 0, w: 6, h: 4 },
      { i: 'ar-aging-chart', x: 0, y: 4, w: 6, h: 4 },
      { i: 'top-accounts-table', x: 6, y: 4, w: 6, h: 4 },
    ],
    cards: [
      {
        id: 'revenue-chart',
        chartSpec: {
          v: 1,
          type: 'line',
          data: {
            source: 'sales_revenue',
            dimensions: [{ field: 'month' }, { field: 'lead_source' }],
            measures: [{ field: 'revenue', aggregate: 'sum', label: 'Revenue' }],
          },
          encodings: {
            x: { field: 'month' },
            y: { field: 'revenue', aggregate: 'sum', label: 'Revenue' },
            series: { field: 'lead_source' },
            smooth: true,
          },
          options: {
            title: 'Revenue by Month',
            subtitle: 'Track revenue trends across different lead sources over time to identify seasonal patterns and channel performance.',
            legend: 'bottom',
            height: 240,
          },
        },
      },
      {
        id: 'pipeline-chart',
        chartSpec: {
          v: 1,
          type: 'bar',
          data: {
            source: 'pipeline_stages',
            dimensions: [{ field: 'stage' }],
            measures: [{ field: 'amount', aggregate: 'sum' }],
          },
          encodings: {
            x: { field: 'stage' },
            y: { field: 'amount', aggregate: 'sum' },
          },
          options: {
            title: 'Pipeline by Stage',
            subtitle: 'Visualize deal progression through your sales pipeline to identify bottlenecks and conversion opportunities.',
            height: 240,
          },
        },
      },
      {
        id: 'ar-aging-chart',
        chartSpec: {
          v: 1,
          type: 'pie',
          data: {
            source: 'ar_aging',
            dimensions: [{ field: 'aging_bucket' }],
            measures: [{ field: 'amount_due', aggregate: 'sum' }],
          },
          encodings: {
            series: { field: 'aging_bucket' },
            y: { field: 'amount_due', aggregate: 'sum' },
          },
          options: {
            title: 'A/R by Aging',
            subtitle: 'Monitor outstanding receivables by aging buckets to manage cash flow and identify collection priorities.',
            legend: 'right',
            height: 240,
          },
        },
      },
      {
        id: 'top-accounts-table',
        chartSpec: {
          v: 1,
          type: 'table',
          data: {
            source: 'top_accounts',
            dimensions: [{ field: 'account_name' }],
            measures: [{ field: 'revenue_90d', aggregate: 'sum', label: 'Revenue (90d)' }],
          },
          encodings: {},
          options: {
            title: 'Top Accounts',
            subtitle: 'Review your highest-value customer accounts by 90-day revenue to focus retention and growth efforts.',
          },
        },
      },
    ],
  },
  {
    id: '2',
    name: 'Company Performance',
    description: 'Multi-office and branch rollups',
    category: 'Sales & Performance',
    lastModified: '2024-01-14T14:20:00Z',
    createdAt: '2024-01-08T11:15:00Z',
    order: 1,
    layout: [
      { i: 'company-revenue-chart', x: 0, y: 0, w: 6, h: 4 },
      { i: 'office-performance-chart', x: 6, y: 0, w: 6, h: 4 },
      { i: 'branch-comparison-chart', x: 0, y: 4, w: 6, h: 4 },
      { i: 'performance-metrics-table', x: 6, y: 4, w: 6, h: 4 },
    ],
    cards: [
      {
        id: 'company-revenue-chart',
        chartSpec: {
          v: 1,
          type: 'line',
          data: {
            source: 'sales_revenue',
            dimensions: [{ field: 'month' }],
            measures: [{ field: 'revenue', aggregate: 'sum', label: 'Revenue' }],
          },
          encodings: {
            x: { field: 'month' },
            y: { field: 'revenue' },
          },
          options: {
            title: 'Company Revenue Trend',
            subtitle: 'Monthly revenue across all offices',
            height: 300,
          },
        },
      },
      {
        id: 'office-performance-chart',
        chartSpec: {
          v: 1,
          type: 'bar',
          data: {
            source: 'deals_by_stage',
            dimensions: [{ field: 'stage' }],
            measures: [{ field: 'count', aggregate: 'sum', label: 'Deals' }],
          },
          encodings: {
            x: { field: 'stage' },
            y: { field: 'count' },
          },
          options: {
            title: 'Office Performance',
            subtitle: 'Deal distribution by stage across offices',
            height: 300,
          },
        },
      },
      {
        id: 'branch-comparison-chart',
        chartSpec: {
          v: 1,
          type: 'pie',
          data: {
            source: 'ar_aging',
            dimensions: [{ field: 'age_bucket' }],
            measures: [{ field: 'amount', aggregate: 'sum', label: 'Amount' }],
          },
          encodings: {
            category: { field: 'age_bucket' },
            value: { field: 'amount' },
          },
          options: {
            title: 'Branch Comparison',
            subtitle: 'Revenue distribution by branch',
            height: 300,
          },
        },
      },
      {
        id: 'performance-metrics-table',
        chartSpec: {
          v: 1,
          type: 'table',
          data: {
            source: 'top_accounts',
            dimensions: [
              { field: 'account', label: 'Office' },
              { field: 'contact', label: 'Manager' },
            ],
            measures: [
              { field: 'revenue', aggregate: 'sum', label: 'Revenue' },
              { field: 'deals', aggregate: 'count', label: 'Deals' },
            ],
          },
          options: {
            title: 'Performance Metrics',
            subtitle: 'Key metrics by office',
            height: 300,
          },
        },
      },
    ],
  },
  {
    id: '3',
    name: 'Accounts Receivable',
    description: 'Outstanding balances and aging',
    category: 'Financial',
    lastModified: '2024-01-13T16:45:00Z',
    createdAt: '2024-01-05T13:30:00Z',
    order: 2,
    layout: [
      { i: 'ar-aging-chart', x: 0, y: 0, w: 6, h: 4 },
      { i: 'overdue-accounts-chart', x: 6, y: 0, w: 6, h: 4 },
      { i: 'collection-trend-chart', x: 0, y: 4, w: 6, h: 4 },
      { i: 'outstanding-balances-table', x: 6, y: 4, w: 6, h: 4 },
    ],
    cards: [
      {
        id: 'ar-aging-chart',
        chartSpec: {
          v: 1,
          type: 'pie',
          data: {
            source: 'ar_aging',
            dimensions: [{ field: 'age_bucket' }],
            measures: [{ field: 'amount', aggregate: 'sum', label: 'Amount' }],
          },
          encodings: {
            category: { field: 'age_bucket' },
            value: { field: 'amount' },
          },
          options: {
            title: 'A/R by Aging',
            subtitle: 'Outstanding balances by age bucket',
            height: 300,
          },
        },
      },
      {
        id: 'overdue-accounts-chart',
        chartSpec: {
          v: 1,
          type: 'bar',
          data: {
            source: 'deals_by_stage',
            dimensions: [{ field: 'stage' }],
            measures: [{ field: 'count', aggregate: 'sum', label: 'Overdue Count' }],
          },
          encodings: {
            x: { field: 'stage' },
            y: { field: 'count' },
          },
          options: {
            title: 'Overdue Accounts',
            subtitle: 'Accounts past due by category',
            height: 300,
          },
        },
      },
      {
        id: 'collection-trend-chart',
        chartSpec: {
          v: 1,
          type: 'line',
          data: {
            source: 'sales_revenue',
            dimensions: [{ field: 'month' }],
            measures: [{ field: 'revenue', aggregate: 'sum', label: 'Collections' }],
          },
          encodings: {
            x: { field: 'month' },
            y: { field: 'revenue' },
          },
          options: {
            title: 'Collection Trend',
            subtitle: 'Monthly collection performance',
            height: 300,
          },
        },
      },
      {
        id: 'outstanding-balances-table',
        chartSpec: {
          v: 1,
          type: 'table',
          data: {
            source: 'top_accounts',
            dimensions: [
              { field: 'account', label: 'Customer' },
              { field: 'contact', label: 'Contact' },
            ],
            measures: [
              { field: 'revenue', aggregate: 'sum', label: 'Outstanding' },
              { field: 'deals', aggregate: 'count', label: 'Days Overdue' },
            ],
          },
          options: {
            title: 'Outstanding Balances',
            subtitle: 'Top overdue accounts',
            height: 300,
          },
        },
      },
    ],
  },
  {
    id: '4',
    name: 'Commission Report',
    description: 'Rep earnings and payout logic',
    category: 'Financial',
    lastModified: '2024-01-12T09:15:00Z',
    createdAt: '2024-01-03T15:20:00Z',
    order: 3,
    layout: [
      { i: 'commission-table', x: 0, y: 0, w: 6, h: 4 },
      { i: 'commission-trend-chart', x: 6, y: 0, w: 6, h: 4 },
      { i: 'rep-performance-chart', x: 0, y: 4, w: 6, h: 4 },
      { i: 'payout-breakdown-chart', x: 6, y: 4, w: 6, h: 4 },
    ],
    cards: [
      {
        id: 'commission-table',
        chartSpec: {
          v: 1,
          type: 'table',
          data: {
            source: 'top_accounts',
            dimensions: [
              { field: 'account', label: 'Rep Name' },
              { field: 'contact', label: 'Territory' },
            ],
            measures: [
              { field: 'deals', aggregate: 'count', label: 'Deals' },
              { field: 'revenue', aggregate: 'sum', label: 'Commission' },
            ],
          },
          options: {
            title: 'Commission by Rep',
            subtitle: 'Individual rep performance and earnings',
            height: 300,
          },
        },
      },
      {
        id: 'commission-trend-chart',
        chartSpec: {
          v: 1,
          type: 'line',
          data: {
            source: 'sales_revenue',
            dimensions: [{ field: 'month' }],
            measures: [{ field: 'revenue', aggregate: 'sum', label: 'Commission' }],
          },
          encodings: {
            x: { field: 'month' },
            y: { field: 'revenue' },
          },
          options: {
            title: 'Commission Trend',
            subtitle: 'Monthly commission payouts',
            height: 300,
          },
        },
      },
      {
        id: 'rep-performance-chart',
        chartSpec: {
          v: 1,
          type: 'bar',
          data: {
            source: 'deals_by_stage',
            dimensions: [{ field: 'stage' }],
            measures: [{ field: 'count', aggregate: 'sum', label: 'Performance Score' }],
          },
          encodings: {
            x: { field: 'stage' },
            y: { field: 'count' },
          },
          options: {
            title: 'Rep Performance',
            subtitle: 'Performance metrics by rep tier',
            height: 300,
          },
        },
      },
      {
        id: 'payout-breakdown-chart',
        chartSpec: {
          v: 1,
          type: 'pie',
          data: {
            source: 'ar_aging',
            dimensions: [{ field: 'age_bucket' }],
            measures: [{ field: 'amount', aggregate: 'sum', label: 'Payout Amount' }],
          },
          encodings: {
            category: { field: 'age_bucket' },
            value: { field: 'amount' },
          },
          options: {
            title: 'Payout Breakdown',
            subtitle: 'Commission distribution by type',
            height: 300,
          },
        },
      },
    ],
  },
  {
    id: '5',
    name: 'Work Order Report',
    description: 'Job status tracking and progress',
    category: 'Operations',
    lastModified: '2024-01-11T12:30:00Z',
    createdAt: '2024-01-02T10:45:00Z',
    order: 4,
    layout: [
      { i: 'work-orders-bar', x: 0, y: 0, w: 12, h: 4 },
    ],
    cards: [
      {
        id: 'work-orders-bar',
        chartSpec: {
          v: 1,
          type: 'bar',
          data: {
            source: 'work_orders',
            dimensions: [{ field: 'status' }],
            measures: [{ field: 'count', aggregate: 'count' }],
          },
          encodings: {
            x: { field: 'status' },
            y: { field: 'count', aggregate: 'count' },
          },
          options: {
            title: 'Work Orders by Status',
            height: 240,
          },
        },
      },
    ],
  },
  {
    id: '6',
    name: 'User Activity Report',
    description: 'Audit log and app usage analytics',
    category: 'Administrative',
    lastModified: '2024-01-10T08:20:00Z',
    createdAt: '2023-12-28T14:10:00Z',
    order: 5,
    layout: [
      { i: 'user-activity-table', x: 0, y: 0, w: 12, h: 4 },
    ],
    cards: [
      {
        id: 'user-activity-table',
        chartSpec: {
          v: 1,
          type: 'table',
          data: {
            source: 'user_activity',
            dimensions: [{ field: 'user_name' }, { field: 'action' }],
            measures: [{ field: 'timestamp', label: 'Last Activity' }],
          },
          encodings: {},
          options: {
            title: 'Recent User Activity',
          },
        },
      },
    ],
  },
  {
    id: '7',
    name: 'Custom Dashboard',
    description: 'User-created custom dashboard',
    category: 'Custom',
    lastModified: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    order: 6,
    layout: [],
    cards: [],
  },
]

// Mock chart data
const MOCK_CHART_DATA = {
  // Data for the 'accounts' table from schema
  accounts: [
    { id: 1, customer_id: 101, account_name: 'Acme Corp', industry: 'Technology', revenue: 125000, created_at: '2024-01-15' },
    { id: 2, customer_id: 102, account_name: 'TechStart Inc', industry: 'Software', revenue: 89000, created_at: '2024-01-20' },
    { id: 3, customer_id: 103, account_name: 'Global Solutions', industry: 'Consulting', revenue: 156000, created_at: '2024-02-01' },
    { id: 4, customer_id: 104, account_name: 'Innovation Labs', industry: 'Technology', revenue: 67000, created_at: '2024-02-10' },
    { id: 5, customer_id: 105, account_name: 'Future Systems', industry: 'Healthcare', revenue: 234000, created_at: '2024-02-15' },
    { id: 6, customer_id: 106, account_name: 'DataCorp', industry: 'Finance', revenue: 78000, created_at: '2024-03-01' },
    { id: 7, customer_id: 107, account_name: 'CloudTech', industry: 'Technology', revenue: 145000, created_at: '2024-03-05' },
    { id: 8, customer_id: 108, account_name: 'MedTech Solutions', industry: 'Healthcare', revenue: 198000, created_at: '2024-03-10' },
  ],
  // Data for other tables
  customers: [
    { id: 101, name: 'John Smith', email: 'john@acme.com', phone: '555-0101', created_at: '2024-01-15' },
    { id: 102, name: 'Sarah Johnson', email: 'sarah@techstart.com', phone: '555-0102', created_at: '2024-01-20' },
    { id: 103, name: 'Mike Wilson', email: 'mike@global.com', phone: '555-0103', created_at: '2024-02-01' },
    { id: 104, name: 'Lisa Chen', email: 'lisa@innovation.com', phone: '555-0104', created_at: '2024-02-10' },
    { id: 105, name: 'David Brown', email: 'david@future.com', phone: '555-0105', created_at: '2024-02-15' },
  ],
  deals: [
    { id: 1, account_id: 1, title: 'Enterprise Software License', value: 50000, stage: 'Closed Won', created_at: '2024-01-20' },
    { id: 2, account_id: 2, title: 'Cloud Migration Project', value: 75000, stage: 'Negotiation', created_at: '2024-02-01' },
    { id: 3, account_id: 3, title: 'Consulting Services', value: 120000, stage: 'Proposal', created_at: '2024-02-15' },
    { id: 4, account_id: 4, title: 'Development Platform', value: 25000, stage: 'Qualification', created_at: '2024-03-01' },
    { id: 5, account_id: 5, title: 'Healthcare Analytics', value: 200000, stage: 'Prospecting', created_at: '2024-03-10' },
  ],
  // Legacy data (keeping for existing dashboards)
  sales_revenue: [
    { month: 'Jan', revenue: 45000, lead_source: 'Website' },
    { month: 'Feb', revenue: 52000, lead_source: 'Website' },
    { month: 'Mar', revenue: 48000, lead_source: 'Website' },
    { month: 'Apr', revenue: 61000, lead_source: 'Website' },
    { month: 'Jan', revenue: 32000, lead_source: 'Referral' },
    { month: 'Feb', revenue: 38000, lead_source: 'Referral' },
    { month: 'Mar', revenue: 35000, lead_source: 'Referral' },
    { month: 'Apr', revenue: 42000, lead_source: 'Referral' },
  ],
  pipeline_stages: [
    { stage: 'Prospecting', amount: 125000 },
    { stage: 'Qualification', amount: 89000 },
    { stage: 'Proposal', amount: 156000 },
    { stage: 'Negotiation', amount: 67000 },
    { stage: 'Closed Won', amount: 234000 },
  ],
  ar_aging: [
    { aging_bucket: '0-30 days', amount_due: 45000 },
    { aging_bucket: '31-60 days', amount_due: 23000 },
    { aging_bucket: '61-90 days', amount_due: 12000 },
    { aging_bucket: '90+ days', amount_due: 8000 },
  ],
  top_accounts: [
    { account_name: 'Acme Corp', revenue_90d: 89000 },
    { account_name: 'TechStart Inc', revenue_90d: 76000 },
    { account_name: 'Global Solutions', revenue_90d: 65000 },
    { account_name: 'Innovation Labs', revenue_90d: 54000 },
    { account_name: 'Future Systems', revenue_90d: 43000 },
  ],
  commission_data: [
    { rep_name: 'John Smith', commission: 12500 },
    { rep_name: 'Sarah Johnson', commission: 15200 },
    { rep_name: 'Mike Davis', commission: 9800 },
    { rep_name: 'Emily Chen', commission: 14600 },
  ],
  work_orders: [
    { status: 'Pending', count: 25 },
    { status: 'In Progress', count: 45 },
    { status: 'Completed', count: 120 },
    { status: 'Cancelled', count: 8 },
  ],
  user_activity: [
    { user_name: 'John Smith', action: 'Login', timestamp: '2024-01-15 09:30:00' },
    { user_name: 'Sarah Johnson', action: 'Create Report', timestamp: '2024-01-15 10:15:00' },
    { user_name: 'Mike Davis', action: 'Update Dashboard', timestamp: '2024-01-15 11:20:00' },
    { user_name: 'Emily Chen', action: 'Export Data', timestamp: '2024-01-15 14:45:00' },
  ],
}

const typeDefs = gql`
  scalar JSON

  type Card {
    id: ID!
    chartSpec: JSON!
  }

  type Dashboard {
    id: ID!
    name: String!
    description: String
    category: String!
    lastModified: String!
    createdAt: String!
    layout: JSON
    cards: [Card!]
    order: Int!
  }

  type ChartExecutionMeta {
    rowCount: Int!
    durationMs: Int!
  }

  type ChartExecutionResult {
    rows: [JSON!]!
    meta: ChartExecutionMeta!
  }

  type ColumnMetadata {
    name: String!
    type: String!
    nullable: Boolean!
    isPrimaryKey: Boolean!
    isForeignKey: Boolean!
    referencedTable: String
    referencedColumn: String
  }

  type TableMetadata {
    name: String!
    type: String!
    columns: [ColumnMetadata!]!
  }

  type SchemaMetadata {
    tables: [TableMetadata!]!
  }

  input CreateDashboardInput {
    name: String!
    description: String
    category: String!
  }

  input UpdateDashboardInput {
    name: String
    description: String
    category: String
  }

  input DashboardOrderInput {
    id: ID!
    order: Int!
  }

  type Query {
    dashboards: [Dashboard!]!
    dashboard(id: ID!): Dashboard
    executeChart(spec: JSON!): ChartExecutionResult!
    getSchemaMetadata: SchemaMetadata!
  }

  type SqlExecutionResult {
    runId: ID!
    columns: [String!]!
    rows: [JSON!]!
    rowCount: Int!
    executionTimeMs: Int!
    status: String!
  }

  type Mutation {
    createDashboard(input: CreateDashboardInput!): Dashboard!
    updateDashboard(id: ID!, input: UpdateDashboardInput!): Dashboard!
    updateDashboardLayout(id: ID!, layout: JSON!): Dashboard!
    updateDashboardsOrder(order: [DashboardOrderInput!]!): [Dashboard!]!
    duplicateDashboard(id: ID!): Dashboard!
    deleteDashboard(id: ID!): Boolean!
    upsertCard(dashboardId: ID!, cardId: ID, chartSpec: JSON!): Card!
    deleteCard(dashboardId: ID!, cardId: ID!): Boolean!
    executeSql(sql: String!): SqlExecutionResult!
    cancelQuery(runId: ID!): Boolean!
  }
`

const resolvers = {
  JSON: {
    __serialize: (value: any) => value,
    __parseValue: (value: any) => value,
    __parseLiteral: (ast: any) => ast.value,
  },
  Query: {
    dashboards: () => [...dashboards].sort((a, b) => a.order - b.order),
    dashboard: (_: any, { id }: { id: string }) => 
      dashboards.find(dashboard => dashboard.id === id),
    executeChart: (_: any, { spec }: { spec: any }) => {
      const startTime = Date.now()
      
      // Get mock data based on the spec's data source
      const source = spec.data?.source
      const mockData = MOCK_CHART_DATA[source as keyof typeof MOCK_CHART_DATA] || []
      
      // Simulate processing time
      const durationMs = Date.now() - startTime + Math.floor(Math.random() * 100) + 50
      
      return {
        rows: mockData,
        meta: {
          rowCount: mockData.length,
          durationMs,
        }
      }
    },
    getSchemaMetadata: () => {
      // Simulate network delay
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('🗄️ Returning schema metadata with tables:', MOCK_SCHEMA_METADATA.tables.map(t => ({
            name: t.name,
            columnCount: t.columns.length,
            columns: t.columns.map(c => c.name)
          })))
          resolve(MOCK_SCHEMA_METADATA)
        }, 100)
      })
    },
  },
  Mutation: {
    createDashboard: (_: any, { input }: { input: any }) => {
      const maxOrder = dashboards.length > 0 ? Math.max(...dashboards.map(d => d.order)) : -1
      const newDashboard = {
        id: String(dashboards.length + 1),
        name: input.name,
        description: input.description || '',
        category: input.category,
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        order: maxOrder + 1,
        layout: [],
        cards: [],
      }
      dashboards.push(newDashboard)
      return newDashboard
    },
    updateDashboard: (_: any, { id, input }: { id: string; input: any }) => {
      const dashboardIndex = dashboards.findIndex(d => d.id === id)
      if (dashboardIndex === -1) throw new Error('Dashboard not found')
      
      const updatedDashboard = {
        ...dashboards[dashboardIndex],
        ...input,
        lastModified: new Date().toISOString(),
      }
      dashboards[dashboardIndex] = updatedDashboard
      return updatedDashboard
    },
    updateDashboardLayout: (_: any, { id, layout }: { id: string; layout: any }) => {
      const dashboardIndex = dashboards.findIndex(d => d.id === id)
      if (dashboardIndex === -1) throw new Error('Dashboard not found')

      const updatedDashboard = {
        ...dashboards[dashboardIndex],
        layout,
        lastModified: new Date().toISOString(),
      }
      dashboards[dashboardIndex] = updatedDashboard
      return updatedDashboard
    },
    updateDashboardsOrder: (_: any, { order }: { order: Array<{ id: string; order: number }> }) => {
      const updatedDashboards: any[] = []
      for (const item of order) {
        const dashboardIndex = dashboards.findIndex(d => d.id === item.id)
        if (dashboardIndex !== -1) {
          dashboards[dashboardIndex] = {
            ...dashboards[dashboardIndex],
            order: item.order,
            lastModified: new Date().toISOString(),
          }
          updatedDashboards.push(dashboards[dashboardIndex])
        }
      }
      return updatedDashboards
    },
    duplicateDashboard: (_: any, { id }: { id: string }) => {
      const originalDashboard = dashboards.find(d => d.id === id)
      if (!originalDashboard) throw new Error('Dashboard not found')

      const maxOrder = dashboards.length > 0 ? Math.max(...dashboards.map(d => d.order)) : -1
      const duplicatedDashboard = {
        ...originalDashboard,
        id: String(dashboards.length + 1),
        name: `${originalDashboard.name} (Copy)`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        order: maxOrder + 1,
      }
      dashboards.push(duplicatedDashboard)
      return duplicatedDashboard
    },
    deleteDashboard: (_: any, { id }: { id: string }) => {
      const dashboardIndex = dashboards.findIndex(d => d.id === id)
      if (dashboardIndex === -1) return false
      
      dashboards.splice(dashboardIndex, 1)
      return true
    },
    executeSql: async (_: any, { sql }: { sql: string }) => {
      const startTime = Date.now()
      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))
      
      // Parse and validate the SQL query
      const trimmedSql = sql.trim()
      
      // Remove comments and check if query is empty
      const sqlWithoutComments = trimmedSql
        .split('\n')
        .map(line => line.replace(/--.*$/, '').trim())
        .filter(line => line.length > 0)
        .join(' ')
        .trim()
      
      // Handle empty queries
      if (!trimmedSql || !sqlWithoutComments) {
        return {
          runId,
          columns: ['error'],
          rows: [{ error: 'Empty query - please enter a SQL statement' }],
          rowCount: 1,
          executionTimeMs: Date.now() - startTime,
          status: 'error'
        }
      }
      
      // Basic SQL parsing (use cleaned SQL without comments)
      const lowerSql = sqlWithoutComments.toLowerCase()
      const sqlWords = lowerSql.split(/\s+/)
      
      // Mock data for different tables
      const mockTables = {
        customers: {
          columns: ['id', 'first_name', 'last_name', 'email', 'company', 'created_at'],
          rows: [
            { id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@acme.com', company: 'Acme Corp', created_at: '2023-01-15' },
            { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@globalinc.com', company: 'Global Inc', created_at: '2023-02-20' },
            { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike.j@techsol.com', company: 'Tech Solutions', created_at: '2023-03-10' },
            { id: 4, first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@innovate.com', company: 'Innovate LLC', created_at: '2023-04-05' },
          ]
        },
        accounts: {
          columns: ['id', 'customer_id', 'account_name', 'industry', 'annual_revenue', 'employees'],
          rows: [
            { id: 1, customer_id: 1, account_name: 'Acme Corp', industry: 'Technology', annual_revenue: 2500000, employees: 150 },
            { id: 2, customer_id: 2, account_name: 'Global Inc', industry: 'Finance', annual_revenue: 5200000, employees: 320 },
            { id: 3, customer_id: 3, account_name: 'Tech Solutions', industry: 'Technology', annual_revenue: 890000, employees: 45 },
            { id: 4, customer_id: 4, account_name: 'Innovate LLC', industry: 'Healthcare', annual_revenue: 1200000, employees: 85 },
          ]
        },
        deals: {
          columns: ['id', 'account_id', 'deal_name', 'stage', 'amount', 'close_date', 'probability'],
          rows: [
            { id: 1, account_id: 1, deal_name: 'Q1 Enterprise Deal', stage: 'closed_won', amount: 125000, close_date: '2024-03-15', probability: 100 },
            { id: 2, account_id: 2, deal_name: 'Service Contract Renewal', stage: 'negotiation', amount: 89000, close_date: '2024-04-30', probability: 75 },
            { id: 3, account_id: 1, deal_name: 'Additional Licenses', stage: 'proposal', amount: 45000, close_date: '2024-05-15', probability: 60 },
            { id: 4, account_id: 3, deal_name: 'Consulting Engagement', stage: 'qualified', amount: 28000, close_date: '2024-06-01', probability: 40 },
            { id: 5, account_id: 4, deal_name: 'Platform Migration', stage: 'prospecting', amount: 75000, close_date: '2024-07-01', probability: 20 },
          ]
        },
        contacts: {
          columns: ['id', 'account_id', 'first_name', 'last_name', 'email', 'phone', 'title'],
          rows: [
            { id: 1, account_id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@acme.com', phone: '555-0101', title: 'CTO' },
            { id: 2, account_id: 1, first_name: 'Alice', last_name: 'Brown', email: 'alice.brown@acme.com', phone: '555-0102', title: 'VP Engineering' },
            { id: 3, account_id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@globalinc.com', phone: '555-0201', title: 'CFO' },
            { id: 4, account_id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike.j@techsol.com', phone: '555-0301', title: 'CEO' },
          ]
        },
        sales_activities: {
          columns: ['id', 'deal_id', 'contact_id', 'activity_type', 'activity_date', 'notes'],
          rows: [
            { id: 1, deal_id: 1, contact_id: 1, activity_type: 'call', activity_date: '2024-01-15', notes: 'Initial discovery call' },
            { id: 2, deal_id: 1, contact_id: 2, activity_type: 'meeting', activity_date: '2024-01-20', notes: 'Technical requirements review' },
            { id: 3, deal_id: 2, contact_id: 3, activity_type: 'email', activity_date: '2024-01-25', notes: 'Sent proposal document' },
            { id: 4, deal_id: 3, contact_id: 1, activity_type: 'call', activity_date: '2024-02-01', notes: 'Follow-up on additional licenses' },
          ]
        },
        revenue_summary: {
          columns: ['month', 'total_revenue', 'new_business', 'renewals', 'deals_closed'],
          rows: [
            { month: '2024-01', total_revenue: 450000, new_business: 280000, renewals: 170000, deals_closed: 8 },
            { month: '2024-02', total_revenue: 520000, new_business: 310000, renewals: 210000, deals_closed: 12 },
            { month: '2024-03', total_revenue: 380000, new_business: 200000, renewals: 180000, deals_closed: 6 },
            { month: '2024-04', total_revenue: 625000, new_business: 425000, renewals: 200000, deals_closed: 15 },
          ]
        }
      }
      
      // Determine which table is being queried
      let targetTable = null
      let selectedColumns = ['*']
      
      // Extract table name from FROM clause
      const fromMatch = lowerSql.match(/from\s+(\w+)/i)
      if (fromMatch) {
        targetTable = fromMatch[1]
      }
      
      // Extract selected columns (basic parsing)
      const selectMatch = trimmedSql.match(/select\s+(.*?)\s+from/i)
      if (selectMatch) {
        const columnsStr = selectMatch[1].trim()
        if (columnsStr !== '*') {
          selectedColumns = columnsStr.split(',').map(col => col.trim().replace(/`|"/g, ''))
        }
      }
      
      // Handle aggregate functions
      const isCountQuery = lowerSql.includes('count(')
      const isSumQuery = lowerSql.includes('sum(')
      const isAvgQuery = lowerSql.includes('avg(')
      
      if (isCountQuery || isSumQuery || isAvgQuery) {
        let aggregateResult = { count: 42 }
        
        if (targetTable && mockTables[targetTable]) {
          const rowCount = mockTables[targetTable].rows.length
          aggregateResult = { count: rowCount }
          
          if (isSumQuery) {
            const sumMatch = lowerSql.match(/sum\((\w+)\)/i)
            if (sumMatch && targetTable === 'deals') {
              const totalAmount = mockTables.deals.rows.reduce((sum, row) => sum + (row.amount || 0), 0)
              aggregateResult = { [`sum_${sumMatch[1]}`]: totalAmount }
            }
          }
          
          if (isAvgQuery) {
            const avgMatch = lowerSql.match(/avg\((\w+)\)/i)
            if (avgMatch && targetTable === 'deals') {
              const totalAmount = mockTables.deals.rows.reduce((sum, row) => sum + (row.amount || 0), 0)
              const avgAmount = totalAmount / mockTables.deals.rows.length
              aggregateResult = { [`avg_${avgMatch[1]}`]: Math.round(avgAmount) }
            }
          }
        }
        
        return {
          runId,
          columns: Object.keys(aggregateResult),
          rows: [aggregateResult],
          rowCount: 1,
          executionTimeMs: Date.now() - startTime,
          status: 'completed'
        }
      }
      
      // Handle table queries
      if (targetTable && mockTables[targetTable]) {
        const tableData = mockTables[targetTable]
        let resultColumns = tableData.columns
        let resultRows = tableData.rows
        
        // Filter columns if specific ones were selected
        if (selectedColumns[0] !== '*') {
          resultColumns = selectedColumns.filter(col => tableData.columns.includes(col))
          resultRows = resultRows.map(row => {
            const filteredRow = {}
            resultColumns.forEach(col => {
              filteredRow[col] = row[col]
            })
            return filteredRow
          })
        }
        
        // Apply basic WHERE filtering
        const whereMatch = lowerSql.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|\s+group\s+by|$)/i)
        if (whereMatch) {
          const whereClause = whereMatch[1].trim()
          
          // Simple equality filtering
          const equalityMatch = whereClause.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/i)
          if (equalityMatch) {
            const [, column, value] = equalityMatch
            resultRows = resultRows.filter(row => {
              const rowValue = String(row[column] || '').toLowerCase()
              return rowValue === value.toLowerCase()
            })
          }
        }
        
        // Apply LIMIT
        const limitMatch = lowerSql.match(/limit\s+(\d+)/i)
        if (limitMatch) {
          const limit = parseInt(limitMatch[1])
          resultRows = resultRows.slice(0, limit)
        }
        
        return {
          runId,
          columns: resultColumns,
          rows: resultRows,
          rowCount: resultRows.length,
          executionTimeMs: Date.now() - startTime,
          status: 'completed'
        }
      }
      
      // Default fallback for unrecognized queries
      return {
        runId,
        columns: ['message'],
        rows: [{ message: `Query executed, but table "${targetTable || 'unknown'}" not found in database. Available tables: ${Object.keys(mockTables).join(', ')}` }],
        rowCount: 1,
        executionTimeMs: Date.now() - startTime,
        status: 'completed'
      }
    },
    upsertCard: (_: any, { dashboardId, cardId, chartSpec }: { dashboardId: string, cardId?: string, chartSpec: any }) => {
      const dashboard = dashboards.find(d => d.id === dashboardId)
      if (!dashboard) {
        throw new Error(`Dashboard with id ${dashboardId} not found`)
      }

      // Ensure cards array exists
      if (!dashboard.cards) {
        dashboard.cards = []
      }

      const newCard = {
        id: cardId || `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chartSpec
      }

      if (cardId) {
        // Update existing card
        const cardIndex = dashboard.cards.findIndex(c => c.id === cardId)
        if (cardIndex >= 0) {
          dashboard.cards[cardIndex] = newCard
        } else {
          dashboard.cards.push(newCard)
        }
      } else {
        // Add new card
        dashboard.cards.push(newCard)
        
        // Add to layout if not present
        if (!dashboard.layout) {
          dashboard.layout = []
        }
        const existingInLayout = dashboard.layout.find(item => item.i === newCard.id)
        if (!existingInLayout) {
          const maxY = dashboard.layout.length > 0 ? Math.max(...dashboard.layout.map(item => item.y + item.h)) : 0
          dashboard.layout.push({
            i: newCard.id,
            x: 0,
            y: maxY,
            w: 4,
            h: 5
          })
        }
      }

      return newCard
    },
    deleteCard: (_: any, { dashboardId, cardId }: { dashboardId: string, cardId: string }) => {
      const dashboard = dashboards.find(d => d.id === dashboardId)
      if (!dashboard) {
        throw new Error(`Dashboard with id ${dashboardId} not found`)
      }

      // Remove card from cards array
      if (dashboard.cards) {
        dashboard.cards = dashboard.cards.filter(card => card.id !== cardId)
      }

      // Remove card from layout
      if (dashboard.layout) {
        dashboard.layout = dashboard.layout.filter(item => item.i !== cardId)
      }

      return true
    },
    cancelQuery: (_: any, { runId }: { runId: string }) => {
      // In a real implementation, this would cancel a running query
      console.log(`Canceling query: ${runId}`)
      return true
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
})

const handler = startServerAndCreateNextHandler(server)

export { handler as GET, handler as POST }
