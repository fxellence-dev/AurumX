# 🔐 Environment Variables - How They Work in AurumX

## Overview

Your app uses **Expo's environment variable system** to securely pass configuration values (like Supabase credentials) from your `.env` file into your React Native app.

---

## 📝 How It Works

### 1. **The `.env` File** (Development)

**Location**: `/Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile/.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://qdpunpuwyyrtookkbtdh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Key Points**:
- ✅ Variables **MUST** start with `EXPO_PUBLIC_` to be accessible in your app
- ✅ This file is **NOT** committed to git (in `.gitignore`)
- ✅ Used during **local development** (`npm start`, `npx expo start`)
- ✅ Variables are **embedded into your JavaScript bundle** at build time

---

### 2. **How Expo Processes Environment Variables**

#### At Build Time (Metro Bundler):

```
┌─────────────────┐
│   .env file     │
│  EXPO_PUBLIC_*  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Metro Bundler   │ ← Reads .env file
│ (Expo's build   │ ← Replaces process.env.EXPO_PUBLIC_* 
│  system)        │   with actual values
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JavaScript      │ ← Values are now hardcoded
│ Bundle (.js)    │   in the bundle
└─────────────────┘
```

**Example**:

**Your Code** (`src/lib/supabase.ts`):
```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
```

**After Build** (in the JavaScript bundle):
```typescript
const SUPABASE_URL = "https://qdpunpuwyyrtookkbtdh.supabase.co";
```

---

### 3. **Where Variables Are Used**

#### A. Supabase Client Initialization

**File**: `src/lib/supabase.ts`

```typescript
// 1. Read from process.env (populated by Expo from .env)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// 2. Create Supabase client with these values
export const supabase = createClient<Database>(
  SUPABASE_URL,      // ← "https://qdpunpuwyyrtookkbtdh.supabase.co"
  SUPABASE_ANON_KEY, // ← "eyJhbGci..."
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

**What This Does**:
- ✅ Initializes Supabase client with your project URL
- ✅ Uses the anon key for authentication
- ✅ Configures secure storage for auth tokens (SecureStore)

---

#### B. Throughout Your App

**Any file can import the configured client**:

```typescript
// src/hooks/useAlerts.ts
import { supabase } from '@/lib/supabase';

async function fetchAlerts(userId: string) {
  const { data, error } = await supabase
    .from('gold_rate_alerts')  // ← Connects to YOUR Supabase project
    .select('*')
    .eq('user_id', userId);
    
  return data;
}
```

**The supabase client already knows**:
- Which Supabase project to connect to (from URL)
- How to authenticate requests (from anon key)

---

## 🏗️ Different Environments

### Local Development (`npm start`)

```
.env file → Metro Bundler → App Bundle → Your Phone/Simulator
```

- Uses `.env` file in project root
- Changes require restart of Metro bundler
- Hot reload works for code, but not for env vars

### EAS Production Build (`eas build`)

For your iOS TestFlight build, environment variables are handled differently:

#### Option 1: EAS Secrets (Recommended for Production)

```bash
# Set secrets in EAS (one-time setup)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://qdpunpuwyyrtookkbtdh.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGci..."
```

**Advantages**:
- ✅ Secure (never in git)
- ✅ Managed by EAS
- ✅ Different values per environment (dev/staging/production)

#### Option 2: .env File Committed (Current Approach)

Your `.env` file is **currently committed** to git, so:
- ✅ EAS build reads it automatically
- ⚠️ Values are in your git repository
- ⚠️ Anyone with repo access can see them

**This is OK for development, but not ideal for production!**

---

## 🔒 Security Considerations

### Is the Anon Key Safe to Expose?

**YES** ✅ - The anon key is **designed to be public**. Here's why:

#### 1. **Row Level Security (RLS) Protects Your Data**

Your Supabase tables have **RLS policies**:

```sql
-- Example: Users can only see their own alerts
CREATE POLICY "Users can view own alerts"
ON gold_rate_alerts
FOR SELECT
USING (auth.uid() = user_id);
```

**What This Means**:
- Even with the anon key, users can only access **their own data**
- The anon key provides basic authentication
- RLS policies enforce **authorization** (who can see what)

#### 2. **Anon Key Has Limited Permissions**

The anon key:
- ✅ Can read publicly accessible data (`gold_prices_cache`)
- ✅ Can create authenticated sessions (login)
- ✅ Can access data **only if RLS policies allow it**
- ❌ Cannot bypass RLS policies
- ❌ Cannot access service_role-only functions
- ❌ Cannot modify database schema

#### 3. **Real Security Comes From**:

- ✅ **RLS Policies**: Control who can access what data
- ✅ **Auth Sessions**: Users must be logged in to access their data
- ✅ **Service Role Key**: Secret key for admin operations (NEVER exposed)

---

## 📱 How Your App Uses These Variables

### Flow Diagram:

```
┌──────────────────────────────────────────────────────────┐
│                     App Startup                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  src/lib/supabase.ts                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ const SUPABASE_URL = process.env.EXPO_PUBLIC_...  │  │
│  │ const SUPABASE_ANON_KEY = process.env.EXPO_...    │  │
│  │                                                    │  │
│  │ export const supabase = createClient(              │  │
│  │   SUPABASE_URL,                                    │  │
│  │   SUPABASE_ANON_KEY,                               │  │
│  │   { auth: { storage: SecureStore } }               │  │
│  │ );                                                 │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  AuthProvider (src/contexts/AuthContext.tsx)             │
│  ┌────────────────────────────────────────────────────┐  │
│  │ supabase.auth.getSession()  ← Uses configured     │  │
│  │                                client              │  │
│  │ supabase.auth.signInWithOAuth({ provider: ... })  │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Throughout App                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ import { supabase } from '@/lib/supabase';        │  │
│  │                                                    │  │
│  │ supabase.from('gold_rate_alerts').select('*')    │  │
│  │         ↑                                          │  │
│  │         Uses anon key from env                     │  │
│  │         + user's auth token from SecureStore       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Common Operations

### Check Current Values (Development)

```bash
# In your terminal
echo $EXPO_PUBLIC_SUPABASE_URL
# Output: (empty - these are only in .env file, not shell)

# Check in code
# Add to any component temporarily:
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
```

### Change Environment Variables

1. **Edit `.env` file**:
   ```bash
   nano .env
   # or
   code .env
   ```

2. **Restart Metro bundler**:
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

3. **Reload app**:
   - Shake device → "Reload"
   - Or press `r` in Metro terminal

### Add New Environment Variables

1. **Add to `.env`**:
   ```env
   EXPO_PUBLIC_MY_NEW_VAR=my_value
   ```

2. **Use in code**:
   ```typescript
   const myVar = process.env.EXPO_PUBLIC_MY_NEW_VAR;
   ```

3. **Add to `.env.example`** (template for other developers):
   ```env
   EXPO_PUBLIC_MY_NEW_VAR=your-value-here
   ```

---

## ⚠️ Important Notes

### 1. **ALWAYS Use `EXPO_PUBLIC_` Prefix**

❌ **Won't Work**:
```env
SUPABASE_URL=https://...
```

✅ **Will Work**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://...
```

### 2. **Variables Are Embedded at Build Time**

- Not read dynamically at runtime
- Changing `.env` requires app restart/rebuild
- Values are **hardcoded** into JavaScript bundle

### 3. **Don't Use for Secrets in Production**

For production builds:
- ✅ Use EAS Secrets for sensitive values
- ✅ Keep service_role key **NEVER** in client app
- ✅ Use environment-specific values (dev/staging/prod)

### 4. **Current Security Status**

Your current setup:
- ✅ Anon key is safe to expose (by design)
- ✅ RLS policies protect your data
- ✅ Auth tokens stored securely (SecureStore)
- ⚠️ `.env` file is committed to git
- ⚠️ Consider using EAS Secrets for production

---

## 🎯 Summary

**How Environment Variables Flow**:

```
.env file (local)
   ↓
process.env.EXPO_PUBLIC_*
   ↓
src/lib/supabase.ts (initialization)
   ↓
Supabase client (configured)
   ↓
Used throughout app (imported)
```

**Key Points**:
- ✅ Variables start with `EXPO_PUBLIC_`
- ✅ Read from `.env` during development
- ✅ Embedded in bundle at build time
- ✅ Anon key is safe to expose (RLS protects data)
- ✅ Auth tokens stored securely in SecureStore
- ✅ Production should use EAS Secrets

---

## 🚀 Next Steps for Production

When you're ready to deploy to production:

```bash
# 1. Remove .env from git (if desired)
git rm --cached .env
echo ".env" >> .gitignore

# 2. Set up EAS Secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."

# 3. Build will automatically use EAS secrets
eas build --platform ios --profile production
```

Your app will work exactly the same, but values will be managed securely by EAS!
