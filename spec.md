# spec.md — Matalinong Tindahan

## 1. Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard — recent sales trend per item, quick access to logging and suggestions |
| `/log` | Sales logging — tap-based UI to record items sold today |
| `/suggestions` | AI restocking suggestions — low-stock flags, dead-stock flags, plain-language summary |

## 2. Data Model (Supabase / Postgres)

### `items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text | e.g. "Coke 1.5L" |
| `category` | text | e.g. "Beverages", nullable |
| `created_at` | timestamptz | default `now()` |

### `sales_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `item_id` | uuid, FK → `items.id` | required |
| `quantity` | integer | required, must be > 0 |
| `logged_at` | date | defaults to today if not provided |
| `created_at` | timestamptz | default `now()` |

*(No `stores` or `users` table in v1 — single demo store, no auth, per PRD scope.)*

## 3. API Endpoints

### `GET /api/items`
Returns the seeded item catalog.
**Response:** `200 [{ id, name, category }]`

### `POST /api/sales-log`
Logs a sale.
**Request body:**
```json
{ "itemId": "uuid", "quantity": 2, "loggedAt": "2026-07-19" }
```
**Validation:**
- `itemId` must exist in `items` — else `400 { error: "Unknown item" }`
- `quantity` must be a positive integer — else `400 { error: "Invalid quantity" }`
- `loggedAt` optional, must be a valid date not in the future

**Response:** `201 { id, itemId, quantity, loggedAt }`

### `GET /api/suggestion`
Triggers the AI restocking suggestion.
**Response:**
```json
{
  "lowStock": [
    { "itemId": "uuid", "name": "Coke 1.5L", "reason": "Selling ~3/day, none sold last 2 days despite steady demand — likely out of stock." }
  ],
  "deadStock": [
    { "itemId": "uuid", "name": "Sprite 1.5L", "reason": "No sales in the last 10 days." }
  ],
  "summary": "Bumili ka ng karagdagang 2 case ng Coke, mabagal na ang Sprite ngayong linggo."
}
```
**Error handling:** If the AI call fails or returns malformed JSON, respond
`502 { error: "Could not generate suggestion, please try again." }` — never surface raw
API errors or stack traces to the client.

## 4. AI Prompt Contract

**Model:** Claude (via Vercel AI SDK), called server-side only.

**System prompt (paraphrased intent — refine wording during build):**
> You are a restocking assistant for a small Philippine sari-sari store. You will
> receive a summary of recent sales velocity per item. Identify items likely to run
> out soon (low stock) and items with little or no recent movement (dead stock).
> Respond only in the specified JSON schema. Keep the plain-language summary short,
> in Tagalog/Taglish, and actionable for a busy store owner.

**Input to the model** (constructed server-side from `sales_logs`, not sent as raw
rows):
```json
[
  { "item": "Coke 1.5L", "avgPerDay7d": 3.1, "soldLast2Days": 0 },
  { "item": "Sprite 1.5L", "avgPerDay7d": 0.2, "soldLast2Days": 0 }
]
```

**Output schema the model must return:** matches the `/api/suggestion` response shape
above. Server validates the response is parseable JSON matching this shape before
returning it to the client; on failure, retry once, then fall back to the 502 error.

## 5. Input Validation & Secrets Checklist

- All API routes validate request bodies server-side (never trust client-only checks).
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are read from environment
  variables only, never hardcoded, never logged.
- `.env.local` is gitignored; `.env.example` (with placeholder values only) is
  committed so the repo documents required variables without exposing real ones.

## 6. Out of Scope (v1)

Per PRD: barcode scanning, multi-store support, supplier ordering automation, live
stock-on-hand counts, payments/financing.

## 7. Open Questions (flag for review)

- Should `/api/suggestion` be rate-limited to prevent repeated AI calls driving up
  cost during grading/demo?
- Does the item catalog need an admin/seed screen, or is seeding done directly via a
  SQL script for the demo?
