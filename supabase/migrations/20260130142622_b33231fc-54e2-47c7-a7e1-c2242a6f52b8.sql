-- Drop and recreate views with SECURITY INVOKER to use the querying user's permissions
DROP VIEW IF EXISTS public.memories_public;
DROP VIEW IF EXISTS public.comments_public;
DROP VIEW IF EXISTS public.reactions_public;

-- Recreate views with SECURITY INVOKER (uses querying user's permissions)
CREATE VIEW public.memories_public 
WITH (security_invoker = true) AS
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

CREATE VIEW public.comments_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  memory_id,
  created_at,
  content,
  author_name
FROM public.comments;

CREATE VIEW public.reactions_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  memory_id,
  created_at,
  emoji
FROM public.reactions;

-- Grant SELECT access on views
GRANT SELECT ON public.memories_public TO anon, authenticated;
GRANT SELECT ON public.comments_public TO anon, authenticated;
GRANT SELECT ON public.reactions_public TO anon, authenticated;