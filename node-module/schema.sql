-- Run once against the grocer-agent Supabase project before using the grocery agent.
-- Naming follows snake_case, plural convention.

create table if not exists grocery_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  request_text text not null,
  budget numeric,
  total numeric not null,
  free_delivery_minimum numeric not null,
  met_free_delivery_minimum boolean not null,
  reasoning text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists grocery_cart_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references grocery_sessions(id) on delete cascade,
  category text not null,
  status text not null check (status in ('selected', 'skipped')),
  product_id text,
  description text,
  brand text,
  price numeric,
  nutri_score text,
  nova_group int,
  diet_conflicts text[],
  skipped_reason text,
  created_at timestamptz not null default now()
);

create index if not exists grocery_cart_items_session_id_idx on grocery_cart_items(session_id);

-- Learned per-user state, written by the Preference Learning Agent, read by
-- the Budget & Cart-Fit Agent. This is what makes selection actually change
-- over time instead of applying the same fixed rule to everyone forever.
create table if not exists user_grocery_preferences (
  user_id text primary key,
  price_sensitivity numeric not null default 0.5,   -- 0 = ignores price, 1 = always picks cheapest
  quality_weight numeric not null default 0.5,       -- 0 = ignores nutrition, 1 = always picks best Nutri-Score/NOVA
  preferred_brands jsonb not null default '{}',       -- e.g. {"ramen": "Nissin", "dumplings": "Trader Joe's"}
  frequently_ordered_categories text[] not null default '{}',
  notes text,                                         -- free-form observations the learning agent chooses to record
  sessions_observed int not null default 0,           -- how many sessions this belief is based on — low count = low confidence
  updated_at timestamptz not null default now()
);
