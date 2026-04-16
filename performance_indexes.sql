-- =====================================================
-- PERFORMANCE OPTIMIZATION: Database Indexes
-- =====================================================
-- Tento skript přidává indexy pro zlepšení query performance.
-- Bezpečné spustit na produkci - indexy se vytváří CONCURRENTLY.
--
-- Estimated improvement: 10-100x rychlejší queries
-- =====================================================

-- 1. INDEX pro vyhledávání objednávek podle emailu zákazníka
-- Používá se v RLS policies a customer order history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_email 
ON orders ((user_info->>'email'));

-- Benefit: Rychlejší filtrování "moje objednávky" pro zákazníky
-- Před: Full table scan
-- Po: Index scan (10-100x rychlejší)

-- 2. INDEX pro filtrování podle statusu objednávky
-- Používá se v AdminView, CashierView pro aktivní objednávky
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status 
ON orders (status);

-- Benefit: Rychlejší načtení objednávek podle stavu (PENDING, ACCEPTED, etc.)

-- 3. INDEX pro řazení podle data vytvoření
-- Používá se všude kde zobrazujeme historii objednávek
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at 
ON orders (created_at DESC);

-- Benefit: Rychlejší řazení "nejnovější první"

-- 4. COMPOSITE INDEX pro běžný query pattern
-- Často filtrujeme status + řadíme podle času
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
ON orders (status, created_at DESC);

-- Benefit: Optimalizuje query "aktivní objednávky seřazené podle času"

-- 5. INDEX na email v users tabulce
-- Pro rychlejší login a duplicate check
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users (email);

-- Benefit: Rychlejší login_customer a register_customer

-- 6. INDEX na kategorii v menu_items
-- Pro filtrování menu podle kategorie
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_category 
ON menu_items (category);

-- Benefit: Rychlejší filtrování "Hlavní chody", "Nápoje", etc.

-- 7. INDEX na is_sold_out
-- Pro filtrování dostupných položek
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_sold_out 
ON menu_items (is_sold_out) 
WHERE is_sold_out = true;

-- Partial index - pouze vyprodané položky
-- Benefit: Rychlejší zobrazení jen dostupných položek

-- =====================================================
-- STATISTICS UPDATE
-- =====================================================
-- Po vytvoření indexů aktualizujeme statistiky pro query planner
ANALYZE orders;
ANALYZE users;
ANALYZE menu_items;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Zkontrolovat že indexy byly vytvořeny:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename IN ('orders', 'users', 'menu_items')
-- ORDER BY tablename, indexname;

-- Test query performance (mělo by použít index):
-- EXPLAIN ANALYZE 
-- SELECT * FROM orders 
-- WHERE (user_info->>'email') = 'test@example.com' 
-- ORDER BY created_at DESC;

-- Měli byste vidět "Index Scan using idx_orders_user_email"

-- =====================================================
-- MONITORING
-- =====================================================

-- Sledovat velikost indexů:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- Sledovat usage indexů (po nějaké době provozu):
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- =====================================================
-- ROLLBACK (pokud by bylo potřeba)
-- =====================================================

-- DROP INDEX CONCURRENTLY IF EXISTS idx_orders_user_email;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_orders_created_at;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_users_email;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_menu_category;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_menu_sold_out;

-- =====================================================
-- POZNÁMKY
-- =====================================================

-- CONCURRENTLY flag:
-- - Indexy se vytváří bez lockování tabulky
-- - Produkce může běžet během vytváření
-- - Trvá to déle, ale bezpečnější

-- Velikost indexů:
-- - Každý index zabírá disk space
-- - Pro malé DB (~1000 orders) je to zanedbatelné
-- - Pro velké DB monitorujte velikost

-- Maintenance:
-- - PostgreSQL automaticky udržuje indexy
-- - Občas spusťte REINDEX pokud performance klesá
-- - ANALYZE po větších data changes

-- =====================================================
-- HOTOVO! ✅
-- =====================================================
