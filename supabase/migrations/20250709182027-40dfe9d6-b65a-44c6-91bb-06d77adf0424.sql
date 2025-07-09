-- Add DELETE policy for wall owners
CREATE POLICY "Wall owners can delete their walls" 
ON public.walls 
FOR DELETE 
USING (auth.uid() = host_user_id);

-- Update the existing SELECT policy to better handle inactive walls
DROP POLICY IF EXISTS "Walls are viewable by everyone" ON public.walls;

CREATE POLICY "Active walls are viewable by everyone" 
ON public.walls 
FOR SELECT 
USING (is_active = true);

-- Add policy for wall owners to view their own walls regardless of active status
CREATE POLICY "Wall owners can view their own walls" 
ON public.walls 
FOR SELECT 
USING (auth.uid() = host_user_id);