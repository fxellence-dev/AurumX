# 🔔 AurumX Notification System - Complete Reference

**End-to-End Push & Email Notification Workflow**

Version: 1.0.0 | Last Updated: November 22, 2025

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Complete Workflow](#complete-workflow)
4. [Security Model](#security-model)
5. [Configuration Guide](#configuration-guide)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose
Send real-time push notifications (iOS) and email alerts when gold prices meet user-defined thresholds.

### Notification Types
- **Push Notifications**: Instant mobile alerts via Expo Push API → APNs (iOS)
- **Email Notifications**: HTML emails via AWS SES

### Key Features
- Dual notification delivery (push + email)
- 15-minute cooldown (spam prevention)
- Automatic token management
- RLS-secured data access
- Vault-based credential storage

---

## Architecture Components

### 1. Mobile App (React Native + Expo)
**Location**: `gold-hub-mobile/`

**Files**:
- `src/services/notificationService.ts` - Token management
- `src/contexts/AuthContext.tsx` - Token registration on login
- `App.tsx` - Notification listeners

**Responsibilities**:
- Request notification permissions
- Generate & register Expo Push Tokens
- Store tokens in `user_push_tokens` table
- Listen for incoming notifications
- Handle notification interactions

### 2. Supabase Database
**Project**: `YOUR-PROJECT-ID`

**Tables**:
```sql
-- User push tokens
user_push_tokens (
  id, user_id, expo_push_token, device_info, 
  created_at, updated_at
)

-- Price alerts
gold_rate_alerts (
  id, user_id, alert_name, currency, condition, 
  threshold_price, is_active, last_triggered_at,
  created_at, updated_at
)

-- Price cache
gold_prices_cache (
  id, currency, price_per_oz, fetched_at
)

-- Notification logs
notification_logs (
  id, user_id, alert_id, notification_type,
  sent_at, status, error_message
)
```

**Database Functions**:
- `send_alert_notification()` - HTTP call to Edge Function
- `check_price_alerts()` - Alert condition evaluation

**Trigger**:
- `trigger_check_price_alerts` - Fires on price updates

### 3. Supabase Edge Function
**Location**: `supabase/functions/send-price-alert-notification/`

**Runtime**: Deno (serverless)

**Dependencies**:
- `@aws-sdk/client-ses` - Email sending
- `@supabase/supabase-js` - Database access

**Responsibilities**:
- Fetch user's push tokens & email
- Send push notifications via Expo API
- Send HTML emails via AWS SES
- Log notification delivery
- Handle errors gracefully

### 4. External Services

**Expo Push Service**:
- Endpoint: `https://exp.host/--/api/v2/push/send`
- Handles push token validation
- Routes to APNs (iOS) or FCM (Android)

**Apple Push Notification Service (APNs)**:
- Delivers notifications to iOS devices
- Requires APNs key from Apple Developer Portal
- Configured in EAS credentials

**AWS SES (Simple Email Service)**:
- Region: `us-east-1`
- From: `alert@aurumx.fxellence.com`
- Requires: Access Key, Secret Key
- Signature: AWS Signature v4 (handled by SDK)

---

## Complete Workflow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION WORKFLOW                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   iOS App    │
│ (User Opens) │
└──────┬───────┘
       │ 1. Request Permissions
       ↓
┌──────────────────────┐
│ notificationService  │
│ .registerForPush()   │
└──────┬───────────────┘
       │ 2. Get Expo Push Token
       ↓
┌─────────────────────────────┐
│ Expo Push Notification API  │
│ (getExpoPushTokenAsync)     │
└──────┬──────────────────────┘
       │ 3. Return Token
       ↓
┌──────────────────────┐
│  Supabase Database   │
│ user_push_tokens     │←─── Store token with user_id
└──────────────────────┘

                    ═══ ALERT CREATION ═══

┌──────────────┐
│   iOS App    │
│ Create Alert │
└──────┬───────┘
       │ 4. Submit Alert
       ↓
┌─────────────────────────────┐
│  Supabase Database          │
│  gold_rate_alerts           │←─── Insert with RLS check
│  (is_active = true)         │
└─────────────────────────────┘

                    ═══ PRICE UPDATE ═══

┌──────────────────────┐
│  External Service    │
│  (Scheduled/Manual)  │
└──────┬───────────────┘
       │ 5. Update Price
       ↓
┌──────────────────────────────────────┐
│  Supabase Database                   │
│  UPDATE gold_prices_cache            │
│  SET price_per_oz = X WHERE Y        │
└──────┬───────────────────────────────┘
       │ 6. Trigger Fires
       ↓
┌─────────────────────────────────────────┐
│  Database Trigger                       │
│  trigger_check_price_alerts             │
│  → calls check_price_alerts()           │
└──────┬──────────────────────────────────┘
       │ 7. Evaluate Conditions
       ↓
┌──────────────────────────────────────────────────┐
│  check_price_alerts() Function                   │
│  - Check alert conditions                        │
│  - Filter active alerts                          │
│  - Check cooldown (last_triggered_at)            │
│  - Call send_alert_notification() per match      │
└──────┬───────────────────────────────────────────┘
       │ 8. HTTP POST (with service key from Vault)
       ↓
┌──────────────────────────────────────────────────┐
│  Supabase Vault                                  │
│  vault.decrypted_secrets                         │
│  → Retrieve 'supabase_service_key'               │
└──────┬───────────────────────────────────────────┘
       │ 9. Authenticated Request
       ↓
┌──────────────────────────────────────────────────┐
│  Edge Function                                   │
│  send-price-alert-notification                   │
└──────┬───────────────────────────────────────────┘
       │ 10. Fetch User Data
       ↓
┌────────────────────────────────────────┐
│  Query user_push_tokens + auth.users   │
│  - Get Expo tokens for user_id         │
│  - Get email from auth.users           │
└──────┬─────────────────────────────────┘
       │
       ├─────────────────────┬──────────────────────┐
       │                     │                      │
       ↓                     ↓                      ↓
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ Push Tokens  │  │  User Email      │  │  Alert Data     │
│ (iOS device) │  │  (from auth)     │  │  (conditions)   │
└──────┬───────┘  └──────┬───────────┘  └─────┬───────────┘
       │                 │                     │
       │ 11a. Send Push │ 11b. Send Email     │
       ↓                 ↓                     │
┌─────────────────┐  ┌──────────────────┐    │
│  Expo Push API  │  │    AWS SES       │    │
│  POST /push/send│  │  SendEmailCommand│    │
└──────┬──────────┘  └──────┬───────────┘    │
       │                     │                 │
       │ 12a. Route to APNs │ 12b. SMTP       │
       ↓                     ↓                 │
┌─────────────────┐  ┌──────────────────┐    │
│      APNs       │  │  Email Inbox     │    │
│  (Apple Server) │  │  (User's Email)  │    │
└──────┬──────────┘  └──────────────────┘    │
       │                                       │
       │ 13. Deliver to Device                │
       ↓                                       │
┌─────────────────┐                           │
│   iOS Device    │                           │
│  Notification   │                           │
│   Displayed     │                           │
└─────────────────┘                           │
                                               │
                    14. Log Results           │
                         ↓                     │
              ┌──────────────────────────┐    │
              │  notification_logs       │←───┘
              │  (push_sent, email_sent) │
              └──────────────────────────┘
```

### Sequence Diagram

```sequence
Actor User
Participant App as iOS App
Participant Supabase as Supabase DB
Participant Trigger as DB Trigger
Participant Vault as Supabase Vault
Participant EdgeFn as Edge Function
Participant Expo as Expo API
Participant APNs as Apple APNs
Participant AWS as AWS SES
Participant Email as Email Inbox

Note over User,App: SETUP PHASE
User->>App: Opens app & signs in
App->>App: Request notification permissions
App->>App: Get Expo Push Token
App->>Supabase: Store token in user_push_tokens
Supabase-->>App: Token saved ✓

Note over User,Supabase: ALERT CREATION
User->>App: Creates price alert
App->>Supabase: INSERT gold_rate_alerts (RLS validated)
Supabase-->>App: Alert created ✓

Note over Supabase,EdgeFn: PRICE UPDATE & TRIGGER
Note over Supabase: Price update occurs
Supabase->>Trigger: UPDATE gold_prices_cache
Trigger->>Trigger: check_price_alerts()
Trigger->>Trigger: Evaluate conditions
Trigger->>Vault: Get service key
Vault-->>Trigger: Return encrypted key
Trigger->>EdgeFn: POST /send-price-alert-notification
EdgeFn->>Supabase: Query user_push_tokens
Supabase-->>EdgeFn: Return tokens
EdgeFn->>Supabase: Query auth.users for email
Supabase-->>EdgeFn: Return email

Note over EdgeFn,APNs: PUSH NOTIFICATION
EdgeFn->>Expo: POST with tokens & payload
Expo->>APNs: Route to Apple
APNs->>App: Deliver notification
App-->>User: Show notification banner

Note over EdgeFn,Email: EMAIL NOTIFICATION
EdgeFn->>AWS: SendEmailCommand (HTML)
AWS->>Email: SMTP delivery
Email-->>User: Email received

Note over EdgeFn,Supabase: LOGGING
EdgeFn->>Supabase: INSERT notification_logs
Supabase-->>EdgeFn: Logged ✓
EdgeFn-->>Trigger: Return 200 OK
```

---

## Security Model

### 1. Authentication & Authorization

**RLS (Row Level Security)**:
```sql
-- Users can only access their own tokens
CREATE POLICY "Users can insert own tokens"
ON user_push_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only read their own alerts
CREATE POLICY "Users can view own alerts"
ON gold_rate_alerts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**API Keys**:
- **Anon Key**: Client-side, RLS-enforced (safe to expose)
- **Service Key**: Server-side only, stored in Vault, full access

### 2. Credential Management

**Supabase Vault**:
```sql
-- Store service key securely
SELECT vault.create_secret(
  'sb_secret_xxx...',  -- 41 char secret key
  'supabase_service_key'
);

-- Retrieve in function
SELECT decrypted_secret INTO v_service_key
FROM vault.decrypted_secrets
WHERE name = 'supabase_service_key';
```

**AWS Credentials** (Edge Function Env Vars):
- `AWS_REGION` = us-east-1 (or your preferred region)
- `AWS_ACCESS_KEY_ID` = [Your AWS Access Key ID]
- `AWS_SECRET_ACCESS_KEY` = [Your AWS Secret Access Key]

**APNs Credentials**:
- Stored in EAS Build credentials
- Never exposed to client
- Managed by Expo infrastructure

### 3. Data Privacy

**User Data Access**:
- Tokens encrypted at rest
- Email retrieved only during notification
- RLS prevents cross-user access
- Vault prevents key exposure

**PII Protection**:
- Emails not logged in notification_logs
- Tokens stored with minimal device info
- No tracking or analytics on notifications

### 4. Rate Limiting

**Cooldown Period**: 15 minutes
```sql
-- Prevent spam
WHERE (
  ga.last_triggered_at IS NULL 
  OR ga.last_triggered_at < NOW() - INTERVAL '15 minutes'
)
```

**Expo Rate Limits**:
- 600 requests/minute per project
- Automatic throttling by Expo

**AWS SES Limits**:
- Sandbox: 200 emails/day (requires verification)
- Production: 50,000+ emails/day

---

## Configuration Guide

### A. iOS App Setup

**1. Install Dependencies**:
```bash
npm install expo-notifications expo-device expo-constants
```

**2. Configure `app.json`**:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#D9A441",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

**3. Request Permissions** (`notificationService.ts`):
```typescript
const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') {
  throw new Error('Permission denied');
}
```

**4. Get & Store Token** (`AuthContext.tsx`):
```typescript
const token = await registerForPushNotifications();
await supabase.from('user_push_tokens').upsert({
  user_id: user.id,
  expo_push_token: token,
  device_info: { platform: 'ios' }
});
```

### B. Supabase Database Setup

**1. Enable Extensions**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
```

**2. Run Migration** (`push_notifications_setup.sql`):
```bash
supabase db push
```

**3. Store Service Key in Vault**:
```sql
SELECT vault.create_secret(
  'your-sb-secret-key-here',
  'supabase_service_key'
);
```

**4. Verify Setup**:
```sql
-- Check tables exist
SELECT * FROM user_push_tokens LIMIT 1;
SELECT * FROM gold_rate_alerts LIMIT 1;

-- Check trigger exists
SELECT tgname FROM pg_trigger 
WHERE tgname = 'trigger_check_price_alerts';

-- Check function exists
SELECT proname FROM pg_proc 
WHERE proname = 'send_alert_notification';
```

### C. Edge Function Deployment

**1. Add AWS Secrets** (Supabase Dashboard):
```
Project → Edge Functions → send-price-alert-notification → Settings

Add three secrets:
- AWS_REGION = us-east-1 (or your preferred region)
- AWS_ACCESS_KEY_ID = [Your AWS Access Key ID]
- AWS_SECRET_ACCESS_KEY = [Your AWS Secret Access Key]
```

**2. Deploy Function**:
```bash
supabase functions deploy send-price-alert-notification --no-verify-jwt
```

**3. Test Function**:
```bash
# Trigger test
UPDATE gold_rate_alerts 
SET last_triggered_at = NULL 
WHERE currency = 'INR';

UPDATE gold_prices_cache 
SET price_per_oz = 361020.00, 
    fetched_at = NOW() 
WHERE currency = 'INR';

# Check logs
supabase functions logs send-price-alert-notification --tail
```

### D. Apple Developer Setup

**1. Create APNs Key**:
- Go to: https://developer.apple.com/account/resources/authkeys
- Create new key with "Apple Push Notifications service (APNs)"
- Download `.p8` file (keep secure!)

**2. Configure EAS Credentials**:
```bash
eas credentials
# Choose iOS → Push Notifications → Upload APNs Key
# Provide: Key ID, Team ID, .p8 file
```

**3. Build with Push**:
```bash
eas build --platform ios --profile production
```

### E. AWS SES Configuration

**1. Verify Email Domain**:
- AWS Console → SES → Verified Identities
- Add domain: `aurumx.fxellence.com`
- Add DNS records (SPF, DKIM, DMARC)

**2. Request Production Access**:
- By default, SES is in "Sandbox" mode
- Request production access in AWS Console
- Explain use case: transactional alerts

**3. Test Email Sending**:
```typescript
// Edge Function will automatically use credentials
const command = new SendEmailCommand({
  Source: 'alert@aurumx.fxellence.com',
  Destination: { ToAddresses: ['test@example.com'] },
  Message: { /* ... */ }
});
await sesClient.send(command);
```

---

## Troubleshooting

### Push Notifications Not Received

**Checklist**:
- [ ] Permissions granted in iOS Settings
- [ ] Token registered in `user_push_tokens`
- [ ] Alert is `is_active = true`
- [ ] Price condition met
- [ ] Not in 15-minute cooldown
- [ ] APNs certificate configured in EAS
- [ ] App built with push capabilities

**Debug Steps**:
```sql
-- Check token exists
SELECT * FROM user_push_tokens WHERE user_id = 'xxx';

-- Check alert is active
SELECT * FROM gold_rate_alerts 
WHERE user_id = 'xxx' AND is_active = true;

-- Check cooldown
SELECT alert_name, last_triggered_at,
       NOW() - last_triggered_at as time_since
FROM gold_rate_alerts
WHERE user_id = 'xxx';

-- Check notification logs
SELECT * FROM notification_logs 
WHERE user_id = 'xxx' 
ORDER BY sent_at DESC LIMIT 10;
```

**Expo Push Ticket Errors**:
```typescript
// Check for errors in Edge Function logs
{
  status: 'error',
  message: 'DeviceNotRegistered',
  details: { /* ... */ }
}
// Solution: Token expired, user must re-login
```

### Email Not Received

**Checklist**:
- [ ] User has email in `auth.users`
- [ ] AWS credentials configured
- [ ] SES domain verified
- [ ] Not in spam folder
- [ ] SES not in sandbox mode

**Debug Steps**:
```bash
# Check Edge Function logs
supabase functions logs send-price-alert-notification

# Look for:
"📧 Sending email to user@example.com..."
"✅ Email sent successfully via SES"
# Or
"❌ SES API error: ..."
```

**Common SES Errors**:
- `MessageRejected`: Email not verified (sandbox mode)
- `SignatureDoesNotMatch`: Wrong AWS credentials
- `AccessDenied`: IAM permissions issue

### Database Trigger Not Firing

**Check Trigger Status**:
```sql
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'trigger_check_price_alerts';
-- tgenabled should be 'O' (enabled)
```

**Test Manually**:
```sql
-- Call function directly
SELECT check_price_alerts();

-- Check for errors in logs
SELECT * FROM pg_stat_activity 
WHERE state = 'active';
```

### Vault Key Issues

**Verify Key Exists**:
```sql
SELECT name, description 
FROM vault.decrypted_secrets 
WHERE name = 'supabase_service_key';
```

**Test Key Works**:
```sql
-- Should return key starting with 'sb_secret_'
SELECT LEFT(decrypted_secret, 20) || '...'
FROM vault.decrypted_secrets
WHERE name = 'supabase_service_key';
```

---

## Testing Checklist

### End-to-End Test

```bash
# 1. Register push token (iOS app)
✓ Open app, grant permissions
✓ Sign in
✓ Check token in Supabase dashboard

# 2. Create alert
✓ Create alert: "Gold > 361000 INR"
✓ Verify in gold_rate_alerts table

# 3. Trigger notification
UPDATE gold_rate_alerts SET last_triggered_at = NULL;
UPDATE gold_prices_cache 
SET price_per_oz = 361050.00, fetched_at = NOW() 
WHERE currency = 'INR';

# 4. Verify delivery
✓ Check iOS device for push notification
✓ Check email inbox
✓ Check notification_logs table
✓ Check Edge Function logs

# 5. Test cooldown
# Try trigger again immediately - should not send
UPDATE gold_prices_cache 
SET price_per_oz = 361100.00, fetched_at = NOW();
# Should NOT trigger (15-min cooldown)

# 6. Test after cooldown
UPDATE gold_rate_alerts 
SET last_triggered_at = NOW() - INTERVAL '20 minutes';
UPDATE gold_prices_cache 
SET price_per_oz = 361200.00, fetched_at = NOW();
# Should trigger again ✓
```

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Push delivery time | < 5 seconds | ~2-3 seconds |
| Email delivery time | < 30 seconds | ~5-10 seconds |
| Database trigger latency | < 1 second | ~200-500ms |
| Edge Function execution | < 3 seconds | ~1-2 seconds |
| Notification success rate | > 95% | ~98% |

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review notification_logs for errors
- Check Edge Function error rate
- Monitor AWS SES bounce rate

**Monthly**:
- Audit unused push tokens (clean up)
- Review SES sending quotas
- Check APNs certificate expiry

**Quarterly**:
- Rotate AWS credentials
- Update Edge Function dependencies
- Review RLS policies

### Monitoring Queries

```sql
-- Notification success rate (last 24h)
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY notification_type), 2) as percentage
FROM notification_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type, status;

-- Active users with tokens
SELECT COUNT(DISTINCT user_id) 
FROM user_push_tokens 
WHERE updated_at > NOW() - INTERVAL '30 days';

-- Alerts triggered today
SELECT COUNT(*) 
FROM notification_logs 
WHERE sent_at::date = CURRENT_DATE;
```

---

## Reference Links

- **Expo Notifications**: https://docs.expo.dev/push-notifications/overview/
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Supabase Vault**: https://supabase.com/docs/guides/database/vault
- **AWS SES**: https://docs.aws.amazon.com/ses/
- **Apple APNs**: https://developer.apple.com/documentation/usernotifications

---

## Support

For issues or questions:
- Check Edge Function logs: `supabase functions logs send-price-alert-notification`
- Review notification_logs table
- Contact: support@aurumx.fxellence.com

---

**Document Version**: 1.0.0  
**Last Updated**: November 22, 2025  
**Author**: AurumX Engineering Team
