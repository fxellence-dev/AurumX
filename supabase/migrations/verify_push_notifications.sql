-- =====================================================
-- VERIFICATION SCRIPT: Push Notifications Setup
-- =====================================================
-- Run this to verify all components are correctly installed
-- =====================================================

DO $$
DECLARE
  v_result TEXT;
  v_count INTEGER;
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 PUSH NOTIFICATIONS SYSTEM VERIFICATION';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';

  -- 1. Check user_push_tokens table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_push_tokens'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT COUNT(*) INTO v_count FROM user_push_tokens;
    RAISE NOTICE '✅ 1. user_push_tokens table exists (% tokens registered)', v_count;
  ELSE
    RAISE NOTICE '❌ 1. user_push_tokens table MISSING';
  END IF;

  -- 2. Check notification_logs table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_logs'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT COUNT(*) INTO v_count FROM notification_logs;
    RAISE NOTICE '✅ 2. notification_logs table exists (% logs)', v_count;
  ELSE
    RAISE NOTICE '❌ 2. notification_logs table MISSING';
  END IF;

  -- 3. Check is_active column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gold_rate_alerts' 
    AND column_name = 'is_active'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ 3. gold_rate_alerts.is_active column exists';
  ELSE
    RAISE NOTICE '❌ 3. gold_rate_alerts.is_active column MISSING';
  END IF;

  -- 4. Check last_triggered_at column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gold_rate_alerts' 
    AND column_name = 'last_triggered_at'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ 4. gold_rate_alerts.last_triggered_at column exists';
  ELSE
    RAISE NOTICE '❌ 4. gold_rate_alerts.last_triggered_at column MISSING';
  END IF;

  -- 5. Check send_alert_notification function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'send_alert_notification'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ 5. send_alert_notification() function exists';
    
    -- Check if it uses Vault
    SELECT pg_get_functiondef(oid) INTO v_result
    FROM pg_proc WHERE proname = 'send_alert_notification';
    
    IF v_result LIKE '%vault.decrypted_secrets%' THEN
      RAISE NOTICE '   ✅ Function uses Vault for service key';
    ELSE
      RAISE NOTICE '   ⚠️  Function NOT using Vault (uses current_setting)';
    END IF;
  ELSE
    RAISE NOTICE '❌ 5. send_alert_notification() function MISSING';
  END IF;

  -- 6. Check check_price_alerts function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'check_price_alerts'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ 6. check_price_alerts() function exists';
  ELSE
    RAISE NOTICE '❌ 6. check_price_alerts() function MISSING';
  END IF;

  -- 7. Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_check_price_alerts'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT tgenabled = 'O' INTO v_exists
    FROM pg_trigger 
    WHERE tgname = 'trigger_check_price_alerts';
    
    IF v_exists THEN
      RAISE NOTICE '✅ 7. trigger_check_price_alerts exists and ENABLED';
    ELSE
      RAISE NOTICE '⚠️  7. trigger_check_price_alerts exists but DISABLED';
    END IF;
  ELSE
    RAISE NOTICE '❌ 7. trigger_check_price_alerts MISSING';
  END IF;

  -- 8. Check pg_net extension
  SELECT EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ 8. pg_net extension installed';
  ELSE
    RAISE NOTICE '❌ 8. pg_net extension MISSING';
  END IF;

  -- 9. Check Vault secret
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets 
    WHERE name = 'supabase_service_key'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT LENGTH(decrypted_secret) INTO v_count
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_service_key';
    
    IF v_count >= 40 THEN
      RAISE NOTICE '✅ 9. Vault service key exists (length: % chars)', v_count;
    ELSE
      RAISE NOTICE '⚠️  9. Vault service key too short (length: % chars)', v_count;
    END IF;
  ELSE
    RAISE NOTICE '❌ 9. Vault service key NOT FOUND';
  END IF;

  -- 10. Check indexes
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE tablename = 'gold_rate_alerts'
  AND indexname IN ('idx_gold_rate_alerts_active', 'idx_gold_rate_alerts_currency_active');
  
  IF v_count = 2 THEN
    RAISE NOTICE '✅ 10. Performance indexes created (% indexes)', v_count;
  ELSE
    RAISE NOTICE '⚠️  10. Some performance indexes missing (found % of 2)', v_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 SYSTEM STATUS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Count active alerts
  SELECT COUNT(*) INTO v_count
  FROM gold_rate_alerts
  WHERE is_active = true;
  RAISE NOTICE '📋 Active alerts: %', v_count;
  
  -- Count registered tokens
  SELECT COUNT(*) INTO v_count
  FROM user_push_tokens
  WHERE platform = 'ios';
  RAISE NOTICE '📱 iOS push tokens: %', v_count;
  
  -- Count sent notifications
  SELECT COUNT(*) INTO v_count
  FROM notification_logs;
  RAISE NOTICE '📨 Total notifications sent: %', v_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Verification complete!';
  
END $$;
