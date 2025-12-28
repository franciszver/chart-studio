# Security Issues and Proposed Fixes

**Date**: December 28, 2025
**Auditor**: AI Security Review
**Scope**: Chart Studio Application

---

## Executive Summary

This document identifies security vulnerabilities in the Chart Studio application and provides best-practice fixes for each issue. Issues are categorized by severity: CRITICAL, HIGH, MEDIUM, LOW.

---

## Issue #1: Server-Side SQL Validation Missing

**Severity**: CRITICAL
**Location**: `src/app/api/graphql/route.ts` (lines 837-1048)
**Type**: SQL Injection / Input Validation Bypass

### Description

SQL queries are validated only on the client-side in `src/components/explorer/sql-validation.ts`. A malicious actor can bypass client-side validation by:
1. Directly calling the GraphQL API with crafted requests
2. Modifying client-side JavaScript
3. Using tools like Postman, curl, or GraphQL Playground

### Current Vulnerable Code

```typescript
// In executeSql resolver - NO server-side validation
executeSql: async (_, { sql }) => {
  const startTime = Date.now()
  const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  // SQL is processed without validation
  // ...
}
```

### Proposed Fix

Add server-side validation that mirrors client-side rules:

```typescript
// Add at top of route.ts
function validateSqlServer(sql: string): { valid: boolean; error?: string } {
  // Remove comments for analysis
  const sqlWithoutComments = sql
    .split('\n')
    .map(line => line.replace(/--.*$/, ''))
    .join(' ')
    .trim()

  // Block dangerous keywords
  const dangerousKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE',
    'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC',
    'EXECUTE', 'CALL', 'MERGE', 'REPLACE'
  ]

  const dangerousPattern = new RegExp(
    `\\b(${dangerousKeywords.join('|')})\\b`, 'i'
  )

  if (dangerousPattern.test(sqlWithoutComments)) {
    console.warn(`[SECURITY] Blocked dangerous SQL: ${sql.substring(0, 100)}...`)
    return {
      valid: false,
      error: 'Query contains prohibited operations. Only SELECT queries are allowed.'
    }
  }

  // Only allow SELECT and WITH (CTEs)
  const normalized = sqlWithoutComments.toLowerCase().trim()
  if (!normalized.startsWith('select') && !normalized.startsWith('with')) {
    console.warn(`[SECURITY] Blocked non-SELECT query: ${sql.substring(0, 100)}...`)
    return {
      valid: false,
      error: 'Only SELECT queries are allowed.'
    }
  }

  return { valid: true }
}

// Update resolver
executeSql: async (_, { sql }) => {
  // SERVER-SIDE VALIDATION
  const validation = validateSqlServer(sql)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Continue with existing logic...
}
```

### Best Practice References
- OWASP Input Validation Cheat Sheet
- Defense in Depth principle (validate at every layer)

---

## Issue #2: GraphQL Introspection Enabled

**Severity**: MEDIUM
**Location**: `src/app/api/graphql/route.ts` (line 1126)
**Type**: Information Disclosure

### Description

GraphQL introspection is enabled (`introspection: true`), allowing anyone to discover the entire API schema, including all queries, mutations, and types. While useful for development, this exposes the attack surface in production.

### Current Code

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,  // Exposes full schema
})
```

### Proposed Fix

Disable introspection in production:

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
})
```

### Note for Interview Project

For this demo project, introspection can remain enabled to facilitate testing. Document this as a known deviation from production best practices.

---

## Issue #3: No Rate Limiting on GraphQL Endpoint

**Severity**: MEDIUM
**Location**: `src/app/api/graphql/route.ts`
**Type**: Denial of Service (DoS)

### Description

The GraphQL API has no rate limiting, allowing an attacker to:
1. Flood the API with requests
2. Execute expensive queries repeatedly
3. Exhaust server resources

### Proposed Fix

For Next.js API routes, implement rate limiting using a middleware or library:

```typescript
// Option 1: Simple in-memory rate limiter (demo purposes)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // 100 requests per minute

  const record = requestCounts.get(ip)

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`)
    return false
  }

  record.count++
  return true
}

