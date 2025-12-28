// src/types/chart-spec.ts
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'scatter';

export type TimeUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'none';

export type Aggregate = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct';

export type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'between' | 'isNull' | 'notNull';

export interface FieldRef {
  field: string;        // column name (e.g., "amount", "created_at")
  label?: string;       // human label
}

export interface MeasureRef extends FieldRef {
  aggregate?: Aggregate; // default 'sum' for numeric fields, 'count' otherwise
  format?: string;       // d3-format or Intl format string (handled in UI)
}

export interface DimensionRef extends FieldRef {
  timeUnit?: TimeUnit;   // applied if field is a timestamp/date
  sort?: 'asc' | 'desc';
}

export interface Filter {
  field: string;
  op: FilterOp;
  value?: any;           // array for in/notIn/between; omit for isNull/notNull
}

export interface DataQuery {
  source: string;               // logical table/view name from backend catalog
  dimensions: DimensionRef[];   // 0..n (e.g., date, lead_source)
  measures: MeasureRef[];       // 1..n
  filters?: Filter[];
  limit?: number;               // applied after aggregation/sort
  orderBy?: { field: string; dir: 'asc' | 'desc' }[];
}

export interface Encodings {
  x?: DimensionRef;             // primary category / time
  y?: MeasureRef | MeasureRef[];// one or more measures (bars/lines)
  series?: DimensionRef;        // splits y into multiple series (pivot)
  color?: string[];             // palette override (optional)
  label?: boolean;              // show data labels
  stack?: boolean;              // bar/area stacking
  smooth?: boolean;             // line smoothing
  // Scatter plot specific encodings
  xValue?: MeasureRef;          // numeric X axis for scatter
  yValue?: MeasureRef;          // numeric Y axis for scatter
  size?: MeasureRef;            // bubble size (optional)
}

export interface ChartOptions {
  title?: string;
  subtitle?: string;            // descriptive subtitle for the chart
  legend?: 'none' | 'top' | 'right' | 'bottom' | 'left';
  yAxisFormat?: string;
  xAxisTickFormat?: string;     // for dates or categorical abbreviations
  tooltipFields?: FieldRef[];   // extra fields to show in tooltip
  height?: number;              // px; width is responsive container
  sampleTopNSeries?: number;    // limit series cardinality
  columnOrder?: string[];       // table column display order (persisted)
}

export interface ChartSpec {
  v: 1;                         // spec version
  type: ChartType;
  data: DataQuery;
  encodings: Encodings;
  options?: ChartOptions;
}
