# CLAUDE.md — Matalinong Tindahan

Instructions for Claude Code (or any AI coding agent) working in this repo.

## Project Summary
Matalinong Tindahan is an AI-powered restocking assistant for Philippine sari-sari store
owners. Owners log daily sales through a simple tap UI; the app uses an LLM to flag
low-stock and dead-stock items and produce a plain-language weekly restocking
suggestion. Full context: see `spec.md` and `architecture-notes.md` in this repo.

## Stack
- Next.js 14, App Router, TypeScript
- Tailwind CSS (utility classes only — no custom CSS files unless unavoidable)
- Supabase (Postgres) for data
- Vercel AI SDK + Claude for the restocking suggestion feature
- Deployed on Vercel; CI via GitHub Actions

## Folder Structure (target)
```
/app
  /page.tsx              → dashboard
  /log/page.tsx           → sales logging
  /suggestions/page.tsx    → AI suggestion view
  /api/items/route.ts
  /api/sales-log/route.ts
  /api/suggestion/route.ts
/lib
  /supabase.ts            → Supabase client setup
  /ai.ts                  → Claude call + prompt construction
/components               → shared UI components
/tests                    → unit tests
```

## Conventions
- TypeScript everywhere; no untyped `.js` files.
- Server-side validation on every API route — do not rely on frontend checks alone.
- Never hardcode API keys or Supabase keys. Always read from `process.env`. If a new
  env var is needed, add it to `.env.example` with a placeholder.
- Keep AI prompt construction in `lib/ai.ts`, not scattered inline in route handlers.
- Match the request/response shapes exactly as defined in `spec.md` — if you need to
  deviate, stop and flag it rather than silently changing the contract.
- Commit in small, meaningful units (e.g., "Add sales-log API route with validation"),
  not one giant commit.
- Write unit tests for: (1) sales-log input validation, (2) the sales-summary
  aggregation logic that feeds the AI prompt, (3) at least one core utility function.

## What NOT to do
- Do not add authentication, multi-store support, barcode scanning, or payment
  processing — these are explicitly out of scope for v1 (see `spec.md` §6).
- Do not call the Claude API from client-side code — all AI calls happen in API
  routes only.
- Do not introduce a new state management library, ORM, or UI kit without flagging it
  first — keep the stack minimal per `architecture-notes.md`.

## When Unsure
If a requirement in `spec.md` is ambiguous or you need to make an assumption, state
the assumption in your response and proceed with the most reasonable interpretation
rather than blocking on it — but flag it clearly so it can be corrected in review.
