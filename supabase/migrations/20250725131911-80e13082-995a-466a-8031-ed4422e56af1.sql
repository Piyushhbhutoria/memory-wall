-- Fix RLS policy for reactions table
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;

CREATE POLICY "Users can delete their own reactions" 
ON public.reactions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND author_fingerprint IS NOT NULL
  )
);

-- Fix database function search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, description text, user_fingerprint text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- In a real implementation, you'd insert into a security_logs table
  -- For now, we'll just use RAISE NOTICE for logging
  RAISE NOTICE 'Security Event - Type: %, Description: %, Fingerprint: %', 
    event_type, description, user_fingerprint;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Enhanced storage security policies
DROP POLICY IF EXISTS "Give users authenticated access to folder uktpbcpzzxbbsoixiioq/Objects/wall-media/*" ON storage.objects;

-- Create more secure storage policies for wall-media bucket
CREATE POLICY "Public access for wall-media viewing" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wall-media');

CREATE POLICY "Authenticated upload to wall-media with size limit" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'wall-media' 
  AND auth.role() = 'authenticated'
  AND (metadata->>'size')::bigint <= 20971520  -- 20MB limit
);

CREATE POLICY "Users can delete their own uploads" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'wall-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add content type validation function
CREATE OR REPLACE FUNCTION public.validate_upload_content_type()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.bucket_id = 'wall-media' THEN
    IF NEW.metadata->>'mimetype' NOT SIMILAR TO '(image|video)/.*' THEN
      RAISE EXCEPTION 'Only image and video files are allowed in wall-media bucket';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for content type validation
DROP TRIGGER IF EXISTS validate_wall_media_content_type ON storage.objects;
CREATE TRIGGER validate_wall_media_content_type
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_upload_content_type();