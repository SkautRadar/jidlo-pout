-- =====================================================
-- USER DATA REQUIREMENTS: Comprehensive Update
-- =====================================================
-- Přidání nových sloupců pro rozšířené uživatelské údaje
-- Migrace existujících dat
-- Aktualizace RPC funkcí
-- =====================================================

-- 1. Přidání nových sloupců do users tabulky
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- 2. Migrace existujících dat (address -> street)
-- Pokud existující users mají "address", přesuneme to do "street"
UPDATE users 
SET street = address 
WHERE street IS NULL AND address IS NOT NULL;

-- 3. Poznámka: Sloupec "address" ponecháme pro backwards compatibility
-- ale postupně ho přestaneme používat

-- 4. AKTUALIZACE: register_customer RPC funkce
CREATE OR REPLACE FUNCTION register_customer(
  p_first_name TEXT,
  p_last_name TEXT,
  p_nickname TEXT,              -- 🆕 NOVÉ
  p_email TEXT,
  p_password TEXT,
  p_street TEXT,                -- 🆕 NOVÉ (místo address)
  p_house_number TEXT,          -- 🆕 NOVÉ
  p_postal_code TEXT,           -- 🆕 NOVÉ
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
  
  -- Validate email (basic format check)
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Neplatný formát emailu.';
  END IF;
  
  -- Validate password (minimum 8 znaků, alespoň 1 číslo)
  IF LENGTH(p_password) < 8 THEN
    RAISE EXCEPTION 'Heslo musí mít minimálně 8 znaků.';
  END IF;
  
  IF p_password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Heslo musí obsahovat alespoň 1 číslo.';
  END IF;
  
  -- Validate jméno a příjmení (minimum 2 znaky)
  IF LENGTH(TRIM(p_first_name)) < 2 OR LENGTH(TRIM(p_last_name)) < 2 THEN
    RAISE EXCEPTION 'Jméno a příjmení musí mít alespoň 2 znaky.';
  END IF;
  
  -- 🆕 Validate ulice
  IF LENGTH(TRIM(p_street)) < 3 THEN
    RAISE EXCEPTION 'Název ulice musí mít alespoň 3 znaky.';
  END IF;
  
  -- 🆕 Validate číslo popisné (číslo nebo číslo+písmeno)
  IF p_house_number !~ '^[0-9]+[a-zA-Z]?$' THEN
    RAISE EXCEPTION 'Číslo popisné musí být ve formátu: číslo nebo číslo+písmeno (např. 123a).';
  END IF;
  
  -- 🆕 Validate PSČ (5 číslic nebo formát XXX XX)
  -- Normalizujeme PSČ (odstraníme mezery)
  p_postal_code := REGEXP_REPLACE(p_postal_code, '\s+', '', 'g');
  IF p_postal_code !~ '^[0-9]{5}$' THEN
    RAISE EXCEPTION 'PSČ musí být 5 číslic (např. 12345 nebo 123 45).';
  END IF;
  
  -- Validate telefon (pokud je zadán)
  IF p_phone IS NOT NULL AND LENGTH(TRIM(p_phone)) > 0 THEN
    -- Odstraníme mezery a +420 prefix pro validaci
    DECLARE
      clean_phone TEXT;
    BEGIN
      clean_phone := REGEXP_REPLACE(p_phone, '\s+', '', 'g');
      clean_phone := REGEXP_REPLACE(clean_phone, '^\+420', '', 'g');
      
      IF clean_phone !~ '^[0-9]{9}$' THEN
        RAISE EXCEPTION 'Telefon musí být ve formátu: 123456789 nebo +420 123 456 789.';
      END IF;
    END;
  END IF;
  
  -- Trimování whitespace z emailu (bezpečnostní best practice)
  p_email := LOWER(TRIM(p_email));
  
  -- ===== DUPLICITA CHECK =====
  SELECT 1 INTO exists_check FROM users WHERE email = p_email;
  IF exists_check IS NOT NULL THEN
    RAISE EXCEPTION 'Uživatel s tímto emailem již existuje.';
  END IF;
  
  -- ===== PASSWORD HASHING =====
  password_hash := crypt(p_password, gen_salt('bf'));
  
  -- ===== VLOŽENÍ UŽIVATELE =====
  INSERT INTO users (
    id, 
    first_name,
    last_name,
    nickname,               -- 🆕
    email, 
    password,
    street,                 -- 🆕
    house_number,           -- 🆕
    postal_code,            -- 🆕
    address,                -- Backwards compatibility - spojení street + house_number
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
    NULLIF(TRIM(p_nickname), ''),  -- NULL pokud prázdné
    p_email, 
    password_hash,
    TRIM(p_street),
    TRIM(p_house_number),
    p_postal_code,
    TRIM(p_street) || ' ' || TRIM(p_house_number),  -- Backwards compatibility
    NULLIF(TRIM(p_phone), ''),
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
    RAISE EXCEPTION 'Chyba registrace: %', SQLERRM;
END;
$$;

-- 5. AKTUALIZACE: update_customer_profile RPC funkce
CREATE OR REPLACE FUNCTION update_customer_profile(
  p_id uuid,
  p_first_name TEXT,
  p_last_name TEXT,
  p_nickname TEXT,
  p_street TEXT,
  p_house_number TEXT,
  p_postal_code TEXT,
  p_phone TEXT,
  p_section_number TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validace dat (stejná jako v register)
  IF LENGTH(TRIM(p_first_name)) < 2 OR LENGTH(TRIM(p_last_name)) < 2 THEN
    RAISE EXCEPTION 'Jméno a příjmení musí mít alespoň 2 znaky.';
  END IF;
  
  IF LENGTH(TRIM(p_street)) < 3 THEN
    RAISE EXCEPTION 'Název ulice musí mít alespoň 3 znaky.';
  END IF;
  
  IF p_house_number !~ '^[0-9]+[a-zA-Z]?$' THEN
    RAISE EXCEPTION 'Neplatný formát čísla popisného.';
  END IF;
  
  -- Normalize PSČ
  p_postal_code := REGEXP_REPLACE(p_postal_code, '\s+', '', 'g');
  IF p_postal_code !~ '^[0-9]{5}$' THEN
    RAISE EXCEPTION 'PSČ musí být 5 číslic.';
  END IF;
  
  UPDATE users
  SET 
    first_name = TRIM(p_first_name),
    last_name = TRIM(p_last_name),
    nickname = NULLIF(TRIM(p_nickname), ''),
    street = TRIM(p_street),
    house_number = TRIM(p_house_number),
    postal_code = p_postal_code,
    address = TRIM(p_street) || ' ' || TRIM(p_house_number),  -- Backwards compat
    phone = NULLIF(TRIM(p_phone), ''),
    section_number = TRIM(p_section_number)
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Uživatel nenalezen.';
  END IF;
END;
$$;

-- 6. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION register_customer TO public;
GRANT EXECUTE ON FUNCTION update_customer_profile TO public;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Zkontrolovat nové sloupce:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- Test registrace (náhradní data):
-- SELECT register_customer(
--   'Jan', 'Novák', 'Honza',
--   'test@example.com', 'Password123',
--   'Hlavní', '15', '12345',
--   '+420 123 456 789',
--   'AB123456', '1990-01-01', '1'
-- );

-- =====================================================
-- HOTOVO! ✅
-- =====================================================
