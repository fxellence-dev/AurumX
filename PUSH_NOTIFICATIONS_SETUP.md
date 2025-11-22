# 🔔 Push Notifications Setup Guide - iOS

## Overview

This guide will help you set up push notifications for AurumX iOS app, where:
- **Supabase Edge Functions** trigger notifications when gold price alerts are met
- **Expo Push Notification Service** handles delivery to iOS devices
- **Apple Push Notification Service (APNs)** delivers to devices

---

## Architecture Flow

```
Gold Price Changes → Supabase Edge Function → Expo Push API → APNs → iOS Device
```

**Detailed Flow:**
1. Gold price changes detected in database
2. Supabase Edge Function checks which alerts are triggered
3. Edge Function calls Expo Push Notification API
4. Expo routes notification through APNs
5. User receives notification on iOS device

---

## Prerequisites ✅

Before starting, ensure you have:
- [ ] Apple Developer Account ($99/year)
- [ ] Expo account (logged in as: `amitmahajan78`)
- [ ] EAS CLI installed
- [ ] App built and submitted to TestFlight (completed ✅)
- [ ] Physical iOS device (push notifications don't work in simulator)

---

## Part 1: iOS App Configuration (React Native)

### Step 1: Install Expo Notifications Package

```bash
cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile

# Install expo-notifications
npx expo install expo-notifications

# Install expo-device (to check if physical device)
npx expo install expo-device
```

### Step 2: Update app.json Configuration

Add iOS push notification configuration to your `app.json`:

```json
{
  "expo": {
    "name": "AurumX",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#D4AF37",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "ios": {
      "bundleIdentifier": "com.aurumx.mobile",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#D4AF37",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} new alerts"
    }
  }
}
```

### Step 3: Create Notification Service

Create a new file for handling notifications:

**File: `src/services/notificationService.ts`**

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  // Check if physical device (simulators don't support push notifications)
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return undefined;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If permissions denied, return
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token - permissions denied');
    return undefined;
  }

  // Get Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not found in app config');
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    
    console.log('📱 Expo Push Token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // iOS-specific configuration
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
    });
  }

  return token;
}

/**
 * Save push token to Supabase for the current user
 */
export async function savePushTokenToDatabase(
  userId: string,
  pushToken: string,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: userId,
        push_token: pushToken,
        platform: 'ios',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('Error saving push token:', error);
      throw error;
    }

    console.log('✅ Push token saved to database');
  } catch (error) {
    console.error('Failed to save push token:', error);
    throw error;
  }
}

/**
 * Remove push token when user signs out
 */
export async function removePushTokenFromDatabase(
  userId: string,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'ios');

    if (error) {
      console.error('Error removing push token:', error);
      throw error;
    }

    console.log('✅ Push token removed from database');
  } catch (error) {
    console.error('Failed to remove push token:', error);
  }
}

