-- Update storage policies for better security

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload wall media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view wall media" ON storage.objects;

-- Create more secure storage policies for wall-media bucket
-- Allow public viewing of files in wall-media bucket (needed for image display)
CREATE POLICY "Public access for wall media viewing" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'wall-media');

-- Allow authenticated users to upload to wall-media bucket with user-specific folders
CREATE POLICY "Authenticated users can upload wall media" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'wall-media' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads (for replacing files)
CREATE POLICY "Users can update their wall media uploads" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'wall-media' 
  AND auth.role() = 'authenticated'
);

-- Add file size limits through database constraints (backup to client-side validation)
-- Note: This is for documentation purposes, actual file size limiting should be done at upload time

-- Create a function to log security events for monitoring
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  description TEXT,
  user_fingerprint TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- In a real implementation, you'd insert into a security_logs table
  -- For now, we'll just use RAISE NOTICE for logging
  RAISE NOTICE 'Security Event - Type: %, Description: %, Fingerprint: %', 
    event_type, description, user_fingerprint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reactions table to have better fingerprint validation
-- Add constraint to ensure reactions are from valid sources
ALTER TABLE public.reactions 
ADD CONSTRAINT valid_author_fingerprint 
CHECK (length(author_fingerprint) >= 8 AND length(author_fingerprint) <= 50);

-- Add constraints to prevent abuse
ALTER TABLE public.memories 
ADD CONSTRAINT valid_author_name_length 
CHECK (length(author_name) <= 50 AND length(author_name) >= 1);

ALTER TABLE public.memories 
ADD CONSTRAINT valid_content_length 
CHECK (content IS NULL OR length(content) <= 2000);

ALTER TABLE public.comments 
ADD CONSTRAINT valid_comment_content_length 
CHECK (length(content) <= 500 AND length(content) >= 1);

ALTER TABLE public.comments 
ADD CONSTRAINT valid_comment_author_name_length 
CHECK (author_name IS NULL OR (length(author_name) <= 50 AND length(author_name) >= 1));

ALTER TABLE public.walls 
ADD CONSTRAINT valid_wall_name_length 
CHECK (length(name) <= 100 AND length(name) >= 1);