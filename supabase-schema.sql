-- ─────────────────────────────────────────────────────────────
-- IVORY Website — Supabase Schema
-- Paste this into: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────

-- Customers
create table if not exists customers (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  email       text unique not null,
  phone       text,
  address     text,
  created_at  timestamptz default now()
);

-- Orders
create table if not exists orders (
  id              uuid default gen_random_uuid() primary key,
  customer_id     uuid references customers(id),
  status          text not null default 'confirmed',
  total_inr       numeric(10,2) not null,
  payment_method  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Order Items
create table if not exists order_items (
  id            uuid default gen_random_uuid() primary key,
  order_id      uuid references orders(id) on delete cascade,
  product_id    text,
  product_name  text not null,
  category      text,
  size          text,
  quantity      int not null,
  price_inr     numeric(10,2) not null,
  created_at    timestamptz default now()
);

-- Auto-update updated_at on orders
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- Indexes for common queries
create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists order_items_order_id_idx on order_items(order_id);
