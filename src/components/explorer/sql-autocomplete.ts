import { CompletionContext, CompletionResult } from '@codemirror/autocomplete'

// SQL Keywords for autocomplete
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
  'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'GROUP BY', 'HAVING',
  'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'WITH', 'UNION', 'ALL', 'EXISTS'
]

export interface ColumnMetadata {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  referencedTable?: string
  referencedColumn?: string
}

export interface TableMetadata {
  name: string
  type: string
  columns: ColumnMetadata[]
}

export interface SchemaMetadata {
  tables: TableMetadata[]
}

export interface SqlContext {
  currentWord: string
  lineText: string
  beforeCursor: string
  afterDot: boolean
  inFromClause: boolean
  inJoinClause: boolean
  inSelectClause: boolean
  inWhereClause: boolean
  inOrderByClause: boolean
  inGroupByClause: boolean
  inHavingClause: boolean
  tableAlias?: string
  detectedTables: Array<{ name: string; alias?: string }>
}

export function extractSqlContext(text: string, pos: number): SqlContext {
  const beforeCursor = text.slice(0, pos)
  const lines = beforeCursor.split('\n')
  const currentLine = lines[lines.length - 1] || ''
  
  // Get current word being typed
  const wordMatch = currentLine.match(/(\w+)$/)
  const currentWord = wordMatch ? wordMatch[1] : ''
  
  // Check if we're after a dot (table.column syntax)
  const afterDot = /\w+\.\w*$/.test(currentLine)
  
  // Extract table alias before dot
  const aliasMatch = currentLine.match(/(\w+)\.\w*$/)
  const tableAlias = aliasMatch ? aliasMatch[1] : undefined
  
  // Normalize text for clause detection
  const normalizedText = beforeCursor.toUpperCase()
  
  // Detect which SQL clause we're in
  const selectIndex = normalizedText.lastIndexOf('SELECT')
  const fromIndex = normalizedText.lastIndexOf('FROM')
  const whereIndex = normalizedText.lastIndexOf('WHERE')
  const orderByIndex = normalizedText.lastIndexOf('ORDER BY')
  const groupByIndex = normalizedText.lastIndexOf('GROUP BY')
  const havingIndex = normalizedText.lastIndexOf('HAVING')
  const joinIndex = Math.max(
    normalizedText.lastIndexOf('JOIN'),
    normalizedText.lastIndexOf('INNER JOIN'),
    normalizedText.lastIndexOf('LEFT JOIN'),
    normalizedText.lastIndexOf('RIGHT JOIN')
  )
  
  const inFromClause = fromIndex > selectIndex && pos > fromIndex && 
                       (whereIndex === -1 || pos < whereIndex) &&
                       (joinIndex === -1 || pos < joinIndex)
  const inJoinClause = joinIndex > Math.max(selectIndex, fromIndex) && pos > joinIndex &&
                       (whereIndex === -1 || pos < whereIndex)
  const inSelectClause = selectIndex >= 0 && (fromIndex === -1 || pos < fromIndex)
  const inWhereClause = whereIndex > fromIndex && pos > whereIndex &&
                        (orderByIndex === -1 || pos < orderByIndex) &&
                        (groupByIndex === -1 || pos < groupByIndex)
  const inOrderByClause = orderByIndex > 0 && pos > orderByIndex
  const inGroupByClause = groupByIndex > 0 && pos > groupByIndex &&
                          (havingIndex === -1 || pos < havingIndex)
  const inHavingClause = havingIndex > 0 && pos > havingIndex
  
  // Extract table names and aliases from the query
  const detectedTables = extractTablesFromQuery(beforeCursor)
  
  return {
    currentWord,
    lineText: currentLine,
    beforeCursor,
    afterDot,
    inFromClause,
    inJoinClause,
    inSelectClause,
    inWhereClause,
    inOrderByClause,
    inGroupByClause,
    inHavingClause,
    tableAlias,
    detectedTables
  }
}

function extractTablesFromQuery(sql: string): Array<{ name: string; alias?: string }> {
  const tables: Array<{ name: string; alias?: string }> = []
  
  // Match FROM and JOIN clauses to extract table names and aliases
  const tableRegex = /(?:FROM|JOIN)\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/gi
  
  let match
  while ((match = tableRegex.exec(sql)) !== null) {
    tables.push({
      name: match[1],
      alias: match[2]
    })
  }
  
  return tables
}

