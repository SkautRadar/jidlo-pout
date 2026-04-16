# 🔐 Security Migration Guide

## ⚠️ DŮLEŽITÉ - PŘEČTĚTE PŘED SPUŠTĚNÍM

Tento dokument popisuje bezpečnostní aktualizace implementované v `security_migration_password_hash.sql`.

---

## 📋 Co bylo implementováno

### 1. **Bcrypt Password Hashing** ✅
- Všechna hesla jsou nyní ukládána jako bcrypt hash místo plain textu
- Cost factor: 10 (industry standard)
- Implementováno pomocí PostgreSQL `pgcrypto` extension

### 2. **Input Validation** ✅
- Email format validation (regex)
- Minimální délka hesla: 8 znaků
- Povinné: alespoň 1 číslo v hesle
- Trimování whitespace z vstupů

### 3. **Row Level Security Improvements** ✅  
- Zákazníci nyní vidí pouze své vlastní objednávky
- Admin (authenticated) vidí všechny objednávky
- Zamezení data leakage

### 4. **Frontend Password Strength Indicator** ✅
- Real-time visual feedback při registraci
- Barevné indikátory (červená/oranžová/zelená)
- Email format validation před submitem

### 5. **Configuration Security** ✅
- `.env` přidáno do `.gitignore`
- Vytvořen `.env.example` template
- Bezpečnostní poznámky v konfiguraci

---

## 🚀 Jak nasadit migraci

### Krok 1: Zálohování (DŮLEŽITÉ!)

```bash
# Pokud máte produkční data, vytvořte zálohu
pg_dump -t users your_database_name > users_backup_$(date +%Y%m%d).sql
pg_dump -t orders your_database_name > orders_backup_$(date +%Y%m%d).sql
```

### Krok 2: Spuštění migrace v Supabase

1. Otevřete **Supabase Dashboard** → **SQL Editor**
2. Vytvořte nový query
3. Zkopírujte celý obsah `security_migration_password_hash.sql`
4. Klikněte **RUN**

**Nebo** pomocí psql:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \\
  -f security_migration_password_hash.sql
```

### Krok 3: Verifikace

```sql
-- Zkontrolujte že pgcrypto extension je nainstalována
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
-- Očekávaný výsledek: 1 řádek s extname = 'pgcrypto'

-- Zkontrolujte že funkce existují
\\df login_customer
\\df register_customer
\\df change_customer_password

-- Pokud měli uživatelé hesla, měla by být nyní NULL
SELECT email, password IS NULL as password_nullified FROM users;
-- Všechny hodnoty password_nullified by měly být TRUE
```

### Krok 4: Testování

1. **Test registrace:**
   - Otevřete aplikaci: `http://localhost:3000`
   - Klikněte "Vytvořit účet"
   - Vyplňte formulář s heslem `TestPass123`
   - Zkontrolujte že vidíte zelené ✅ "Silné heslo"
   - Odešlete registraci

2. **Test hesla v databázi:**
```sql
SELECT email, LEFT(password, 4) as hash_start FROM users WHERE email = 'test@example.com';
-- hash_start by mělo být '$2a$' nebo '$2b$'
```

3. **Test přihlášení:**
   - Odhlaste se
   - Přihlaste se stejným emailem a heslem
   - Mělo by fungovat!

4. **Test RLS policies:**
```sql
-- Simulujte public role
SET ROLE anon;
SET app.current_user_email = 'test@example.com';

SELECT id, user_info->>'email' FROM orders;
-- Měli byste vidět POUZE objednávky s emailem test@example.com
```

---

## ⚠️ BREAKING CHANGES

### Pro stávající uživatele:

**Všichni uživatelé s hesly v tabulce `users` budou mít hesla nullifikována.**

**Řešení:**
1. **Varianta A (doporučená):** Implementovat "Forgot Password" flow
2. **Varianta B:** Kontaktovat uživatele emailem s žádostí o reset hesla
3. **Varianta C:** Nechat uživatele zaregistrovat se znovu

**Poznámka:** Admin uživatelé používají Supabase Auth a NEJSOU ovlivněni.

---

## 🔧 Řešení problémů

### Migrace selhala s chybou "extension pgcrypto does not exist"

```sql
-- Spusťte toto jako superuser (postgres role):
CREATE EXTENSION pgcrypto;
```

### Funkce `crypt` neexistuje

Ujistěte se, že pgcrypto extension je nainstalována:
```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

### Registrace selhává s "Heslo musí mít minimálně 8 znaků"

To je v pořádku! Bezpečnostní validace funguje. Použijte silnější heslo.

### Login selhává i se správným heslem

1. Zkontrolujte že heslo je hashované:
   ```sql
   SELECT email, LEFT(password, 4) FROM users WHERE email = 'your@email.com';
   ```
   Mělo by začínat `$2a$` nebo `$2b$`

2. Pokud je `NULL` → uživatel musí resetovat heslo nebo se znovu zaregistrovat
3. Pokud je plain text → migrace neběžela správně, spusťte ji znovu

---

## 🎯 Best Practices

### Pro development:

```bash
# Vytvořte testovacího uživatele
curl -X POST http://localhost:3000/api/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "dev@test.com",
    "password": "DevPass123",
    "address": "Test Street 1",
    "idCardNumber": "AB123456",
    "birthDate": "2000-01-01",
    "sectionNumber": "1"
  }'
```

### Pro production:

1. **Backup před migrací**
2. **Testovat na staging prostředí**
3. **Schedule downtime window** (5-10 minut)
4. **Informovat uživatele předem**
5. **Monitorovat error logs** po nasazení

---

## 📊 Security Checklist

Po nasazení migrace:

- [x] pgcrypto extension nainstalována
- [x] `login_customer` funkce používá `crypt()` pro verifikaci
- [x] `register_customer` funkce hashuje hesla před uložením
- [x] Všechna stará plain-text hesla jsou NULL
- [x] Frontend validuje sílu hesla
- [x] Email format je validován
- [x] `.env` je v `.gitignore`
- [x] RLS policies omezují přístup k objednávkám

---

## 📞 Support

Pokud narazíte na problémy:

1. Zkontrolujte Supabase logs: Dashboard → Logs → Postgres Logs
2. Zkontrolujte browser console pro frontend errors
3. Zkontrolujte network tab pro API call failures

---

## 📚 Additional Security Recommendations

Následující doporučení **NEJSOU** zahrnuta v této migraci, ale měli byste je zvážit:

1. **Rate Limiting** na login/register endpoints
2. **CAPTCHA** pro registraci
3. **Email Verification** při registraci
4. **Two-Factor Authentication (2FA)** pro adminy
5. **Audit Logging** pro citlivé operace
6. **Session Management** s JWT token rotation
7. **Password Reset Flow** přes email

---

**Poslední aktualizace:** 16. ledna 2026  
**Verze:** v8-secure → v8.1-hardened
