// src/components/charts/data-transform.ts
import type { ChartSpec } from '@/types/chart-spec';

// rows: backend returns array of objects with grouped columns and measures
export function transformRowsForRecharts(spec: ChartSpec, rows: any[]) {
  // For scatter plots, return raw data - no transformation needed
  // Support both x/y and xValue/yValue encodings
  if (spec.type === 'scatter') {
    const xValueField = spec.encodings?.x?.field || spec.encodings?.xValue?.field;
    const yValueField = spec.encodings?.y?.field || spec.encodings?.yValue?.field;

    return {
      chartData: rows,
      seriesKeys: [],
      xKey: xValueField,
      valueKey: yValueField,
    };
  }

  // For pie charts, handle category/value encodings differently
  if (spec.type === 'pie') {
    const categoryField = (spec.encodings as any).category?.field ?? spec.data.dimensions[0]?.field;
    const valueField = (spec.encodings as any).value?.field ?? spec.data.measures[0]?.field;

    return {
      chartData: rows.map(r => ({
        [categoryField]: r[categoryField],
        [valueField]: r[valueField] ?? 0,
      })),
      seriesKeys: [valueField],
      xKey: categoryField,
      valueKey: valueField,
    };
  }

  // For other chart types (line, bar, table)
  const x = spec.encodings?.x?.field ?? spec.data.dimensions[0]?.field;
  const series = spec.encodings?.series?.field;
  const m = Array.isArray(spec.encodings?.y) ? spec.encodings.y[0] : spec.encodings?.y;
  const valueField = m?.label || m?.field || 'value';

  if (spec.type === 'table') {
    // For tables, return data as-is without transformation
    return {
      chartData: rows,
      seriesKeys: [],
      xKey: x,
      valueKey: valueField,
    };
  }

  // line/bar
  if (series) {
    // pivot: one row per x, columns per series value
    const map = new Map<string, any>();
    for (const r of rows) {
      const key = String(r[x]);
      const s = r[series];
      const v = r[valueField] ?? (m?.field ? r[m.field] : 0);
      if (!map.has(key)) map.set(key, { [x]: r[x] });
      map.get(key)![s] = v;
    }
    const chartData = Array.from(map.values());
    const seriesKeys = Array.from(new Set(rows.map(r => r[series])));
    return { chartData, seriesKeys, xKey: x, valueKey: valueField };
  } else {
    // single series; use value field as single series key
    const chartData = rows.map(r => ({ [x]: r[x], [valueField]: r[valueField] ?? (m?.field ? r[m.field] : 0) }));
    return { chartData, seriesKeys: [valueField], xKey: x, valueKey: valueField };
  }
}
