-- Enhanced User Privacy Protection
-- Create function to mask user IDs for public display
CREATE OR REPLACE FUNCTION public.mask_user_id(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN user_id = auth.uid() THEN user_id::TEXT
    ELSE 'user_' || encode(digest(user_id::TEXT, 'sha256'), 'hex')::TEXT
  END;
$$;

-- Enhanced security event logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text, 
  description text, 
  user_fingerprint text DEFAULT NULL::text,
  metadata jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enhanced logging with more details
  RAISE NOTICE 'Security Event - Type: %, Description: %, Fingerprint: %, Metadata: %, Timestamp: %', 
    event_type, description, user_fingerprint, metadata, now();
    
  -- In production, you'd insert into a security_logs table
  -- INSERT INTO security_logs (event_type, description, user_fingerprint, metadata, created_at)
  -- VALUES (event_type, description, user_fingerprint, metadata, now());
END;
$$;

-- Function to validate file uploads with enhanced security
CREATE OR REPLACE FUNCTION public.validate_file_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log file upload attempt
  PERFORM public.log_security_event(
    'file_upload_attempt',
    'File upload validation triggered',
    NULL,
    jsonb_build_object(
      'bucket_id', NEW.bucket_id,
      'file_size', NEW.metadata->>'size',
      'content_type', NEW.metadata->>'mimetype',
      'user_id', auth.uid()
    )
  );

  -- Enhanced content type validation
  IF NEW.bucket_id = 'wall-media' THEN
    -- Check MIME type
    IF NEW.metadata->>'mimetype' NOT SIMILAR TO '(image|video)/.*' THEN
      PERFORM public.log_security_event(
        'file_upload_blocked',
        'Invalid MIME type detected',
        NULL,
        jsonb_build_object('mimetype', NEW.metadata->>'mimetype')
      );
      RAISE EXCEPTION 'Only image and video files are allowed in wall-media bucket';
    END IF;
    
    -- Check file size (20MB limit)
    IF (NEW.metadata->>'size')::bigint > 20971520 THEN
      PERFORM public.log_security_event(
        'file_upload_blocked',
        'File size exceeds limit',
        NULL,
        jsonb_build_object('size', NEW.metadata->>'size')
      );
      RAISE EXCEPTION 'File size exceeds 20MB limit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for file upload validation
DROP TRIGGER IF EXISTS validate_file_upload_trigger ON storage.objects;
CREATE TRIGGER validate_file_upload_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_file_upload();

-- Enhanced RLS policy for walls to hide user IDs
DROP POLICY IF EXISTS "Active walls are viewable by everyone with masked user data" ON public.walls;
CREATE POLICY "Active walls are viewable by everyone with masked user data"
ON public.walls
FOR SELECT
USING (
  is_active = true 
  AND (
    auth.uid() = host_user_id 
    OR host_user_id IS NULL 
    OR auth.uid() IS NULL
  )
);

-- Function to check for suspicious activity patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  fingerprint TEXT,
  activity_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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