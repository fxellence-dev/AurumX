# Security Guidelines

## 🔒 Sensitive Data Protection

This repository does NOT contain any real credentials or secrets. All configuration examples use placeholders.

### Files That Should NEVER Be Committed

1. **`.env`** - Contains your actual Supabase and other API keys
2. **`supabase/.temp/`** - Contains project-specific information
3. Any files with real AWS credentials
4. Any files with real API keys or tokens

These are already in `.gitignore` and should remain there.

### Setting Up Your Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual credentials in `.env`:
   - Get Supabase URL and Anon Key from: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/settings/api
   - Never commit this file

3. For production builds, use EAS Secrets:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
   ```

### AWS Credentials (for Email Notifications)

AWS credentials should be stored in:
- **Development**: Supabase Edge Function secrets (via Supabase Dashboard)
- **Never** in code or documentation files

### What's Safe to Share

✅ **Safe to make public:**
- Code structure and logic
- Documentation with placeholder values
- Migration SQL files (with placeholders)
- Configuration examples

❌ **Never share:**
- Real API keys or tokens
- Supabase project ID
- AWS access keys
- Database connection strings
- Service role keys

### Before Making This Repo Public

Run this security check:
```bash
# Check for potential secrets
git grep -i "supabase.co" | grep -v "your-project"
git grep -i "AKIA" # AWS access keys start with this
git grep -i "eyJhbGci" # JWT tokens
```

If you find any real credentials, replace them with placeholders before pushing.

### Reporting Security Issues

If you discover a security vulnerability, please email: contact@fxellence.com

Do NOT open a public issue for security vulnerabilities.