/**
 * Handle notification received while app is in foreground
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification tapped by user
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}
```

### Step 4: Update AuthContext to Register Push Tokens

Update your `src/contexts/AuthContext.tsx` to register for push notifications on sign in:

```typescript
import { 
  registerForPushNotificationsAsync, 
  savePushTokenToDatabase,
  removePushTokenFromDatabase 
} from '@/services/notificationService';

// In your AuthContext, after successful sign in:
const signInWithGoogle = async () => {
  try {
    // ... existing sign in logic ...
    
    // After successful sign in
    if (session?.user) {
      // Register for push notifications
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        await savePushTokenToDatabase(session.user.id, pushToken, supabase);
      }
    }
  } catch (error) {
    console.error('Sign in error:', error);
  }
};

// On sign out:
const signOut = async () => {
  try {
    if (session?.user) {
      await removePushTokenFromDatabase(session.user.id, supabase);
    }
    
    await supabase.auth.signOut();
    setSession(null);
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

### Step 5: Add Notification Listeners to App.tsx

Update your `App.tsx` to handle notifications:

```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { 
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener 
} from '@/services/notificationService';

export default function App() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Handle notification received while app is open
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      // You can show an in-app alert or update UI here
    });

    // Handle notification tapped by user
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      // Navigate to specific screen based on notification data
      const data = response.notification.request.content.data;
      if (data?.alertId) {
        // Navigate to alerts screen
        // navigation.navigate('Alerts');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // ... rest of your App component
}
```

---

## Part 2: Supabase Database Setup

### Step 6: Create Push Tokens Table

Create a new table to store user push tokens:

**SQL Migration:**

```sql
-- Create user_push_tokens table
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create index for faster lookups
CREATE INDEX idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_platform ON public.user_push_tokens(platform);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own push tokens"
  ON public.user_push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON public.user_push_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON public.user_push_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own push tokens"
  ON public.user_push_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;
```

Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qdpunpuwyyrtookkbtdh/sql

---

## Part 3: Supabase Edge Function Setup

### Step 7: Create Edge Function for Sending Notifications

Create a new Supabase Edge Function:

**File: `supabase/functions/send-price-alert-notification/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationPayload {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: any;
  badge?: number;
  priority: 'high';
  channelId: 'default';
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get request body
    const { alertId, userId, alertName, currentPrice, targetPrice, currency } = await req.json();

    console.log('Processing notification for alert:', alertId);

    // Get user's push tokens
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('user_push_tokens')
      .select('push_token, platform')
      .eq('user_id', userId)
      .eq('platform', 'ios');

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError);
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No push tokens found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine if price went above or below target
    const direction = currentPrice >= targetPrice ? 'above' : 'below';
    const emoji = direction === 'above' ? '📈' : '📉';

    // Prepare notifications
    const notifications: PushNotificationPayload[] = tokens.map((token) => ({
      to: token.push_token,
      sound: 'default',
      title: `${emoji} Gold Price Alert: ${alertName}`,
      body: `Gold is now ${direction} ${currency} ${targetPrice.toFixed(2)}/oz. Current: ${currency} ${currentPrice.toFixed(2)}`,
      data: {
        alertId,
        alertName,
        currentPrice,
        targetPrice,
        currency,
        direction,
        screen: 'Alerts', // For navigation
      },
      badge: 1,
      priority: 'high',
      channelId: 'default',
    }));

    // Send notifications to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    });

    const result = await response.json();
    console.log('Expo Push API response:', result);

    // Check for errors
    if (result.data) {
      const errors = result.data.filter((item: any) => item.status === 'error');
      if (errors.length > 0) {
        console.error('Push notification errors:', errors);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount: notifications.length,
        response: result 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 8: Deploy Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref qdpunpuwyyrtookkbtdh

# Deploy the function
supabase functions deploy send-price-alert-notification

# Test the function
supabase functions invoke send-price-alert-notification \
  --body '{
    "alertId": "test-alert-id",
    "userId": "test-user-id",
    "alertName": "Gold Above $2000",
    "currentPrice": 2050.00,
    "targetPrice": 2000.00,
    "currency": "USD"
  }'
```

---

## Part 4: Integrate with Existing Alert System

### Step 9: Update Database Trigger to Call Edge Function

Create a database function that triggers when alerts are met:

```sql
-- Create function to check alerts and send notifications
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS trigger AS $$
DECLARE
  alert_record RECORD;
  current_price DECIMAL(10,2);
BEGIN
  -- Get the current gold price for each currency
  FOR alert_record IN 
    SELECT 
      ga.*,
      gpc.price_per_oz as current_price
    FROM gold_rate_alerts ga
    JOIN gold_prices_cache gpc ON gpc.currency = ga.currency
    WHERE ga.is_active = true
  LOOP
    current_price := alert_record.current_price;
    
    -- Check if alert conditions are met
    IF (alert_record.condition = 'above' AND current_price >= alert_record.target_price) OR
       (alert_record.condition = 'below' AND current_price <= alert_record.target_price) THEN
      
      -- Call Edge Function to send notification
      PERFORM
        net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/send-price-alert-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
          ),
          body := jsonb_build_object(
            'alertId', alert_record.id,
            'userId', alert_record.user_id,
            'alertName', alert_record.alert_name,
            'currentPrice', current_price,
            'targetPrice', alert_record.target_price,
            'currency', alert_record.currency
          )
        );
      
      -- Optionally disable alert after triggering (if one-time alert)
      -- UPDATE gold_rate_alerts SET is_active = false WHERE id = alert_record.id;
      
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs when gold_prices_cache is updated
DROP TRIGGER IF EXISTS trigger_check_price_alerts ON gold_prices_cache;
CREATE TRIGGER trigger_check_price_alerts
  AFTER INSERT OR UPDATE ON gold_prices_cache
  FOR EACH ROW
  EXECUTE FUNCTION check_price_alerts();
```

### Step 10: Set Supabase Configuration

In Supabase Dashboard → Settings → API:

```sql
-- Set configuration for Edge Function URL
ALTER DATABASE postgres SET app.supabase_url = 'https://qdpunpuwyyrtookkbtdh.supabase.co';
ALTER DATABASE postgres SET app.supabase_service_key = 'YOUR_SERVICE_ROLE_KEY';
```

Or use Vault for secure storage:

```sql
SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY',
  'supabase_service_key'
);
```

---

## Part 5: Apple Developer Portal Configuration

### Step 11: Enable Push Notifications in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Identifiers**
4. Find your App ID: `com.aurumx.mobile`
5. Click **Edit**
6. Check **Push Notifications** capability
7. Click **Save**

### Step 12: Configure Push Notification Keys

**Option A: Using APNs Authentication Key (Recommended)**

1. In Apple Developer Portal → **Keys**
2. Click **+** to create new key
3. Name it "AurumX Push Notifications"
4. Check **Apple Push Notifications service (APNs)**
5. Click **Continue** → **Register**
6. **Download the .p8 file** (you can only download once!)
7. Note the **Key ID** and **Team ID**

**Upload to EAS:**
```bash
eas credentials

# Choose:
# - Platform: iOS
# - Push Notifications: APNs Key
# - Upload your .p8 file
# - Enter Key ID
# - Enter Team ID
```

**Option B: Using APNs Certificate (Legacy)**

1. In Apple Developer Portal → **Certificates**
2. Click **+** to create certificate
3. Choose **Apple Push Notification service SSL**
4. Select your App ID
5. Create CSR (Certificate Signing Request) on your Mac
6. Upload CSR
7. Download certificate
8. Upload to EAS

---

## Part 6: Build and Test

### Step 13: Rebuild App with Push Notifications

```bash
# Build new version with push notification capability
eas build --platform ios --profile production

# After build completes, submit to TestFlight
eas submit --platform ios --latest
```

### Step 14: Test Push Notifications

**Test 1: Manual Test from Expo Dashboard**

1. Go to [Expo Dashboard](https://expo.dev/)
2. Select your project: `aurumx-mobile`
3. Go to **Push Notifications** tab
4. Enter a push token (get from app logs after sign in)
5. Send test notification

**Test 2: Test from Supabase Edge Function**

```bash
# Call your edge function directly
curl -X POST \
  'https://qdpunpuwyyrtookkbtdh.supabase.co/functions/v1/send-price-alert-notification' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alertId": "test-123",
    "userId": "your-user-id",
    "alertName": "Test Alert",
    "currentPrice": 2050.00,
    "targetPrice": 2000.00,
    "currency": "USD"
  }'
```

**Test 3: End-to-End Test**

1. Install TestFlight app on your iPhone
2. Install AurumX from TestFlight
3. Sign in with Google
4. Check console logs for push token
5. Create a gold price alert
6. Manually update `gold_prices_cache` table to trigger alert:
   ```sql
   UPDATE gold_prices_cache 
   SET price_per_oz = 2050.00 
   WHERE currency = 'USD';
   ```
7. Check if notification arrives on your iPhone

---

## Part 7: Notification Customization

### Step 15: Add Notification Sounds (Optional)

1. Add custom sound file to `assets/notification-sound.wav`
2. Update `app.json`:
   ```json
   "notification": {
     "sounds": ["./assets/notification-sound.wav"]
   }
   ```
3. Update notification payload:
   ```typescript
   sound: 'notification-sound.wav'
   ```

### Step 16: Add Notification Categories (Optional)

Add action buttons to notifications:

```typescript
// In notificationService.ts
await Notifications.setNotificationCategoryAsync('alert-triggered', [
  {
    identifier: 'view',
    buttonTitle: 'View Alert',
    options: {
      opensAppToForeground: true,
    },
  },
  {
    identifier: 'dismiss',
    buttonTitle: 'Dismiss',
    options: {
      opensAppToForeground: false,
    },
  },
]);

// In notification payload
{
  categoryIdentifier: 'alert-triggered',
  // ... other fields
}
```

---

## Troubleshooting Guide

### Issue: "No push token received"
**Solution:**
- Ensure you're testing on a **physical iOS device** (not simulator)
- Check that push notification permissions are granted
- Verify `projectId` is set in `app.json` under `extra.eas.projectId`
- Check console logs for errors

### Issue: "Notification not appearing"
**Solution:**
- Check notification permissions in iOS Settings
- Verify push token is saved to database
- Check Expo Push API response for errors
- Ensure app is in background or locked screen
- Check Do Not Disturb is off

### Issue: "Edge Function not triggering"
**Solution:**
- Verify `pg_net` extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_net;`
- Check Edge Function logs: `supabase functions logs send-price-alert-notification`
- Verify database trigger is created
- Test Edge Function manually first

### Issue: "Invalid push token"
**Solution:**
- Push tokens expire - implement token refresh logic
- Ensure token format is correct: `ExponentPushToken[xxxxxxxxxxxxxx]`
- Verify token is for correct Expo project

### Issue: "APNs certificate/key issues"
**Solution:**
- Regenerate APNs key in Apple Developer Portal
- Re-upload to EAS credentials
- Rebuild app after updating credentials

---

## Security Best Practices

1. **Never expose service role key in client code**
   - Only use in Edge Functions
   - Store in Supabase Vault

2. **Validate push tokens**
   - Check token format before saving
   - Remove invalid tokens from database

3. **Rate limiting**
   - Implement rate limits on Edge Function
   - Prevent notification spam

4. **User privacy**
   - Allow users to opt-out of notifications
   - Clear tokens on sign out

5. **Token cleanup**
   - Remove expired tokens periodically
   - Handle token refresh

---

## Monitoring and Analytics

### Track Notification Performance

```sql
-- Create notifications log table
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  alert_id UUID REFERENCES gold_rate_alerts(id),
  push_token TEXT,
  status TEXT, -- 'sent', 'delivered', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log notifications in Edge Function
```

### Check Delivery Status

Use Expo Push Receipt API to check if notifications were delivered:

```typescript
// In Edge Function
const receiptIds = result.data.map(item => item.id);

// Check receipts later
const receiptResponse = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ids: receiptIds }),
});
```

---

## Quick Reference Commands

```bash
# Install notifications package
npx expo install expo-notifications expo-device

# Build with push notifications
eas build --platform ios --profile production

# Deploy Edge Function
supabase functions deploy send-price-alert-notification

# View Edge Function logs
supabase functions logs send-price-alert-notification --tail

# Test push notification (Expo Push Tool)
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxx]",
    "title": "Test",
    "body": "This is a test notification"
  }'

# Check EAS credentials
eas credentials

# Update app version and rebuild
# Update version in app.json, then:
eas build --platform ios
eas submit --platform ios --latest
```

---

## Testing Checklist

- [ ] Physical iOS device available
- [ ] App installed from TestFlight
- [ ] Push notification permissions granted
- [ ] User signed in successfully
- [ ] Push token appears in console logs
- [ ] Push token saved to `user_push_tokens` table
- [ ] Edge Function deployed successfully
- [ ] Database trigger created and active
- [ ] Manual test notification received
- [ ] Alert triggered notification received
- [ ] Notification opens correct screen when tapped
- [ ] Badge count updates correctly
- [ ] Notification sound plays
- [ ] Sign out removes push token

---

## Next Steps

1. ✅ Complete iOS setup (this guide)
2. 🔄 Test thoroughly on TestFlight
3. 📱 Add Android push notification support
4. 🎨 Customize notification UI and sounds
5. 📊 Add notification analytics
6. 🚀 Release to production

---

## Resources

- 📖 Expo Notifications: https://docs.expo.dev/push-notifications/overview/
- 📖 Supabase Edge Functions: https://supabase.com/docs/guides/functions
- 📖 APNs Documentation: https://developer.apple.com/documentation/usernotifications
- 📖 Expo Push Tool: https://expo.dev/notifications
- 💬 Expo Discord: https://chat.expo.dev/

---

## Support

If you encounter issues:
1. Check console logs in app
2. Check Supabase Edge Function logs
3. Use Expo Push Notification Tool for testing
4. Check APNs certificate/key validity
5. Verify all RLS policies are correct

Good luck! 🚀🔔
