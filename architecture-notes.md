# Architecture Notes — Matalinong Tindahan

## System Overview

Matalinong Tindahan is a single Next.js application (frontend + backend API routes) backed by
Supabase for data storage and an LLM (via the Vercel AI SDK) for the core restocking
reasoning feature. No separate backend service is needed for v1.

```
┌─────────────────────┐
│  Owner's Browser     │
│  (mobile-first UI)   │
└──────────┬───────────┘
           │ HTTPS
           ▼
┌─────────────────────────────────────────┐
│  Next.js 14 App (Vercel)                 │
│  ┌─────────────┐   ┌──────────────────┐ │
│  │ Frontend      │   │ API Routes        │ │
│  │ (Tailwind UI) │──▶│ /api/sales-log     │ │
│  │               │   │ /api/items         │ │
│  │               │   │ /api/suggestion    │ │
│  └─────────────┘   └────────┬───────────┘ │
└──────────────────────────────┼─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                                    ▼
   ┌────────────────────┐            ┌───────────────────────┐
   │ Supabase (Postgres)  │            │ Claude API              │
   │ - items               │            │ (via Vercel AI SDK)     │
   │ - sales_logs          │            │ restock reasoning       │
   └────────────────────┘            └───────────────────────┘
```

## Stack (per Phase 1 PRD)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Fast to scaffold, matches course-recommended stack, good mobile responsiveness for a tap-based UI |
| AI / LLM | Vercel AI SDK + Claude | Structured prompt/response handling, easy to swap models later |
| Database | Supabase (Postgres) | Free tier, instant REST/JS client, no separate backend needed |
| Auth | None in v1 (single demo store) — Supabase Auth is the v2 path | PRD explicitly scopes out multi-store; keeps v1 simple and demo-friendly |
| Deploy | Vercel + GitHub Actions | Meets assignment's CI/CD + live URL requirement with minimal config |

## Data Flow: Weekly Restock Suggestion

1. Owner logs a sale via the tap UI → `POST /api/sales-log` → row inserted into `sales_logs`.
2. Owner opens the Suggestions page → `GET /api/suggestion`.
3. Server aggregates the last 7–14 days of `sales_logs` per item into a compact summary
   (e.g. `"Item X: 3/day avg last 7 days, 0 sold last 2 days"`) — **not** raw log rows.
4. Server sends that summary to Claude via the Vercel AI SDK with a system prompt
   (see `spec.md` for the exact prompt contract) and requests a structured JSON response.
5. Server parses the JSON, returns `{ lowStock: [...], deadStock: [...], summary: "..." }`
   to the frontend.
6. Frontend renders the flags and the plain-language Tagalog/Taglish summary.

## Non-Functional Notes

- **Latency:** Suggestion generation is on-demand (button press), not real-time — a few
  seconds of loading state is acceptable.
- **Mobile-first:** Primary usage is a phone, not desktop — the tap-logging UI in
  particular must work one-handed.
- **Data minimalism:** No PII beyond an optional store name. No payment or financial
  data is stored (out of scope per PRD).
- **Secrets:** All API keys (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live in
  environment variables only — never committed, never sent to the client. The
  `SUPABASE_ANON_KEY` is the only key safe for client-side use.

## Open Architecture Questions (carry into spec review)

- Should sales logging write directly from the client to Supabase (using the anon key
  + row-level security), or always go through a Next.js API route? *Recommendation:
  route through API for v1 — simpler to reason about and keeps validation server-side.*
- Should the AI suggestion be cached (e.g., regenerated once per day) or always
  generated fresh on request? *Recommendation: fresh for v1 — simplicity over cost
  optimization at this scale.*
