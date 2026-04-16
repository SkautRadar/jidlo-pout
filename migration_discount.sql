-- OPRAVA DATABÁZE PRO SLEVY (UŽIVATELÉ I OBJEDNÁVKY)
-- Spusťte tento skript v Supabase SQL Editoru.

-- 1. Uživatelé: Přidání typu slevy (Fixed vs Percent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent';

-- 2. Objednávky: Přidání sloupců pro uložení slevy a konečné ceny
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_price NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount JSONB;

-- Aktualizace cache
NOTIFY pgrst, 'reload config';
