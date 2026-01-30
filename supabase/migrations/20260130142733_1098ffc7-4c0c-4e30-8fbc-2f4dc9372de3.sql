-- Create a public view for walls that excludes host_user_id
CREATE VIEW public.walls_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  theme_color,
  cover_photo_url,
  created_at,
  expires_at,
  is_paid,
  max_memories,
  is_active
FROM public.walls
WHERE is_active = true;

-- Grant SELECT access on the view
GRANT SELECT ON public.walls_public TO anon, authenticated;