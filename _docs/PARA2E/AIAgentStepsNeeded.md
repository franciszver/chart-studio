# AI Agent Setup Guide

**Feature**: Natural Language to SQL Agent on Data Explorer Page
**AI Provider**: OpenAI (GPT-4)

---

## Overview

The AI Agent feature allows users to type natural language queries (e.g., "Show me total revenue by month") and have them automatically translated into SQL commands that can be executed against the database.

---

## Setup Steps

### Step 1: Obtain OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)

### Step 2: Configure Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# .env.local

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Specify model (defaults to gpt-4)
OPENAI_MODEL=gpt-4
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### Step 3: Install Dependencies

The required package is already included in `package.json`:

```bash
npm install openai
```

Or if starting fresh:

```bash
npm install
```

### Step 4: Verify Setup

1. Start the development server: `npm run dev`
2. Navigate to `/explorer` (Data Explorer page)
3. Look for the "Ask AI" input field above the SQL editor
4. Type a natural language query like "Show all customers"
5. Click the "Generate SQL" button

### Step 5: Fallback Behavior

If the OpenAI API key is not configured or the API call fails, the system will:

1. Display a warning message: "AI Fallback: OpenAI key not configured. Using basic pattern matching."
2. Attempt a simple keyword-based SQL generation as a demo fallback
3. Generate basic queries like:
   - "customers" → `SELECT * FROM customers LIMIT 100`
   - "revenue" → `SELECT * FROM revenue_summary LIMIT 100`
   - "deals" → `SELECT * FROM deals LIMIT 100`

---

## API Route Details

**Endpoint**: `POST /api/ai/generate-sql`

**Request Body**:
```json
{
  "query": "Show me total revenue by month",
  "schema": {
    "tables": [
      {
        "name": "revenue_summary",
        "columns": [
          { "name": "month", "type": "DATE" },
          { "name": "total_revenue", "type": "DECIMAL" }
        ]
      }
    ]
  }
}
```

**Response (Success)**:
```json
{
  "sql": "SELECT month, total_revenue FROM revenue_summary ORDER BY month",
  "source": "openai"
}
```

**Response (Fallback)**:
```json
{
  "sql": "SELECT * FROM revenue_summary LIMIT 100",
  "source": "fallback",
  "message": "AI Fallback: OpenAI key not configured. Using basic pattern matching."
}
```

---

## Troubleshooting

### "OpenAI API key not found"

- Ensure `.env.local` file exists in project root
- Verify the key starts with `sk-`
- Restart the development server after adding the key

### "OpenAI API error: 401"

- Your API key may be invalid or expired
- Generate a new key from OpenAI dashboard

### "OpenAI API error: 429"

- Rate limit exceeded
- Wait a few minutes or upgrade your OpenAI plan

### Fallback mode always activating

- Check that `OPENAI_API_KEY` environment variable is set
- Verify the key is valid by testing in OpenAI Playground

---

## Cost Considerations

- OpenAI API calls are charged per token
- GPT-4 is more expensive but more accurate
- Average query costs ~$0.01-0.03
- Consider using GPT-3.5-turbo for cost savings (update `OPENAI_MODEL` env var)

---

## Security Notes

1. API key is only used server-side (never exposed to browser)
2. Schema information is sent to OpenAI for context
3. User queries are sent to OpenAI for processing
4. No database data is sent to OpenAI, only schema structure

---

*End of AI Agent Setup Guide*
