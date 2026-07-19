-- Matalinong Tindahan — schema + seed data
-- Run this in the Supabase SQL editor for your project (or via `supabase db push`
-- if you set up the Supabase CLI). Matches the data model in spec.md §2.

create extension if not exists "pgcrypto";

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists sales_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists sales_logs_item_id_idx on sales_logs(item_id);
create index if not exists sales_logs_logged_at_idx on sales_logs(logged_at);

-- Row Level Security: locked down by default. All access in v1 goes through API
-- routes using the service role key (which bypasses RLS), so no permissive
-- policies are added here. If a future version adds direct client access, add
-- narrowly-scoped policies at that point rather than opening these tables broadly.
alter table items enable row level security;
alter table sales_logs enable row level security;

-- ============================================================
-- SEED DATA — sample catalog of 18 common sari-sari store SKUs
-- ============================================================
insert into items (name, category) values
  ('Coke 1.5L', 'Beverages'),
  ('Sprite 1.5L', 'Beverages'),
  ('Royal 1.5L', 'Beverages'),
  ('Lucky Me Pancit Canton', 'Instant Noodles'),
  ('Nissin Cup Noodles', 'Instant Noodles'),
  ('Argentina Corned Beef', 'Canned Goods'),
  ('555 Sardines', 'Canned Goods'),
  ('Kopiko Coffee 3-in-1', 'Beverages'),
  ('Nescafe 3-in-1', 'Beverages'),
  ('Piattos', 'Snacks'),
  ('Nova Chips', 'Snacks'),
  ('Boy Bawang', 'Snacks'),
  ('Safeguard Bar Soap', 'Personal Care'),
  ('Head & Shoulders Sachet', 'Personal Care'),
  ('Colgate Toothpaste Small', 'Personal Care'),
  ('Globe Load 20', 'Load/Digital'),
  ('Smart Load 20', 'Load/Digital'),
  ('Candles', 'Household');

-- NOTE: The inserts below reference items by name lookup so this script is
-- runnable as-is without knowing generated UUIDs ahead of time.
--
-- Sales pattern seeded to intentionally produce, per spec.md's success metric:
--   - At least 3 low-stock candidates (steady sales, then a sudden drop to 0 in
--     the last 2 days — simulating "sold out, needs restocking")
--   - At least 2 dead-stock candidates (near-zero sales across the whole window)
--
-- Pattern uses relative dates so the seed stays meaningful whenever it's run.

do $$
declare
  v_item_id uuid;
  d date;
begin
  -- Coke 1.5L: strong steady seller, ~3/day, but NONE in the last 2 days (low stock signal)
  select id into v_item_id from items where name = 'Coke 1.5L';
  for d in select generate_series(current_date - 13, current_date - 3, 1)::date loop
    insert into sales_logs (item_id, quantity, logged_at) values (v_item_id, 3, d);
  end loop;

  -- Lucky Me Pancit Canton: very strong seller, ~5/day, none in last 2 days (low stock)
  select id into v_item_id from items where name = 'Lucky Me Pancit Canton';
  for d in select generate_series(current_date - 13, current_date - 3, 1)::date loop
    insert into sales_logs (item_id, quantity, logged_at) values (v_item_id, 5, d);
  end loop;

  -- Globe Load 20: steady daily seller, none in last 2 days (low stock)
  select id into v_item_id from items where name = 'Globe Load 20';
  for d in select generate_series(current_date - 13, current_date - 3, 1)::date loop
    insert into sales_logs (item_id, quantity, logged_at) values (v_item_id, 2, d);
  end loop;

  -- Sprite 1.5L: almost never sells (dead stock) — a single sale 12 days ago
  select id into v_item_id from items where name = 'Sprite 1.5L';
  insert into sales_logs (item_id, quantity, logged_at)
    values (v_item_id, 1, current_date - 12);

  -- Candles: no recent movement at all (dead stock) — one sale 20 days ago is
  -- intentionally outside the 14-day window, so it shows zero activity in-window
  select id into v_item_id from items where name = 'Candles';
  -- (no rows inserted in-window on purpose)

  -- Everything else: light, irregular sales — a realistic "normal" baseline
  for v_item_id in
    select id from items
    where name not in (
      'Coke 1.5L', 'Lucky Me Pancit Canton', 'Globe Load 20', 'Sprite 1.5L', 'Candles'
    )
  loop
    for d in select generate_series(current_date - 13, current_date, 3)::date loop
      insert into sales_logs (item_id, quantity, logged_at)
        values (v_item_id, 1 + floor(random() * 2)::int, d);
    end loop;
  end loop;
end $$;
