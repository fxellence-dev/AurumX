// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const FROM_EMAIL = 'alert@aurumx.fxellence.com';

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

// AWS SES Helper Functions using AWS SDK v3
async function sendEmailViaSES(
  toEmail: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<boolean> {
  try {
    const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';

    if (!awsAccessKey || !awsSecretKey) {
      console.error('❌ AWS credentials not configured');
      return false;
    }

    // Use AWS SES SDK via npm
    const { SESClient, SendEmailCommand } = await import('npm:@aws-sdk/client-ses@3.x');

    const sesClient = new SESClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
      },
    });

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log('✅ Email sent successfully via SES. MessageId:', response.MessageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
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

    // Get user's push tokens AND email
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('user_push_tokens')
      .select('push_token, platform')
      .eq('user_id', userId)
      .eq('platform', 'ios');

    if (tokenError) {
      console.error('❌ Error fetching push tokens:', tokenError);
    }

    // Get user's email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('❌ Error fetching user data:', userError);
    }

    const userEmail = userData?.user?.email;
    
    if ((!tokens || tokens.length === 0) && !userEmail) {
      console.log('⚠️ No push tokens or email found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No push tokens or email found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine if price went above or below target
    const direction = condition || (currentPrice >= targetPrice ? 'above' : 'below');
    const emoji = direction === 'above' ? '📈' : '📉';

    let pushNotificationsSent = 0;
    let emailSent = false;

    // Send Push Notifications
    if (tokens && tokens.length > 0) {
      const notifications: PushNotificationPayload[] = tokens.map((token: any) => ({
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
          screen: 'Alerts',
          timestamp: new Date().toISOString(),
        },
        badge: 1,
        priority: 'high',
        channelId: 'default',
      }));

      console.log(`📤 Sending ${notifications.length} push notification(s)...`);

      try {
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

        if (result.data) {
          const errors = result.data.filter((item: any) => item.status === 'error');
          if (errors.length > 0) {
            console.error('⚠️ Push notification errors:', errors);
          } else {
            pushNotificationsSent = notifications.length;
          }
        }
      } catch (pushError) {
        console.error('❌ Error sending push notifications:', pushError);
      }
    }

    // Send Email Notification
    if (userEmail) {
      console.log(`📧 Sending email to ${userEmail}...`);

      const emailSubject = `${emoji} Gold Price Alert: ${alertName}`;
      
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: white; border-left: 4px solid #D4AF37; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .price { font-size: 24px; font-weight: bold; color: #D4AF37; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} Gold Price Alert</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your gold price alert <strong>"${alertName}"</strong> has been triggered!</p>
      
      <div class="alert-box">
        <h3>Alert Details:</h3>
        <p><strong>Alert Name:</strong> ${alertName}</p>
        <p><strong>Condition:</strong> Gold price ${direction} ${currency} ${targetPrice.toFixed(2)}/oz</p>
        <p><strong>Current Price:</strong> <span class="price">${currency} ${currentPrice.toFixed(2)}/oz</span></p>
        <p><strong>Target Price:</strong> ${currency} ${targetPrice.toFixed(2)}/oz</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>Gold is now ${direction} your target price of ${currency} ${targetPrice.toFixed(2)} per ounce.</p>
      
      <p style="text-align: center;">
        <a href="https://aurumx.fxellence.com/alerts" class="button">View All Alerts</a>
      </p>
    </div>
    <div class="footer">
      <p>You're receiving this email because you have an active price alert in AurumX.</p>
      <p>To manage your alerts, open the AurumX app on your device.</p>
      <p>&copy; 2025 AurumX. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const emailText = `
Gold Price Alert: ${alertName}

Your alert has been triggered!

Alert Details:
- Alert Name: ${alertName}
- Condition: Gold price ${direction} ${currency} ${targetPrice.toFixed(2)}/oz
- Current Price: ${currency} ${currentPrice.toFixed(2)}/oz
- Target Price: ${currency} ${targetPrice.toFixed(2)}/oz
- Time: ${new Date().toLocaleString()}

Gold is now ${direction} your target price of ${currency} ${targetPrice.toFixed(2)} per ounce.

--
AurumX
      `;

      emailSent = await sendEmailViaSES(userEmail, emailSubject, emailHtml, emailText);
    }

    // Log to notification_logs table
    try {
      await supabaseClient
        .from('notification_logs')
        .insert({
          user_id: userId,
          alert_id: alertId,
          push_token: tokens && tokens.length > 0 ? tokens[0].push_token : null,
          notification_title: `${emoji} Gold Price Alert: ${alertName}`,
          notification_body: `Gold is now ${direction} ${currency} ${targetPrice.toFixed(2)}/oz. Current: ${currency} ${currentPrice.toFixed(2)}`,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('⚠️ Error logging notification:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pushNotificationsSent,
        emailSent,
        userEmail: userEmail || 'none'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