export function createSqlCompletionSource(schema: SchemaMetadata) {
  return function sqlCompletionSource(context: CompletionContext): CompletionResult | null {
    const { pos, state } = context
    const text = state.doc.toString()
    
    const sqlContext = extractSqlContext(text, pos)
    const completions: Array<{ label: string; type: string; detail?: string; info?: string }> = []
    
    // If user types "SELECT " always show some columns
    if (text.toUpperCase().includes('SELECT') && sqlContext.currentWord.length >= 1) {
      schema.tables.forEach(table => {
        table.columns.forEach(column => {
          const matches = column.name.toLowerCase().startsWith(sqlContext.currentWord.toLowerCase())
          if (matches) {
            completions.push({
              label: column.name,
              type: 'property',
              detail: `${table.name}.${column.name} (${column.type})`,
              info: `Column from ${table.name} table`
            })
          }
        })
      })
    }
    
    // Handle column completions after table.
    if (sqlContext.afterDot && sqlContext.tableAlias) {
      const table = findTableByNameOrAlias(schema, sqlContext.tableAlias, sqlContext.detectedTables)
      if (table) {
        table.columns.forEach(column => {
          completions.push({
            label: column.name,
            type: 'property',
            detail: column.type,
            info: `${column.type}${!column.nullable ? ' NOT NULL' : ''}${column.isPrimaryKey ? ' PK' : ''}${column.isForeignKey ? ' FK' : ''}`
          })
        })
      }
    }
    // Handle table completions in FROM or JOIN clauses
    else if (sqlContext.inFromClause || sqlContext.inJoinClause) {
      schema.tables.forEach(table => {
        completions.push({
          label: table.name,
          type: 'variable',
          detail: `${table.type} (${table.columns.length} columns)`,
          info: `Database ${table.type}`
        })
      })
    }
    // Handle column completions in contexts where columns are relevant
    else if ((sqlContext.inSelectClause || sqlContext.inWhereClause || sqlContext.inOrderByClause || 
              sqlContext.inGroupByClause || sqlContext.inHavingClause || sqlContext.detectedTables.length > 0) && 
             !sqlContext.afterDot) {
      // Add columns from all detected tables
      sqlContext.detectedTables.forEach(({ name }) => {
        const table = schema.tables.find(t => t.name === name)
        if (table) {
          table.columns.forEach(column => {
            completions.push({
              label: column.name,
              type: 'property',
              detail: `${table.name}.${column.name} (${column.type})`,
              info: `Column from ${table.name}`
            })
          })
        }
      })
      
      // Add keywords relevant to the current context
      SQL_KEYWORDS.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(sqlContext.currentWord.toLowerCase())) {
          completions.push({
            label: keyword,
            type: 'keyword',
            detail: 'SQL keyword'
          })
        }
      })
    }
    // Enhanced: Show all available columns when we don't have specific table context but user might want columns
    else if (!sqlContext.inFromClause && !sqlContext.inJoinClause && !sqlContext.afterDot && sqlContext.currentWord.length > 0) {
      // If user is typing something that could be a column name, show all columns from schema
      schema.tables.forEach(table => {
        table.columns.forEach(column => {
          if (column.name.toLowerCase().startsWith(sqlContext.currentWord.toLowerCase())) {
            completions.push({
              label: column.name,
              type: 'property',
              detail: `${table.name}.${column.name} (${column.type})`,
              info: `Column from ${table.name} table`
            })
          }
        })
      })
      
      // Add keywords
      SQL_KEYWORDS.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(sqlContext.currentWord.toLowerCase())) {
          completions.push({
            label: keyword,
            type: 'keyword',
            detail: 'SQL keyword'
          })
        }
      })
    }
    // Default: suggest keywords and also show columns if user is typing something column-like
    else {
      // Always show keywords
      SQL_KEYWORDS.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(sqlContext.currentWord.toLowerCase())) {
          completions.push({
            label: keyword,
            type: 'keyword',
            detail: 'SQL keyword'
          })
        }
      })
      
      // Also show ALL columns from schema if user typed at least 2 characters
      if (sqlContext.currentWord.length >= 2) {
        schema.tables.forEach(table => {
          table.columns.forEach(column => {
            if (column.name.toLowerCase().includes(sqlContext.currentWord.toLowerCase())) {
              completions.push({
                label: column.name,
                type: 'property',
                detail: `${table.name}.${column.name} (${column.type})`,
                info: `Column from ${table.name} table - available everywhere`
              })
            }
          })
        })
      }
    }
    
    if (completions.length === 0) {
      return null
    }
    
    // Find the start of the current word
    const wordStart = Math.max(0, pos - sqlContext.currentWord.length)
    
    return {
      from: wordStart,
      options: completions.map(comp => ({
        label: comp.label,
        type: comp.type,
        detail: comp.detail,
        info: comp.info
      }))
    }
  }
}

function findTableByNameOrAlias(
  schema: SchemaMetadata, 
  nameOrAlias: string, 
  detectedTables: Array<{ name: string; alias?: string }>
): TableMetadata | undefined {
  // First check if it's an alias
  const tableWithAlias = detectedTables.find(t => t.alias === nameOrAlias)
  if (tableWithAlias) {
    return schema.tables.find(t => t.name === tableWithAlias.name)
  }
  
  // Otherwise check if it's a direct table name
  return schema.tables.find(t => t.name === nameOrAlias)
}
