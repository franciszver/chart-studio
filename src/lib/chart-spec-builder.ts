import { ChartSpec } from '@/types/chart-spec'

interface Field {
  name: string
  type: string
  table: string
}

// Helper to deep clone a ChartSpec
function cloneSpec(spec: ChartSpec): ChartSpec {
  return {
    ...spec,
    data: {
      ...spec.data,
      dimensions: [...spec.data.dimensions],
      measures: [...spec.data.measures]
    },
    encodings: { ...spec.encodings },
    options: { ...spec.options }
  }
}

// Helper function to set X-axis field in chart spec
export function setX(spec: ChartSpec, field: Field): ChartSpec {
  const newSpec = cloneSpec(spec)
  
  // Update encodings
  newSpec.encodings = { ...newSpec.encodings, x: { field: field.name } }
  
  // Update data source if not set
  if (!newSpec.data.source) {
    newSpec.data.source = field.table
  }
  
  // Add to dimensions if it's not a numeric field
  const isNumeric = field.type.toLowerCase().includes('int') || 
                   field.type.toLowerCase().includes('decimal') || 
                   field.type.toLowerCase().includes('float') ||
                   field.type.toLowerCase().includes('number')
  
  if (!isNumeric && !newSpec.data.dimensions.some(d => d.field === field.name)) {
    newSpec.data.dimensions.push({ field: field.name })
  }
  
  return newSpec
}

// Helper function to set Y-axis field in chart spec
export function setY(spec: ChartSpec, field: Field, aggregate: string = 'sum'): ChartSpec {
  const newSpec = cloneSpec(spec)
  
  // Update encodings
  newSpec.encodings = { ...newSpec.encodings, y: { field: field.name } }
  
  // Update data source if not set
  if (!newSpec.data.source) {
    newSpec.data.source = field.table
  }
  
  // Add to measures
  if (!newSpec.data.measures.some(m => m.field === field.name)) {
    newSpec.data.measures.push({ 
      field: field.name, 
      aggregate,
      label: field.name 
    })
  }
  
  return newSpec
}

// Helper function to set Series field in chart spec
export function setSeries(spec: ChartSpec, field: Field): ChartSpec {
  const newSpec = cloneSpec(spec)
  
  // Update encodings
  newSpec.encodings = { ...newSpec.encodings, series: { field: field.name } }
  
  // Update data source if not set
  if (!newSpec.data.source) {
    newSpec.data.source = field.table
  }
  
  // Add to dimensions if not already present
  if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
    newSpec.data.dimensions.push({ field: field.name })
  }
  
  return newSpec
}

// Helper function to set Category field for pie charts
export function setCategory(spec: ChartSpec, field: Field): ChartSpec {
  const newSpec = cloneSpec(spec)
  
  // Update encodings
  newSpec.encodings = { ...newSpec.encodings, category: { field: field.name } }
  
  // Update data source if not set
  if (!newSpec.data.source) {
    newSpec.data.source = field.table
  }
  
  // Add to dimensions if not already present
  if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
    newSpec.data.dimensions.push({ field: field.name })
  }
  
  return newSpec
}

// Helper function to set Value field for pie charts
export function setValue(spec: ChartSpec, field: Field, aggregate: string = 'sum'): ChartSpec {
  const newSpec = cloneSpec(spec)
  
  // Update encodings
  newSpec.encodings = { ...newSpec.encodings, value: { field: field.name } }
  
  // Update data source if not set
  if (!newSpec.data.source) {
    newSpec.data.source = field.table
  }
  
  // Add to measures
  if (!newSpec.data.measures.some(m => m.field === field.name)) {
    newSpec.data.measures.push({ 
      field: field.name, 
      aggregate,
      label: field.name 
    })
  }
  
  return newSpec
}

// Helper function to remove a field from chart spec by encoding type
export function removeField(spec: ChartSpec, encodingType: 'x' | 'y' | 'series' | 'category' | 'value'): ChartSpec {
  const newSpec = cloneSpec(spec)
  
  if (newSpec.encodings && newSpec.encodings[encodingType]) {
    const fieldName = newSpec.encodings[encodingType]?.field
    
    // Remove from encodings
    delete newSpec.encodings[encodingType]
    
    // Remove from dimensions or measures if no other encoding uses it
    if (fieldName) {
      const stillUsed = Object.values(newSpec.encodings).some(encoding => encoding?.field === fieldName)
      
      if (!stillUsed) {
        newSpec.data.dimensions = newSpec.data.dimensions.filter(d => d.field !== fieldName)
        newSpec.data.measures = newSpec.data.measures.filter(m => m.field !== fieldName)
      }
    }
  }
  
  return newSpec
}

// Helper function to update chart type and reset incompatible encodings
export function setChartType(spec: ChartSpec, type: 'bar' | 'line' | 'pie' | 'table' | 'scatter'): ChartSpec {
  const newSpec = {
    ...spec,
    type,
    data: {
      ...spec.data,
      dimensions: [...spec.data.dimensions],
      measures: [...spec.data.measures]
    }
  }

  // Reset encodings that don't apply to the new chart type
  if (type === 'pie') {
    // Pie charts use category/value, not x/y/series
    if (newSpec.encodings?.x || newSpec.encodings?.y || newSpec.encodings?.series) {
      newSpec.encodings = {
        category: newSpec.encodings?.x || newSpec.encodings?.category,
        value: newSpec.encodings?.y || newSpec.encodings?.value
      }
    }
  } else if (type === 'table') {
    // Tables don't use specific encodings
    newSpec.encodings = {}
  } else if (type === 'scatter') {
    // Scatter plots need numeric X and Y values
    // Get the old X field before clearing (it's likely a string/dimension field from bar/line)
    const oldXField = newSpec.encodings?.x?.field

    // Clear X since bar/line X fields are typically strings (dimensions), not numbers
    // Keep Y since it's always numeric, and keep series for color grouping
    newSpec.encodings = {
      x: undefined,
      y: newSpec.encodings?.y || newSpec.encodings?.value,
      series: newSpec.encodings?.series
    }

    // Remove the old X field from dimensions since it won't be used in scatter
    if (oldXField) {
      newSpec.data.dimensions = newSpec.data.dimensions.filter(d => d.field !== oldXField)
    }
  } else {
    // Bar/line charts use x/y/series, not category/value
    if (newSpec.encodings?.category || newSpec.encodings?.value) {
      newSpec.encodings = {
        x: newSpec.encodings?.category || newSpec.encodings?.x,
        y: newSpec.encodings?.value || newSpec.encodings?.y,
        series: newSpec.encodings?.series
      }
    }
  }

  return newSpec
}
