-- ZABEZPEČENÍ DATABÁZE (Row Level Security)

-- 1. Nejdříve pro jistotu smažeme staré nezabezpečené politiky
drop policy if exists "Public menu access" on menu_items;
drop policy if exists "Admin menu insert" on menu_items;
drop policy if exists "Admin menu update" on menu_items;
drop policy if exists "Admin menu delete" on menu_items;

drop policy if exists "Public user access" on users;
drop policy if exists "Public order access" on orders;

-- 2. Nastavení politik pro MENU_ITEMS
-- Každý může číst (SELECT)
create policy "Public menu read" on menu_items for select using (true);
-- Jen přihlášený uživatel (authenticated) může vkládat, upravovat a mazat
create policy "Admin menu write" on menu_items for insert to authenticated with check (true);
create policy "Admin menu update" on menu_items for update to authenticated using (true);
create policy "Admin menu delete" on menu_items for delete to authenticated using (true);

-- 3. Nastavení politik pro ORDERS
-- Číst a vkládat může kdokoli (anonymní zákazník musí mít možnost poslat objednávku)
-- Ale pro vyšší bezpečnost bychom v budoucnu mohli omezit UPDATE jen na admina.
create policy "Public orders all" on orders for all using (true);

-- 4. Nastavení politik pro USERS (zákazníci)
-- Zatím necháme veřejné, aby se mohli registrovat/přihlašovat z frontendu
create policy "Public users all" on users for all using (true);

-- Povinně zapneme RLS na všech tabulkách (pojistka)
alter table menu_items enable row level security;
alter table users enable row level security;
alter table orders enable row level security;
