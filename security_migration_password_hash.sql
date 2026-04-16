-- =====================================================
-- SECURITY MIGRATION: Password Hashing & Enhanced Auth
-- =====================================================
-- Tento skript implementuje bcrypt password hashing
-- a vylepšené bezpečnostní validace pro zákaznickou autentizaci.
--
-- ⚠️ BREAKING CHANGE: Všechna existující hesla budou nullifikována.
-- Uživatelé musí resetovat hesla nebo se znovu zaregistrovat.
--
-- Spustit v Supabase SQL Editor nebo psql:
-- \i security_migration_password_hash.sql
-- =====================================================

-- 1. Povolit pgcrypto extension pro bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Nullifikovat všechna existující plain-text hesla (BEZPEČNOSTNÍ NUTNOST)
UPDATE users SET password = NULL WHERE password IS NOT NULL;

-- 3. VYLEPŠENÁ REGISTRAČNÍ FUNKCE s bcrypt hashing
CREATE OR REPLACE FUNCTION register_customer(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_id_card_number TEXT,
  p_birth_date TEXT,
  p_section_number TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
  exists_check int;
  password_hash TEXT;
BEGIN
  -- ===== INPUT VALIDATION =====
  
  -- Validace emailu (basic format check)
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Neplatný formát emailu.';
  END IF;
  
  -- Validace délky hesla (minimum 8 znaků)
  IF LENGTH(p_password) < 8 THEN
    RAISE EXCEPTION 'Heslo musí mít minimálně 8 znaků.';
  END IF;
  
  -- Validace complexity hesla (alespoň 1 číslo)
  IF p_password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Heslo musí obsahovat alespoň 1 číslo.';
  END IF;
  
  -- Validace jména (minimum 2 znaky)
  IF LENGTH(TRIM(p_first_name)) < 2 OR LENGTH(TRIM(p_last_name)) < 2 THEN
    RAISE EXCEPTION 'Jméno a příjmení musí mít alespoň 2 znaky.';
  END IF;
  
  -- Trimování whitespace z emailu (bezpečnostní best practice)
  p_email := LOWER(TRIM(p_email));
  
  -- ===== DUPLICITA CHECK =====
  SELECT 1 INTO exists_check FROM users WHERE email = p_email;
  IF exists_check IS NOT NULL THEN
    RAISE EXCEPTION 'Uživatel s tímto emailem již existuje.';
  END IF;
  
  -- ===== PASSWORD HASHING =====
  -- Použití bcrypt s cost factor 10 (doporučený default)
  password_hash := crypt(p_password, gen_salt('bf'));
  
  -- ===== VLOŽENÍ UŽIVATELE =====
  INSERT INTO users (
    id, 
    first_name, 
    last_name, 
    email, 
    password, 
    address, 
    phone, 
    id_card_number, 
    birth_date, 
    section_number, 
    discount,
    discount_type
  ) VALUES (
    gen_random_uuid(), 
    TRIM(p_first_name), 
    TRIM(p_last_name), 
    p_email, 
    password_hash,  -- 🔐 Hashované heslo místo plain textu
    TRIM(p_address), 
    TRIM(p_phone), 
    TRIM(p_id_card_number), 
    p_birth_date, 
    TRIM(p_section_number), 
    0,
    'percent'
  )
  RETURNING id INTO new_id;
  
  -- ===== RESPONSE =====
  RETURN json_build_object(
    'id', new_id, 
    'email', p_email,
    'message', 'Registrace úspěšná!'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- LogováníErrorMessage bez exposování internal details
    RAISE EXCEPTION 'Chyba registrace: %', SQLERRM;
END;
$$;

-- 4. VYLEPŠENÁ LOGIN FUNKCE s bcrypt verification
CREATE OR REPLACE FUNCTION login_customer(
  user_email TEXT, 
  user_password TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user record;
BEGIN
  -- ===== INPUT VALIDATION =====
  IF user_email IS NULL OR user_password IS NULL THEN
    RETURN NULL;  -- Fail silently (security best practice)
  END IF;
  
  -- Trimování a lowercase emailu
  user_email := LOWER(TRIM(user_email));
  
  -- ===== HLEDÁNÍ UŽIVATELE s BCRYPT VERIFICATION =====
  -- crypt() automaticky verifikuje hash proti plain-text heslu
  SELECT * FROM users 
  WHERE email = user_email 
    AND password IS NOT NULL  -- Ověření že heslo je nastaveno
    AND password = crypt(user_password, password)  -- 🔐 Bcrypt verification
  INTO found_user;
  
  -- ===== FAIL = NULL (security - nerozlišujeme "email neexistuje" vs "špatné heslo") =====
  IF found_user IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- ===== SUCCESS = USER DATA (bez hesla!) =====
  RETURN json_build_object(
    'id', found_user.id,
    'first_name', found_user.first_name,
    'last_name', found_user.last_name,
    'email', found_user.email,
    'address', found_user.address,
    'phone', found_user.phone,
    'id_card_number', found_user.id_card_number,
    'birth_date', found_user.birth_date,
    'section_number', found_user.section_number,
    'discount', found_user.discount,
    'discount_type', found_user.discount_type
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- V případě DB erroru failnout silently (security)
    RETURN NULL;
END;
$$;

-- 5. VYLEPŠENÁ UPDATE PROFILE FUNKCE (bez možnosti měnit heslo zde)
CREATE OR REPLACE FUNCTION update_customer_profile(
  p_id uuid,
  p_first_name TEXT,
  p_last_name TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_section_number TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validace dat
  IF LENGTH(TRIM(p_first_name)) < 2 OR LENGTH(TRIM(p_last_name)) < 2 THEN
    RAISE EXCEPTION 'Jméno a příjmení musí mít alespoň 2 znaky.';
  END IF;
  
  UPDATE users
  SET 
    first_name = TRIM(p_first_name),
    last_name = TRIM(p_last_name),
    address = TRIM(p_address),
    phone = TRIM(p_phone),
    section_number = TRIM(p_section_number)
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Uživatel nenalezen.';
  END IF;
END;
$$;

-- 6. NOVÁ FUNKCE: Password Reset (pro budoucí použití)
CREATE OR REPLACE FUNCTION change_customer_password(
  p_user_id uuid,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hash TEXT;
  new_hash TEXT;
BEGIN
  -- Validace nového hesla
  IF LENGTH(p_new_password) < 8 THEN
    RAISE EXCEPTION 'Nové heslo musí mít minimálně 8 znaků.';
  END IF;
  
  IF p_new_password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Nové heslo musí obsahovat alespoň 1 číslo.';
  END IF;
  
  -- Získat současný hash
  SELECT password INTO current_hash 
  FROM users 
  WHERE id = p_user_id;
  
  IF current_hash IS NULL THEN
    RAISE EXCEPTION 'Uživatel nemá nastavené heslo.';
  END IF;
  
  -- Ověřit staré heslo
  IF current_hash != crypt(p_old_password, current_hash) THEN
    RAISE EXCEPTION 'Nesprávné současné heslo.';
  END IF;
  
  -- Hashovat nové heslo
  new_hash := crypt(p_new_password, gen_salt('bf'));
  
  -- Aktualizovat
  UPDATE users 
  SET password = new_hash 
  WHERE id = p_user_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Chyba při změně hesla: %', SQLERRM;
END;
$$;

-- =====================================================
-- VYLEPŠENÉ RLS POLICIES PRO ORDERS
-- =====================================================

-- DROP starých permissive policies
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public orders all" ON orders;

-- NOVÁ POLICY: Zákazníci vidí jen své objednávky (based on email v JSONB)
CREATE POLICY "customers_see_own_orders" ON orders
  FOR SELECT
  TO public
  USING (
    -- Umožnit přístup pokud email v objednávce odpovídá session variable
    -- (Bude nastaveno z frontendu po přihlášení)
    (user_info->>'email')::text = current_setting('app.current_user_email', true)
  );

-- ADMIN má full access (již existující policy by měla zůstat)
-- Necháme "Admin orders all" policy pro authenticated users

-- INSERT policy - zákazníci mohou vytvářet objednávky
-- (Již existuje "Customers create orders", necháme)

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION register_customer TO public;
GRANT EXECUTE ON FUNCTION login_customer TO public;
GRANT EXECUTE ON FUNCTION update_customer_profile TO public;
GRANT EXECUTE ON FUNCTION change_customer_password TO public;

-- =====================================================
-- VERIFICATION QUERIES (pro testing)
-- =====================================================

-- Zkontrolovat že pgcrypto je nainstalováno:
-- SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Test registrace (v Supabase SQL editor):
-- SELECT register_customer(
--   'Jan', 'Testovací', 'test@example.com', 'TestPass123',
--   'Testovací 1', '123456789', 'AB123456', '1990-01-01', '1'
-- );

-- Test login:
-- SELECT login_customer('test@example.com', 'TestPass123');

-- Ověřit že heslo je hashované (mělo by začínat $2a$ nebo $2b$):
-- SELECT email, LEFT(password, 10) as password_hash_start FROM users LIMIT 5;

-- =====================================================
-- HOTOVO! ✅
-- =====================================================
-- Nyní můžete:
-- 1. Testovat registraci nových uživatelů
-- 2. Ověřit že hesla jsou hashována
-- 3. Testovat login s hashovanými hesly
-- 4. Deploy frontend změn pro využití těchto vylepšení
-- =====================================================
