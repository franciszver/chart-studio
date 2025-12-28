## CRM Reporting Platform – Local Development

# Chart Studio

A modern dashboard and data visualization platform built with Next.js, GraphQL, and Recharts.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3019](http://localhost:3019)

---

## Features

- **Dashboard Management**: Create, edit, and organize reporting dashboards
- **Visual Chart Builder**: Drag-and-drop interface for building charts
- **SQL Data Explorer**: Write and execute SQL queries with autocomplete
- **AI-Powered SQL Generation**: Natural language to SQL conversion (requires OpenAI API key)
- **Multiple Chart Types**: Bar, Line, Pie, Scatter, and Table visualizations

---

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# OpenAI API (Optional - for AI SQL Agent)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

### OpenAI API Key Setup (Optional)

The AI SQL Agent feature allows natural language to SQL conversion. To enable:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Add `OPENAI_API_KEY` to your `.env.local`
3. Restart the development server

If no API key is configured, the feature will use a fallback mode with basic pattern matching.

See `_docs/PARA2E/AIAgentStepsNeeded.md` for detailed setup instructions.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3019) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run codegen` | Generate GraphQL types |

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI
- **State Management**: Apollo Client
- **API**: Apollo Server (GraphQL)
- **Charts**: Recharts
- **Data Grid**: AG Grid
- **SQL Editor**: CodeMirror 6
- **Authentication**: Clerk
- **Drag & Drop**: dnd-kit

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/graphql/        # GraphQL API endpoint
│   ├── dashboards/         # Dashboard routes
│   └── explorer/           # SQL Explorer
├── components/
│   ├── charts/             # Chart rendering
│   ├── dashboard/          # Dashboard components
│   ├── explorer/           # SQL Explorer components
│   └── ui/                 # Reusable UI components
├── graphql/                # GraphQL operations
├── lib/                    # Utility functions
└── types/                  # TypeScript types
```

---

## Documentation

Additional documentation is available in `_docs/PARA2E/`:

- `PRD.md` - Product Requirements Document
- `Approach.md` - Implementation approach and order
- `Architecture.md` - System architecture diagrams
- `SecurityIssuesProposedFixes.md` - Security audit and fixes
- `AIAgentStepsNeeded.md` - AI feature setup guide

---

## Notes

This is an interview/demo project. The backend uses mock in-memory data rather than a persistent database. All data resets on server restart.
