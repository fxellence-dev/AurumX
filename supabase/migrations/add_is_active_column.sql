-- =====================================================
-- Add missing is_active column to gold_rate_alerts
-- =====================================================
-- This fixes the "column ga.is_active does not exist" error
-- =====================================================

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gold_rate_alerts' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.gold_rate_alerts
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    
    COMMENT ON COLUMN public.gold_rate_alerts.is_active IS 'Whether this alert is active and should trigger notifications';
    
    RAISE NOTICE '✅ Added is_active column to gold_rate_alerts';
  ELSE
    RAISE NOTICE 'ℹ️  is_active column already exists';
  END IF;
END $$;

-- Create index for faster queries on active alerts
CREATE INDEX IF NOT EXISTS idx_gold_rate_alerts_active 
ON public.gold_rate_alerts(is_active) 
WHERE is_active = true;

-- Also ensure last_triggered_at exists (from previous migration)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gold_rate_alerts' 
    AND column_name = 'last_triggered_at'
  ) THEN
    ALTER TABLE public.gold_rate_alerts
    ADD COLUMN last_triggered_at TIMESTAMPTZ;
    
    COMMENT ON COLUMN public.gold_rate_alerts.last_triggered_at IS 'Last time this alert triggered a notification (prevents spam)';
    
    RAISE NOTICE '✅ Added last_triggered_at column to gold_rate_alerts';
  ELSE
    RAISE NOTICE 'ℹ️  last_triggered_at column already exists';
  END IF;
END $$;

-- Display current table structure
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = 'gold_rate_alerts';
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 gold_rate_alerts table now has % columns', v_count;
  RAISE NOTICE '✅ Schema update complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 You can now test with:';
  RAISE NOTICE 'UPDATE gold_prices_cache SET price_per_oz = 361000.00, fetched_at = NOW() WHERE currency = ''INR'';';
END $$;
