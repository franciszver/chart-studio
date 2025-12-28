'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
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
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartSpec } from '@/types/chart-spec';
import { transformRowsForRecharts } from './data-transform';

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

// Sortable Table Header component for column reordering
interface SortableTableHeaderProps {
  id: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

function SortableTableHeader({ id, sortConfig, onSort }: SortableTableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="p-2 text-left font-medium select-none transition-colors bg-muted/50"
      {...attributes}
    >
      <div className="flex items-center gap-1">
        <span
          {...listeners}
          className="cursor-grab hover:text-primary"
          title="Drag to reorder"
        >
          ⋮⋮
        </span>
        <span
          onClick={() => onSort(id)}
          className="cursor-pointer hover:text-primary flex-1"
        >
          {id}
        </span>
        <span
          onClick={() => onSort(id)}
          className="text-primary w-4 text-center cursor-pointer"
        >
          {sortConfig?.key === id ? (
            sortConfig.direction === 'asc' ? '▲' : '▼'
          ) : (
            <span className="text-muted-foreground/40">⇅</span>
          )}
        </span>
      </div>
    </th>
  );
}

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

interface ChartRendererProps {
  spec: ChartSpec;
  onSpecChange?: (spec: ChartSpec) => void; // For persisting column order changes
}

export function ChartRenderer({ spec, onSpecChange }: ChartRendererProps) {
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
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Column order state (initialized from spec or default)
  const dataColumns = useMemo(() => Object.keys(chartData[0] || {}), [chartData]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    spec.options?.columnOrder || dataColumns
  );

  // Sync column order when data columns change
  useEffect(() => {
    if (dataColumns.length > 0 && !spec.options?.columnOrder) {
      setColumnOrder(dataColumns);
    }
  }, [dataColumns, spec.options?.columnOrder]);

  // Get ordered columns (filter out columns that don't exist in data)
  const orderedColumns = useMemo(() => {
    const existingCols = new Set(dataColumns);
    // Start with saved order, filter to only existing columns
    const ordered = columnOrder.filter(col => existingCols.has(col));
    // Add any new columns that aren't in the saved order
    const newCols = dataColumns.filter(col => !columnOrder.includes(col));
    return [...ordered, ...newCols];
  }, [columnOrder, dataColumns]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle column drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedColumns.indexOf(active.id as string);
      const newIndex = orderedColumns.indexOf(over.id as string);
      const newOrder = arrayMove(orderedColumns, oldIndex, newIndex);
      setColumnOrder(newOrder);

      // Persist to spec if callback provided
      if (onSpecChange) {
        onSpecChange({
          ...spec,
          options: {
            ...spec.options,
            columnOrder: newOrder,
          },
        });
      }
    }
  }, [orderedColumns, onSpecChange, spec]);

  // Handle table header click for sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null; // Third click removes sort
    });
  };

  // Sorted data for table
  const sortedChartData = useMemo(() => {
    if (!sortConfig || spec.type !== 'table') return chartData;

    return [...chartData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [chartData, sortConfig, spec.type]);

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
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <SortableContext
                  items={orderedColumns}
                  strategy={horizontalListSortingStrategy}
                >
                  <tr>
                    {orderedColumns.map((key) => (
                      <SortableTableHeader
                        key={key}
                        id={key}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    ))}
                  </tr>
                </SortableContext>
              </thead>
              <tbody>
                {sortedChartData.map((row, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {orderedColumns.map((key) => (
                      <td key={key} className="p-2">
                        {typeof row[key] === 'number' ? row[key].toLocaleString() : String(row[key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
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
                <span className="text-xs text-muted-foreground truncate">{entry[xKey]}</span>
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

    if (spec.type === 'scatter') {
      // Get X and Y keys for scatter plot - support both x/y and xValue/yValue encodings
      const scatterXKey = spec.encodings.x?.field || spec.encodings.xValue?.field || Object.keys(chartData[0] || {})[0] || 'x';
      const scatterYKey = spec.encodings.y?.field || spec.encodings.yValue?.field || Object.keys(chartData[0] || {})[1] || 'y';
      const scatterXLabel = spec.encodings.x?.label || spec.encodings.xValue?.label || scatterXKey;
      const scatterYLabel = spec.encodings.y?.label || spec.encodings.yValue?.label || scatterYKey;
      const sizeKey = spec.encodings.size?.field;

      return (
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey={scatterXKey}
            name={scatterXLabel}
            stroke="var(--foreground)"
            tick={{ fill: 'var(--foreground)', fontSize: 12 }}
            label={{
              value: scatterXLabel,
              position: 'bottom',
              offset: 40,
              fill: 'var(--foreground)'
            }}
          />
          <YAxis
            type="number"
            dataKey={scatterYKey}
            name={scatterYLabel}
            stroke="var(--foreground)"
            tick={{ fill: 'var(--foreground)', fontSize: 12 }}
            label={{
              value: scatterYLabel,
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fill: 'var(--foreground)'
            }}
          />
          {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[60, 400]} />}
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--foreground)'
            }}
          />
          {spec.options?.legend !== 'none' && <Legend />}
          <Scatter
            name={spec.options?.title || 'Data'}
            data={chartData}
            fill={COLORS[0]}
          />
        </ScatterChart>
      );
    }

    return <div></div>;
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: height }}>
      {/* Chart Title */}
      {spec.options?.title && (
        <div className="px-4 pt-2 pb-1">
          <h3 className="text-lg font-semibold text-center text-foreground">
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
