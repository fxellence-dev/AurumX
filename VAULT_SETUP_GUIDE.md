# 🔐 Storing Service Role Key in Supabase Vault

## ✅ Solution to Permission Error

The error you encountered:
```
ERROR: 42501: permission denied to set parameter "app.supabase_url"
```

This happens because you can't set custom database parameters directly. Instead, use **Supabase Vault** to securely store the service role key.

---

## 📋 Step-by-Step Instructions

### Step 1: Get Your Service Role Key

1. **Go to Project Settings:**
   ```
   https://supabase.com/dashboard/project/YOUR-PROJECT-ID/settings/api
   ```

2. **Find "Project API keys" section**

3. **Locate "service_role" key** (NOT "anon public")

4. **Click "Reveal" or "Copy"**
   - It's a VERY long string (300+ characters)
   - Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Store in Supabase Vault

1. **Go to SQL Editor:**
   ```
   https://supabase.com/dashboard/project/YOUR-PROJECT-ID/sql/new
   ```

2. **Run this SQL command:**
   ```sql
   -- Store service_role key in Vault
   SELECT vault.create_secret(
     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE',
     'supabase_service_key'
   );
   ```
   
   **Important:** Replace `YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE` with your actual service_role key!

3. **Click "Run"**

### Step 3: Verify It Was Stored

```sql
-- Check that the secret was stored
SELECT id, name, description, created_at 
FROM vault.secrets 
WHERE name = 'supabase_service_key';
```

You should see one row with the secret name.

---

## 🎯 Alternative: No Configuration Needed!

**Good news:** The Edge Function already has access to environment variables automatically!

When you deploy the Edge Function to Supabase, it automatically has access to:
- ✅ `SUPABASE_URL` - Your project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

**However**, the database trigger function (which calls the Edge Function) needs the key, which is why we store it in Vault.

---

## 🔄 Complete SQL Command

Here's the complete command to run in Supabase SQL Editor:

```sql
-- =====================================================
-- Store Service Role Key in Vault
-- =====================================================

-- 1. Store the key
-- Get your service_role key from: Settings → API → service_role
-- It should be a long JWT token starting with "eyJhbGciOiJ..."
SELECT vault.create_secret(
  'PASTE_YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE',
  'supabase_service_key'
);

-- 2. Verify it was stored
SELECT id, name, description, created_at 
FROM vault.secrets 
WHERE name = 'supabase_service_key';

-- 3. Test that it can be retrieved (for debugging)
-- Note: This will show the decrypted key, so be careful!
SELECT name, decrypted_secret 
FROM vault.decrypted_secrets 
WHERE name = 'supabase_service_key';
```

---

## ✅ What Happens After This

Once the service_role key is stored in Vault:

1. **Database trigger** (`check_price_alerts()`) runs when gold prices update
2. **Database function** (`send_alert_notification()`) retrieves key from Vault
3. **HTTP request** is made to Edge Function with proper authorization
4. **Edge Function** fetches push tokens and sends notifications
5. **Users receive** push notifications on their devices

---

## 🔐 Security Benefits of Vault

✅ **Encrypted at rest** - Keys are stored encrypted in the database
✅ **Access controlled** - Only functions with `SECURITY DEFINER` can access
✅ **Auditable** - Can see when secrets were created/accessed
✅ **Revocable** - Can delete secrets if needed

---

## 🚨 Important Notes

1. **Never commit service_role key to Git**
2. **Only use in server-side code** (database functions, Edge Functions)
3. **Never expose in client code**
4. **Keep it secret** - It has full database access

---

## 📝 Quick Reference

**Where to run:** Supabase SQL Editor
**What to get:** Settings → API → service_role (long JWT token)
**What to run:**
```sql
SELECT vault.create_secret('YOUR_KEY_HERE', 'supabase_service_key');
```
**Verify:**
```sql
SELECT * FROM vault.secrets WHERE name = 'supabase_service_key';
```

---

## ✅ After This Step

Continue to **Phase 6: Deploy Edge Function**

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-ID
supabase functions deploy send-price-alert-notification
```

---

**Need help?** Check the full guide: `PUSH_NOTIFICATIONS_SETUP.md`
