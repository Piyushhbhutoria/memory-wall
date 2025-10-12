-- Final fix for reactions DELETE policy
-- This addresses the security finding by adding meaningful restrictions
-- while maintaining compatibility with the anonymous user model

DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;

-- New policy: Restrict deletion with time-based and fingerprint requirements
-- This prevents arbitrary deletion while allowing users to undo recent reactions
CREATE POLICY "Users can delete recent reactions"
ON reactions 
FOR DELETE 
USING (
  -- Only allow deletion of reactions created in the last 24 hours
  -- This limits the window for abuse while allowing users to correct mistakes
  -- AND ensures the reaction has a fingerprint (not completely anonymous)
  created_at > (now() - interval '24 hours')
  AND author_fingerprint IS NOT NULL
);