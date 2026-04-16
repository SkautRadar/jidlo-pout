-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- MENU ITEMS table
create table menu_items (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  category text,
  image text,
  is_sold_out boolean default false,
  allergens text[],
  diet_tags text[],
  options jsonb,
  created_at timestamptz default now()
);

-- USERS table
create table users (
  id text primary key,
  first_name text,
  last_name text,
  email text unique,
  password text,
  address text,
  id_card_number text,
  birth_date text,
  section_number text,
  discount numeric default 0,
  created_at timestamptz default now()
);

-- ORDERS table
create table orders (
  id text primary key,
  order_number integer,
  items jsonb,
  user_info jsonb,
  status text,
  total_price numeric,
  final_price numeric,
  discount jsonb,
  received_amount numeric,
  change_amount numeric,
  note text,
  is_paid boolean default false,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY (RLS) - For simplicity in this demo, we enable public access
-- In production, you would want strict policies
alter table menu_items enable row level security;
create policy "Public menu access" on menu_items for select using (true);
create policy "Admin menu insert" on menu_items for insert with check (true);
create policy "Admin menu update" on menu_items for update using (true);
create policy "Admin menu delete" on menu_items for delete using (true);

alter table users enable row level security;
create policy "Public user access" on users for all using (true);

alter table orders enable row level security;
create policy "Public order access" on orders for all using (true);
