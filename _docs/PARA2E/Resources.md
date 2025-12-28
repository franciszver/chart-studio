# Resources Required for Feature Implementation

This document identifies all resources, dependencies, and tools required to implement the 10 features outlined in the PRD.

---

## Existing Dependencies (Already Installed)

These packages are already in `package.json` and will be leveraged:

### UI & Styling
| Package | Version | Used For |
|---------|---------|----------|
| `tailwindcss` | ^4 | CSS framework, styling updates |
| `@radix-ui/react-collapsible` | ^1.1.11 | Dashboard folders collapse/expand |
| `@radix-ui/react-dialog` | ^1.1.14 | Modals and confirmations |
| `@radix-ui/react-dropdown-menu` | ^2.1.15 | Context menus |
| `motion` | ^12.23.12 | Page fade-in animations |
| `lucide-react` | ^0.536.0 | Icons for UI |
| `class-variance-authority` | ^0.7.1 | Component variants |
| `clsx` | ^2.1.1 | Class name utilities |
| `tailwind-merge` | ^3.3.1 | Tailwind class merging |

### Drag & Drop
| Package | Version | Used For |
|---------|---------|----------|
| `@dnd-kit/core` | ^6.3.1 | Dashboard/column drag-and-drop |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable lists |
| `@dnd-kit/utilities` | ^3.2.2 | DnD utilities |
| `react-grid-layout` | ^1.5.2 | Dashboard card grid (existing) |

### Charts & Data
| Package | Version | Used For |
|---------|---------|----------|
| `recharts` | ^3.1.2 | Scatter plot + existing charts |
| `ag-grid-react` | ^34.1.1 | Table sorting (optional migration) |
| `ag-grid-community` | ^34.1.1 | AG Grid core |

### SQL Editor
| Package | Version | Used For |
|---------|---------|----------|
| `@uiw/react-codemirror` | ^4.24.2 | SQL editor wrapper |
| `@codemirror/lang-sql` | ^6.9.1 | SQL syntax |
| `@codemirror/view` | ^6.38.1 | Line wrapping extension |
| `@codemirror/state` | ^6.5.2 | Editor state management |

### State & API
| Package | Version | Used For |
|---------|---------|----------|
| `@apollo/client` | ^3.13.9 | GraphQL state management |
| `@apollo/server` | ^5.0.0 | GraphQL server |
| `graphql` | ^16.11.0 | GraphQL core |

### Forms & Validation
| Package | Version | Used For |
|---------|---------|----------|
| `react-hook-form` | ^7.62.0 | Form handling |
| `zod` | ^4.0.15 | Schema validation |
| `use-debounce` | ^10.0.4 | Debounced saves |

---

## New Dependencies Required

These packages need to be installed:

### AI Integration
| Package | Version | Used For | Install Command |
|---------|---------|----------|-----------------|
| `openai` | ^4.x | OpenAI API client | `npm install openai` |

**Installation Command**:
```bash
npm install openai
```

---

## Environment Variables

### Required for Full Functionality
```bash
# .env.local

# Clerk (existing - required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# OpenAI (new - optional for AI feature)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

### Environment Variable Sources
| Variable | Source | Cost |
|----------|--------|------|
| Clerk Keys | [clerk.com](https://clerk.com) | Free tier available |
| OpenAI Key | [platform.openai.com](https://platform.openai.com) | Pay-per-use (~$0.01-0.03/query) |

---

## File Resources

### New Files to Create

| Path | Purpose |
|------|---------|
| `src/app/api/ai/generate-sql/route.ts` | AI SQL generation API endpoint |
| `src/components/providers/loading-provider.tsx` | Global loading state provider |
| `src/components/ui/loading-spinner.tsx` | Loading spinner component |
| `src/components/explorer/ai-query-input.tsx` | Natural language input component |
| `src/components/dashboard/sortable-dashboard-card.tsx` | Draggable dashboard card |
| `src/components/dashboard/dashboard-folder.tsx` | Folder component |

### Existing Files to Modify

| Path | Modifications |
|------|---------------|
| `src/app/globals.css` | Theme variables update |
| `src/app/layout.tsx` | Add LoadingProvider |
| `src/app/dashboards/page.tsx` | Add reordering + folders |
| `src/app/explorer/page.tsx` | Add AI input, loading state |
| `src/app/api/graphql/route.ts` | Security fixes |
| `src/components/explorer/sql-editor.tsx` | Line wrap toggle |
| `src/components/charts/renderer.tsx` | Scatter plot + table sorting |
| `src/types/chart-spec.ts` | Add 'scatter' type |

---

## Browser APIs Used

| API | Used For | Support |
|-----|----------|---------|
| `localStorage` | Dashboard order, folder state, preferences | All modern browsers |
| `KeyboardEvent` | Alt+Z shortcut detection | All modern browsers |
| `IntersectionObserver` | Scroll-based loading (existing) | All modern browsers |

---

## External Services

| Service | Purpose | Required |
|---------|---------|----------|
| Clerk | Authentication | Yes (existing) |
| OpenAI | AI SQL generation | Optional (has fallback) |

---

## Development Tools

### Already Configured
- TypeScript 5
- ESLint 9
- Jest 30 (testing)
- GraphQL Code Generator

### Recommended for Development
- VS Code with extensions:
  - Tailwind CSS IntelliSense
  - GraphQL extension
  - ESLint extension

---

## Hardware/Performance Considerations

| Feature | Impact | Mitigation |
|---------|--------|------------|
| Loading spinner | 2s artificial delay | Intentional per requirements |
| Drag-and-drop | DOM manipulation | Use dnd-kit optimizations |
| AI API calls | Network latency | Show loading state, cache results |
| Multiple charts | Rendering load | React.memo, virtualization if needed |

---

## Summary Checklist

- [ ] Install `openai` package
- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Create new component files (see list above)
- [ ] Modify existing files (see list above)
- [ ] No additional infrastructure required (mock backend)

---

*End of Resources Document*
