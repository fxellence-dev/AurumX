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
    const { alertId, userId, alertName, currentPrice, targetPrice, currency, condition } = await req.json();

    console.log('📱 Processing notification for alert:', alertId);

    // Get user's push tokens
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('user_push_tokens')
      .select('push_token, platform')
      .eq('user_id', userId)
      .eq('platform', 'ios');

    if (tokenError) {
      console.error('❌ Error fetching push tokens:', tokenError);
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No push tokens found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No push tokens found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine if price went above or below target
    const direction = condition || (currentPrice >= targetPrice ? 'above' : 'below');
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
        timestamp: new Date().toISOString(),
      },
      badge: 1,
      priority: 'high',
      channelId: 'default',
    }));

    console.log(`📤 Sending ${notifications.length} notification(s)...`);

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
    console.log('✅ Expo Push API response:', result);

    // Check for errors
    if (result.data) {
      const errors = result.data.filter((item: any) => item.status === 'error');
      if (errors.length > 0) {
        console.error('⚠️ Push notification errors:', errors);
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
    console.error('❌ Error sending notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
