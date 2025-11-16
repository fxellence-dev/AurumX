# RLS Security Test Guide

## Test 1: Verify RLS is Enabled

Run this in Supabase SQL Editor:

```sql
-- Check if RLS is enabled on gold_rate_alerts
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'gold_rate_alerts';
```

**Expected Result:**
- `rowsecurity` should be `true`
- If it's `false`, RLS is DISABLED and your data is exposed!

---

## Test 2: Check Policy Definitions

```sql
-- View all policies on gold_rate_alerts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'gold_rate_alerts';
```

**What to look for:**
- `qual` column should contain: `(auth.uid() = user_id)`
- `with_check` should contain: `(auth.uid() = user_id)`
- If these are NULL or different, policies aren't protecting your data!

---

## Test 3: Try to Access Another User's Data

In your mobile app, try this code:

```typescript
// This should FAIL and return empty results
const { data, error } = await supabase
  .from('gold_rate_alerts')
  .select('*')
  .neq('user_id', user.id); // Try to get OTHER users' alerts

console.log('Security Test:', {
  data: data?.length || 0,
  error: error?.message
});

// Expected result: Empty array or RLS error
// If you get other users' data, RLS is NOT working!
```

---

## Test 4: Try to Insert with Different user_id

```typescript
// This should FAIL
const { data, error } = await supabase
  .from('gold_rate_alerts')
  .insert({
    user_id: 'fake-user-id-12345', // Not your real user ID
    alert_name: 'Test Alert',
    currency: 'USD',
    condition: 'above',
    target_price: 2000,
    enabled: true
  });

console.log('Insert Test:', error?.message);

// Expected: "new row violates row-level security policy"
// If insert succeeds, RLS is NOT working!
```

---

## How to Fix Issues

### If RLS is Disabled:
```sql
ALTER TABLE gold_rate_alerts ENABLE ROW LEVEL SECURITY;
```

### If Policies are Missing Logic:
```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can view their own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can insert their own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can create own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON gold_rate_alerts;
DROP POLICY IF EXISTS "Service role has full access" ON gold_rate_alerts;

-- Create correct policies (one per operation)
CREATE POLICY "Users can view own alerts"
ON gold_rate_alerts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
ON gold_rate_alerts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
ON gold_rate_alerts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
ON gold_rate_alerts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role full access (for backend operations)
CREATE POLICY "Service role has full access"
ON gold_rate_alerts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## ✅ Your Setup Should Look Like This

After fixing:

| Policy Name | Command | Role | Definition |
|-------------|---------|------|------------|
| Users can view own alerts | SELECT | authenticated | `auth.uid() = user_id` |
| Users can insert own alerts | INSERT | authenticated | `auth.uid() = user_id` |
| Users can update own alerts | UPDATE | authenticated | `auth.uid() = user_id` |
| Users can delete own alerts | DELETE | authenticated | `auth.uid() = user_id` |
| Service role has full access | ALL | service_role | `true` |

Total: **5 policies** (one per operation + service role)

---

## Priority Actions:

1. ✅ **Enable RLS** (if currently disabled)
2. ✅ **Verify policy definitions** contain `auth.uid() = user_id`
3. ✅ **Remove duplicate policies**
4. ✅ **Run security tests** to confirm protection
