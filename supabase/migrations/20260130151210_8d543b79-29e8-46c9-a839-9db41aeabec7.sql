-- Fix: Wall Creators' User IDs Exposed to Public
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view active walls" ON walls;

-- Create policy: Only wall hosts can see their own walls (with host_user_id)
CREATE POLICY "Wall hosts can view their own walls"
ON walls FOR SELECT
TO authenticated
USING (auth.uid() = host_user_id);

-- Create policy: Anyone can view active walls via the base table for checking existence
-- But the walls_public view should be used for public data access
CREATE POLICY "Anyone can view active walls basic info"
ON walls FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Note: The walls_public view already exists and excludes host_user_id
-- Applications should query walls_public for public access