-- Fix function search path and digest function issues
-- Enable pgcrypto extension and update functions

-- Enable pgcrypto extension for digest function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update mask_user_id function with proper extension support
CREATE OR REPLACE FUNCTION public.mask_user_id(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN user_id = auth.uid() THEN user_id::TEXT
    ELSE 'user_' || substr(encode(digest(user_id::TEXT, 'sha256'), 'hex'), 1, 8)
  END;
$$;

-- Update detect_suspicious_activity function with proper search path
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  fingerprint TEXT,
  activity_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Log security check
  PERFORM public.log_security_event(
    'suspicious_activity_check',
    'Checking for suspicious activity patterns',
    fingerprint,
    jsonb_build_object('activity_type', activity_type)
  );
  
  -- Simple rate limiting check (placeholder for more sophisticated detection)
  IF activity_type = 'memory_creation' THEN
    -- Allow max 5 memories per fingerprint per minute (placeholder)
    RETURN FALSE;
  END IF;
  
  IF activity_type = 'failed_auth' THEN
    -- Check failed auth attempts (placeholder)
    RETURN FALSE;
  END IF;
  
  RETURN FALSE;
END;
$$;