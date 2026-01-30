-- Create a public view for memories without fingerprint exposure
CREATE VIEW public.memories_public AS
SELECT 
  id,
  wall_id,
  created_at,
  updated_at,
  media_type,
  author_name,
  type,
  content,
  media_url
FROM public.memories;

-- Create a public view for comments without fingerprint exposure
CREATE VIEW public.comments_public AS
SELECT 
  id,
  memory_id,
  created_at,
  content,
  author_name
FROM public.comments;

-- Create a public view for reactions without fingerprint exposure  
CREATE VIEW public.reactions_public AS
SELECT 
  id,
  memory_id,
  created_at,
  emoji
FROM public.reactions;

-- Grant SELECT access on views to all users
GRANT SELECT ON public.memories_public TO anon, authenticated;
GRANT SELECT ON public.comments_public TO anon, authenticated;
GRANT SELECT ON public.reactions_public TO anon, authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.memories_public IS 'Public view of memories excluding author fingerprints for privacy';
COMMENT ON VIEW public.comments_public IS 'Public view of comments excluding author fingerprints for privacy';
COMMENT ON VIEW public.reactions_public IS 'Public view of reactions excluding author fingerprints for privacy';