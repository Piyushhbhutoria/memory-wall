-- Fix function search path issues identified by linter
-- Update existing functions to have proper search_path

CREATE OR REPLACE FUNCTION public.mask_user_id(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN user_id = auth.uid() THEN user_id::TEXT
    ELSE 'user_' || encode(digest(user_id::TEXT, 'sha256'), 'hex')::TEXT
  END;
$$;

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
  -- This is a placeholder for more sophisticated detection
  -- In production, you'd check against activity logs
  
  -- Simple rate limiting check
  IF activity_type = 'memory_creation' THEN
    -- Allow max 5 memories per fingerprint per minute
    RETURN FALSE; -- For now, always allow
  END IF;
  
  IF activity_type = 'failed_auth' THEN
    -- In production, check failed auth attempts
    RETURN FALSE; -- For now, always allow
  END IF;
  
  RETURN FALSE;
END;
$$;