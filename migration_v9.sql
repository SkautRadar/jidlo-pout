-- 1. Vytvoření nové tabulky pro ukládání globálního nastavení (kategorií)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Nastavení zabezpečení pro tabulku settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings read" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin settings write" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Přidání chybějících sloupců do existující tabulky menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS vylepseni JSONB DEFAULT '[]'::jsonb;
