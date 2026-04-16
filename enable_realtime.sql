-- Povolení Realtime pro klíčové tabulky
-- Spusťte tento skript v Supabase SQL Editoru, abyste zajistili okamžitou synchronizaci mezi zařízeními.

-- 1. Povolení pro tabulku objednávek (aby kuchař viděl nové objednávky hned)
alter publication supabase_realtime add table orders;

-- 2. Povolení pro položky menu (aby se změny v menu projevily všem)
alter publication supabase_realtime add table menu_items;

-- 3. Povolení pro uživatele (aby se registrace hned projevila)
alter publication supabase_realtime add table users;

-- Po spuštění tohoto skriptu by se měly události (INSERT, UPDATE, DELETE) automaticky posílat do aplikace.
