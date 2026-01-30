-- Fix: Remove public access to memories table with author_fingerprint
-- Drop the policy that allows anyone to see memories (which exposes author_fingerprint)
DROP POLICY IF EXISTS "Anyone can view memories" ON memories;

-- Keep only host-specific access for authenticated wall owners who need fingerprint for moderation
-- The memories_public view should be used for all public access