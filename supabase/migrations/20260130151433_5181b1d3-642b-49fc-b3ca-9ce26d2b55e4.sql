-- Fix: Remove public access to walls table with host_user_id
-- Drop the policy that allows anyone to see walls (which exposes host_user_id)
DROP POLICY IF EXISTS "Anyone can view active walls basic info" ON walls;
DROP POLICY IF EXISTS "Anyone can view active walls" ON walls;

-- Keep only the host-specific policy for authenticated owners
-- The walls_public view should be used for all public access