-- =====================================================
-- Account Deletion Function for Apple App Store Compliance
-- =====================================================
-- This function allows users to delete their account
-- as required by Apple's App Store guidelines 5.1.1(v)
-- =====================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user's data
  -- Note: Related records in user_push_tokens, gold_rate_alerts, 
  -- and notification_logs will be automatically deleted via CASCADE
  DELETE FROM auth.users 
  WHERE id = auth.uid();
  
  -- Log the deletion (optional)
  RAISE NOTICE 'User account deleted: %', auth.uid();
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.delete_user IS 'Allows authenticated users to permanently delete their account and all associated data';

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Verify function was created
SELECT 
  '✅ Account deletion function created successfully' as status,
  'Users can now delete their accounts from the app' as info;
