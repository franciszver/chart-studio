import { NextRequest, NextResponse } from 'next/server'

interface SchemaTable {
  name: string
  type: string
  columns: {
    name: string
    type: string
    nullable: boolean
    isPrimaryKey: boolean
    isForeignKey: boolean
    referencedTable?: string
    referencedColumn?: string
  }[]
}

interface SchemaMetadata {
  tables: SchemaTable[]
}

interface GenerateSqlRequest {
  query: string
  schema: SchemaMetadata
}

interface GenerateSqlResponse {
  sql: string
  source: 'openai' | 'fallback'
  message?: string
}

// Simple fallback patterns for common queries
function generateFallbackSql(query: string, schema: SchemaMetadata): string {
  const lowercaseQuery = query.toLowerCase()
  const tables = schema?.tables || []

  // Find relevant tables based on keywords in the query
  const findRelevantTable = (keywords: string[]): SchemaTable | undefined => {
    for (const keyword of keywords) {
      const table = tables.find(t =>
        t.name.toLowerCase().includes(keyword) ||
        keyword.includes(t.name.toLowerCase())
      )
      if (table) return table
    }
    return tables[0] // Default to first table
  }

  // Extract potential keywords from query
  const queryWords = lowercaseQuery.split(/\s+/)

  // Pattern: "show me all X" or "list all X"
  if (lowercaseQuery.includes('show me all') || lowercaseQuery.includes('list all') || lowercaseQuery.includes('get all')) {
    const table = findRelevantTable(queryWords)
    if (table) {
      return `SELECT * FROM ${table.name} LIMIT 100;`
    }
  }

  // Pattern: "count X" or "how many X"
  if (lowercaseQuery.includes('count') || lowercaseQuery.includes('how many')) {
    const table = findRelevantTable(queryWords)
    if (table) {
      return `SELECT COUNT(*) as total FROM ${table.name};`
    }
  }

  // Pattern: "total X by Y" or "sum X by Y" (aggregation)
  if (lowercaseQuery.includes('total') || lowercaseQuery.includes('sum')) {
    const table = findRelevantTable(queryWords)
    if (table) {
      // Find numeric column for sum and categorical for grouping
      const numericCol = table.columns.find(c =>
        c.type.toLowerCase().includes('int') ||
        c.type.toLowerCase().includes('decimal') ||
        c.type.toLowerCase().includes('numeric') ||
        c.type.toLowerCase().includes('money') ||
        c.name.toLowerCase().includes('amount') ||
        c.name.toLowerCase().includes('revenue') ||
        c.name.toLowerCase().includes('total')
      )
      const groupByCol = table.columns.find(c =>
        c.type.toLowerCase().includes('varchar') ||
        c.type.toLowerCase().includes('text') ||
        c.name.toLowerCase().includes('month') ||
        c.name.toLowerCase().includes('year') ||
        c.name.toLowerCase().includes('category') ||
        c.name.toLowerCase().includes('name')
      )

      if (numericCol && groupByCol) {
        return `SELECT ${groupByCol.name}, SUM(${numericCol.name}) as total
FROM ${table.name}
GROUP BY ${groupByCol.name}
ORDER BY total DESC;`
      }
    }
  }

  // Pattern: "average X" or "avg X"
  if (lowercaseQuery.includes('average') || lowercaseQuery.includes('avg')) {
    const table = findRelevantTable(queryWords)
    if (table) {
      const numericCol = table.columns.find(c =>
        c.type.toLowerCase().includes('int') ||
        c.type.toLowerCase().includes('decimal') ||
        c.type.toLowerCase().includes('numeric')
      )
      if (numericCol) {
        return `SELECT AVG(${numericCol.name}) as average FROM ${table.name};`
      }
    }
  }

  // Pattern: "top N X" or "first N X"
  const topMatch = lowercaseQuery.match(/(?:top|first)\s+(\d+)/)
  if (topMatch) {
    const limit = parseInt(topMatch[1], 10)
    const table = findRelevantTable(queryWords)
    if (table) {
      return `SELECT * FROM ${table.name} LIMIT ${limit};`
    }
  }

  // Pattern: contains "revenue" or "sales"
  if (lowercaseQuery.includes('revenue') || lowercaseQuery.includes('sales')) {
    const table = tables.find(t =>
      t.name.toLowerCase().includes('revenue') ||
      t.name.toLowerCase().includes('sales') ||
      t.name.toLowerCase().includes('order')
    )
    if (table) {
      return `SELECT * FROM ${table.name} LIMIT 100;`
    }
  }

  // Pattern: contains "customer" or "client"
  if (lowercaseQuery.includes('customer') || lowercaseQuery.includes('client')) {
    const table = tables.find(t =>
      t.name.toLowerCase().includes('customer') ||
      t.name.toLowerCase().includes('client')
    )
    if (table) {
      return `SELECT * FROM ${table.name} LIMIT 100;`
    }
  }

  // Default: just select from first table
  if (tables.length > 0) {
    return `SELECT * FROM ${tables[0].name} LIMIT 100;`
  }

  return '-- Could not generate SQL. Please write your query manually.'
}

async function generateWithOpenAI(query: string, schema: SchemaMetadata): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4'

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Build schema context for the prompt
  const schemaContext = schema.tables
    .map(table => {
      const columns = table.columns
        .map(col => `  ${col.name} ${col.type}${col.isPrimaryKey ? ' PRIMARY KEY' : ''}${col.isForeignKey ? ` REFERENCES ${col.referencedTable}(${col.referencedColumn})` : ''}`)
        .join('\n')
      return `Table: ${table.name}\n${columns}`
    })
    .join('\n\n')

  const systemPrompt = `You are a SQL expert. Generate a valid SQL query based on the user's natural language request.

Available database schema:
${schemaContext}

Rules:
1. Only generate SELECT statements (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Use proper SQL syntax
3. Add LIMIT 100 if no limit specified to prevent large result sets
4. Use aliases for clarity when needed
5. Return ONLY the SQL query, no explanations or markdown
6. If the request is unclear, make reasonable assumptions based on the schema`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const sql = data.choices?.[0]?.message?.content?.trim()

  if (!sql) {
    throw new Error('No SQL generated from OpenAI')
  }

  // Clean up markdown code blocks if present
  return sql.replace(/^```sql?\n?/i, '').replace(/\n?```$/i, '').trim()
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateSqlResponse>> {
  try {
    const body: GenerateSqlRequest = await request.json()
    const { query, schema } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { sql: '', source: 'fallback', message: 'Query is required' },
        { status: 400 }
      )
    }

    // Try OpenAI first if configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    if (hasOpenAI) {
      try {
        const sql = await generateWithOpenAI(query, schema)
        return NextResponse.json({
          sql,
          source: 'openai',
        })
      } catch (error) {
        console.error('OpenAI generation failed, falling back:', error)
        // Fall through to fallback
      }
    }

    // Use fallback
    const sql = generateFallbackSql(query, schema)
    return NextResponse.json({
      sql,
      source: 'fallback',
      message: hasOpenAI
        ? 'OpenAI generation failed. Using pattern-based fallback.'
        : 'OpenAI not configured. Using pattern-based fallback. Set OPENAI_API_KEY for better results.',
    })
  } catch (error) {
    console.error('Generate SQL error:', error)
    return NextResponse.json(
      {
        sql: '-- Error generating SQL. Please write your query manually.',
        source: 'fallback',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
