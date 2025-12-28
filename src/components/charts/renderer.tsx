'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartSpec } from '@/types/chart-spec';
import { transformRowsForRecharts } from './data-transform';

// Sort direction type for table columns
type SortDirection = 'asc' | 'desc' | null;

// Hardcoded sample data for Phase 3 (Static Dashboard)
const SAMPLE_DATA = {
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
  ]
};

// Recharts color palette
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const EXECUTE_CHART = gql`
  query ExecuteChart($spec: JSON!) {
    executeChart(spec: $spec) {
      rows
      meta {
        rowCount
        durationMs
      }
    }
  }
`;

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  // Stabilize variables to avoid refetch loops when spec object identity changes
  const variables = useMemo(() => ({ spec }), [JSON.stringify(spec)]);
  // Use GraphQL query to fetch dynamic data
  const { data, loading, error } = useQuery(EXECUTE_CHART, {
    variables,
    fetchPolicy: 'cache-first',
  });

  // Fallback to hardcoded data if GraphQL fails
  const fallbackData = SAMPLE_DATA[spec.data.source as keyof typeof SAMPLE_DATA] || [];
  const rawData = data?.executeChart?.rows || fallbackData;
  
  const { chartData, seriesKeys, xKey, valueKey } = useMemo(
    () => transformRowsForRecharts(spec, rawData),
    [spec, rawData]
  );

  const height = spec.options?.height ?? 256;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Table sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle column header click for sorting
  const handleColumnSort = useCallback((columnKey: string) => {
    if (sortColumn !== columnKey) {
      // New column: start with ascending
      setSortColumn(columnKey);
      setSortDirection('asc');
    } else {
      // Same column: cycle through asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    }
  }, [sortColumn, sortDirection]);

  // Sort table data based on current sort state
  const sortedTableData = useMemo(() => {
    if (!chartData || spec.type !== 'table' || !sortColumn || !sortDirection) {
      return chartData;
    }

    return [...chartData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values based on type
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [chartData, spec.type, sortColumn, sortDirection]);

  // Render sort indicator icon
  const renderSortIndicator = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="inline-block ml-1 h-3 w-3 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="inline-block ml-1 h-3 w-3 text-foreground" />;
    }
    if (sortDirection === 'desc') {
      return <ChevronDown className="inline-block ml-1 h-3 w-3 text-foreground" />;
    }
    return <ChevronsUpDown className="inline-block ml-1 h-3 w-3 text-muted-foreground/50" />;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ height }}>
        <Skeleton className="w-full h-full" data-testid="skeleton" />
      </div>
    );
  }

  // On error, do not surface a red UI badge during demos; log and continue with fallback
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[ChartRenderer] executeChart error:', error);
  }

  // Early return for empty data to avoid rendering issues
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  if (spec.type === 'table') {
    const columns = Object.keys(chartData[0] || {});
    const displayData = sortedTableData || chartData;

    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {columns.map((key) => (
                  <th
                    key={key}
                    className="p-2 text-left font-medium cursor-pointer select-none hover:bg-muted/80 transition-colors"
                    onClick={() => handleColumnSort(key)}
                    title={`Click to sort by ${key}`}
                  >
                    <span className="inline-flex items-center">
                      {key}
                      {renderSortIndicator(key)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={index} className="border-b border-border/50">
                  {columns.map((columnKey) => (
                    <td key={columnKey} className="p-2">
                      {typeof row[columnKey] === 'number'
                        ? row[columnKey].toLocaleString()
                        : String(row[columnKey] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    if (spec.type === 'line') {
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          {spec.options?.legend !== 'none' && <Legend />}
          {seriesKeys.map((k, index) => (
            <Line 
              key={k} 
              type={spec.encodings.smooth ? 'monotone' : 'linear'} 
              dataKey={k} 
              stroke={COLORS[index % COLORS.length]}
              dot={false} 
            />
          ))}
        </LineChart>
      );
    }

    if (spec.type === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xKey} 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            fontSize={12}
          />
          <YAxis />
          <Tooltip />
          {spec.options?.legend !== 'none' && <Legend />}
          {seriesKeys.map((k, index) => (
            <Bar 
              key={k} 
              dataKey={k} 
              fill={COLORS[index % COLORS.length]}
              stackId={spec.encodings.stack ? 'a' : undefined} 
            />
          ))}
        </BarChart>
      );
    }

    if (spec.type === 'pie') {
      const renderCustomLegend = () => {
        if (spec.options?.legend === 'none') return null;
        
        return (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-y-1 w-32">
            {chartData.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center cursor-pointer transition-opacity ${
                  activeIndex !== null && activeIndex !== index ? 'opacity-50' : 'opacity-100'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="w-2 h-2 mr-1 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-gray-600 truncate">{entry[xKey]}</span>
              </div>
            ))}
          </div>
        );
      };

      return (
        <div className="relative w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie 
                data={chartData} 
                dataKey={valueKey} 
                nameKey={xKey} 
                label={spec.encodings.label}
                cx="50%"
                cy="45%"
                outerRadius={85}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={activeIndex !== null && activeIndex !== index ? 0.6 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {renderCustomLegend()}
        </div>
      );
    }

    return <div></div>;
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: height }}>
      {/* Chart Title */}
      {spec.options?.title && (
        <div className="px-4 pt-2 pb-1">
          <h3 className="text-lg font-semibold text-center text-gray-800">
            {spec.options.title}
          </h3>
        </div>
      )}
      
      {/* Chart Content */}
      <div className="flex-1" style={{ minHeight: spec.options?.title ? height - 40 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
