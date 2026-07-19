# Matalinong Tindahan

An AI-powered restocking assistant for Philippine sari-sari store owners. Log daily
sales with a tap, and get a plain-language weekly suggestion on what to restock and
what to leave alone.

Built for AIM's Week 4 Graded Assignment 4.2 (Post-Graduate Certificate in
Generative AI and Agentic AI).

## Problem

Sari-sari store owners manage inventory by memory or notebook, with no way to know
which items are about to run out or which are dead stock. See
`Phase1_Validation_and_PRD_MatalinongTindahan.md` for the full problem validation and PRD.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres) for data storage
- Vercel AI SDK + Anthropic (Claude) for the restocking suggestion feature
- Vercel for hosting, GitHub Actions for CI

Full technical design: see `architecture-notes.md` and `spec.md`.

## Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then run
   `supabase/seed.sql` in the Supabase SQL editor to create the schema and load
   demo data.

3. **Get an Anthropic API key** from [console.anthropic.com](https://console.anthropic.com).

4. **Set environment variables** — copy `.env.example` to `.env.local` and fill in
   your real values:
   ```bash
   cp .env.example .env.local
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

6. **Run tests**
   ```bash
   npm run test
   ```

## Deployment

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add the four environment variables from `.env.example` in the Vercel project
   settings (Settings → Environment Variables) — never commit real values.
4. Vercel will build and deploy automatically on every push to `main`. GitHub
   Actions (`.github/workflows/ci.yml`) runs tests and a build check on every push
   and pull request as a separate CI gate.

## Project Structure

```
app/
  page.tsx                  → dashboard
  log/page.tsx               → tap-based sales logging
  suggestions/page.tsx        → AI restocking suggestions
  api/items/route.ts
  api/sales-log/route.ts
  api/suggestion/route.ts
lib/
  supabase.ts                → server-side Supabase client
  ai.ts                      → Claude call + AI response schema
  validation.ts               → sales-log input validation
  sales-summary.ts            → raw logs → AI-ready summary
components/
  ItemTapButton.tsx
  SuggestionCard.tsx
supabase/
  seed.sql                   → schema + demo data
tests/
  validation.test.ts
  sales-summary.test.ts
  ai-response-schema.test.ts
```

## Known Limitations (v1)

- No authentication — single demo store, per PRD scope.
- No barcode scanning or POS integration.
- Restocking suggestions are generated fresh on every visit to `/suggestions`
  rather than cached.

See the PRD's "Open Questions" section and the GitHub Issues tab for planned v2
improvements.