// In handler, before processing:
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return new Response('Too Many Requests', { status: 429 })
  }
  // Continue with GraphQL handling...
}
```

### Production Recommendation

Use a proper rate limiting solution like:
- `@upstash/ratelimit` with Redis
- Cloudflare Rate Limiting
- AWS WAF

---

## Issue #4: Error Messages May Leak Information

**Severity**: LOW
**Location**: Various resolvers in `src/app/api/graphql/route.ts`
**Type**: Information Disclosure

### Description

Some error messages may reveal internal implementation details:

```typescript
if (!dashboard) {
  throw new Error('Dashboard not found')  // Safe
}

// Potential issue in SQL parsing errors:
throw new Error(`Failed to parse SQL: ${error.message}`)  // May leak internal details
```

### Proposed Fix

Use generic error messages for users while logging details server-side:

```typescript
try {
  // SQL parsing logic
} catch (error) {
  console.error('[SQL_PARSE_ERROR]', error)  // Log full details
  throw new Error('Failed to process query. Please check your SQL syntax.')  // Generic message
}
```

---

## Issue #5: No CSRF Protection on Mutations

**Severity**: LOW
**Location**: `src/app/api/graphql/route.ts`
**Type**: Cross-Site Request Forgery

### Description

GraphQL mutations can be executed without CSRF token validation. While Clerk authentication provides some protection, additional CSRF measures would strengthen security.

### Proposed Fix

For production, implement CSRF protection:

```typescript
// Check origin header
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3019'
  ]

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[SECURITY] Blocked request from origin: ${origin}`)
    return new Response('Forbidden', { status: 403 })
  }

  // Continue with GraphQL handling...
}
```

### Note

Clerk's authentication middleware already provides session-based protection, reducing CSRF risk significantly.

---

## Issue #6: Sensitive Data in Console Logs

**Severity**: LOW
**Location**: Various files
**Type**: Information Disclosure

### Description

Development console.log statements may inadvertently log sensitive data:

```typescript
console.log('Layout updated:', layout)  // May contain user data
console.log('Query executed:', sql)      // Logs full SQL queries
```

### Proposed Fix

1. Use structured logging with log levels
2. Sanitize logged data
3. Disable verbose logging in production

```typescript
const isDev = process.env.NODE_ENV !== 'production'

function safeLog(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  if (level === 'info' && !isDev) return  // Skip info logs in production

  const sanitizedData = data ? JSON.stringify(data).substring(0, 200) : ''
  console[level](`[${level.toUpperCase()}] ${message}`, sanitizedData)
}
```

---

## Issue #7: localStorage Data Not Encrypted

**Severity**: LOW
**Location**: `src/components/explorer/sql-editor.tsx`
**Type**: Data Exposure

### Description

SQL queries are stored in localStorage without encryption:

```typescript
localStorage.setItem(STORAGE_KEY, value)
```

While localStorage is sandboxed per origin, XSS attacks could access this data.

### Proposed Fix

For sensitive data, consider:
1. Encrypting before storage (adds complexity)
2. Using sessionStorage for temporary data
3. Clearing on logout

For this demo project, the current approach is acceptable as SQL queries against mock data are not sensitive.

---

## Summary Table

| Issue | Severity | Status | Implementation Priority |
|-------|----------|--------|------------------------|
| #1 Server-Side SQL Validation | CRITICAL | To Fix | Immediate |
| #2 GraphQL Introspection | MEDIUM | Document | Production Only |
| #3 No Rate Limiting | MEDIUM | To Fix | High |
| #4 Error Message Leakage | LOW | To Fix | Medium |
| #5 No CSRF Protection | LOW | Document | Production Only |
| #6 Sensitive Console Logs | LOW | To Fix | Low |
| #7 Unencrypted localStorage | LOW | Accept | N/A (Demo) |

---

## Implementation Checklist

- [ ] Add `validateSqlServer()` function to `route.ts`
- [ ] Integrate validation in `executeSql` resolver
- [ ] Add console.warn for blocked queries (security logging)
- [ ] Add comment about introspection for production
- [ ] Implement basic rate limiting
- [ ] Sanitize error messages in SQL execution
- [ ] Review and clean up development console.log statements

---

*End of Security Audit*
