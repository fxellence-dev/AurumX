-- =====================================================
-- Push Notifications Setup for AurumX
-- =====================================================
-- This migration creates the necessary tables and triggers
-- for push notifications triggered by gold price alerts
-- =====================================================

-- 1. Create user_push_tokens table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON public.user_push_tokens(platform);

-- Add comments for documentation
COMMENT ON TABLE public.user_push_tokens IS 'Stores Expo push tokens for users to receive notifications';
COMMENT ON COLUMN public.user_push_tokens.push_token IS 'Expo Push Token in format: ExponentPushToken[xxxxxx]';
COMMENT ON COLUMN public.user_push_tokens.platform IS 'Device platform: ios or android';

-- 2. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.user_push_tokens;

-- Create RLS policies
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

-- 3. Grant permissions
-- =====================================================
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;

-- 4. Enable pg_net extension (required for HTTP requests)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5. Create function to send push notifications via Edge Function
-- =====================================================
-- Note: This function uses Supabase Vault to securely retrieve the service role key
-- You'll need to store your service_role key in Vault after running this migration
CREATE OR REPLACE FUNCTION public.send_alert_notification(
  p_alert_id UUID,
  p_user_id UUID,
  p_alert_name TEXT,
  p_current_price DECIMAL(10,2),
  p_target_price DECIMAL(10,2),
  p_currency TEXT,
  p_condition TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT := 'https://qdpunpuwyyrtookkbtdh.supabase.co';
  v_service_key TEXT;
  v_response_id BIGINT;
BEGIN
  -- Get service key from Supabase Vault
  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_key';

  -- Only proceed if we have a service key
  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING 'No service key found in vault. Please store it using: SELECT vault.create_secret(''YOUR_KEY'', ''supabase_service_key'');';
    RETURN;
  END IF;

  -- Call Edge Function to send notification
  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/send-price-alert-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'alertId', p_alert_id,
      'userId', p_user_id,
      'alertName', p_alert_name,
      'currentPrice', p_current_price,
      'targetPrice', p_target_price,
      'currency', p_currency,
      'condition', p_condition
    ),
    timeout_milliseconds := 30000
  ) INTO v_response_id;

  -- Log the request
  RAISE NOTICE 'Push notification request sent for alert: % (request_id: %)', p_alert_id, v_response_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.send_alert_notification IS 'Sends push notification via Supabase Edge Function when alert is triggered';

-- 6. Create trigger function to check alerts and send notifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_price_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_record RECORD;
  current_price DECIMAL(10,2);
BEGIN
  -- Only process if price actually changed
  IF (TG_OP = 'UPDATE' AND OLD.price_per_oz = NEW.price_per_oz) THEN
    RETURN NEW;
  END IF;

  -- Get the currency from the updated/inserted row
  current_price := NEW.price_per_oz;

  -- Check all active alerts for this currency
  FOR alert_record IN 
    SELECT 
      ga.id,
      ga.user_id,
      ga.alert_name,
      ga.target_price,
      ga.currency,
      ga.condition,
      ga.enabled,
      ga.last_triggered_at
    FROM public.gold_rate_alerts ga
    WHERE ga.currency = NEW.currency
      AND ga.enabled = true
  LOOP
    -- Check if alert conditions are met
    IF (alert_record.condition = 'above' AND current_price >= alert_record.target_price) OR
       (alert_record.condition = 'below' AND current_price <= alert_record.target_price) THEN
      
      -- Avoid sending duplicate notifications (wait at least 15 minutes)
      IF alert_record.last_triggered_at IS NULL OR 
         alert_record.last_triggered_at < NOW() - INTERVAL '15 minutes' THEN
        
        -- Send notification (async, won't block)
        PERFORM public.send_alert_notification(
          alert_record.id,
          alert_record.user_id,
          alert_record.alert_name,
          current_price,
          alert_record.target_price,
          alert_record.currency,
          alert_record.condition
        );
        
        -- Update last_triggered_at timestamp
        UPDATE public.gold_rate_alerts 
        SET last_triggered_at = NOW()
        WHERE id = alert_record.id;
        
        RAISE NOTICE 'Alert triggered: % (user: %, price: %)', 
          alert_record.alert_name, alert_record.user_id, current_price;
      ELSE
        RAISE NOTICE 'Alert % recently triggered, skipping notification', alert_record.id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.check_price_alerts IS 'Checks if any alerts are triggered when gold prices update';

-- 7. Add required columns to gold_rate_alerts if not exists
-- =====================================================

-- Add is_active column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gold_rate_alerts' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.gold_rate_alerts 
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    
    COMMENT ON COLUMN public.gold_rate_alerts.is_active IS 'Whether this alert is active and should trigger notifications';
    
    RAISE NOTICE '✅ Added is_active column to gold_rate_alerts';
  END IF;
END $$;

-- Add last_triggered_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gold_rate_alerts' 
    AND column_name = 'last_triggered_at'
  ) THEN
    ALTER TABLE public.gold_rate_alerts 
    ADD COLUMN last_triggered_at TIMESTAMPTZ;
    
    COMMENT ON COLUMN public.gold_rate_alerts.last_triggered_at IS 'Last time this alert triggered a notification (prevents spam)';
    
    RAISE NOTICE '✅ Added last_triggered_at column to gold_rate_alerts';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gold_rate_alerts_active 
ON public.gold_rate_alerts(is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gold_rate_alerts_currency_active 
ON public.gold_rate_alerts(currency, is_active) 
WHERE is_active = true;

-- 8. Create trigger on gold_prices_cache
-- =====================================================
DROP TRIGGER IF EXISTS trigger_check_price_alerts ON public.gold_prices_cache;

CREATE TRIGGER trigger_check_price_alerts
  AFTER INSERT OR UPDATE OF price_per_oz ON public.gold_prices_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.check_price_alerts();

COMMENT ON TRIGGER trigger_check_price_alerts ON public.gold_prices_cache IS 'Triggers alert checks when gold prices are updated';

-- 9. Create notification logs table (optional, for analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.gold_rate_alerts(id) ON DELETE CASCADE,
  push_token TEXT,
  notification_title TEXT,
  notification_body TEXT,
  status TEXT CHECK (status IN ('sent', 'delivered', 'failed', 'error')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_alert_id ON public.notification_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);

COMMENT ON TABLE public.notification_logs IS 'Logs all push notifications sent for analytics and debugging';

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notification logs
CREATE POLICY "Users can view their own notification logs"
  ON public.notification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;

-- 10. Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Push notifications setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Store your service_role key in Vault (get from Settings → API):';
  RAISE NOTICE '   SELECT vault.create_secret(''YOUR_SERVICE_ROLE_KEY_HERE'', ''supabase_service_key'');';
  RAISE NOTICE '';
  RAISE NOTICE '2. Deploy Edge Function:';
  RAISE NOTICE '   supabase functions deploy send-price-alert-notification';
  RAISE NOTICE '';
  RAISE NOTICE '3. Test the setup by updating gold_prices_cache table';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Tip: The Edge Function automatically has access to SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY';
END $$;
