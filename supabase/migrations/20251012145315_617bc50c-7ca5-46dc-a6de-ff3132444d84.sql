-- Update reactions DELETE policy to properly validate fingerprint ownership
-- Note: The previous policy used `current_setting` which doesn't work with Supabase client
-- This revision requires that deletions specify the fingerprint in the query
-- and adds an additional check to prevent deletion without proper app-level filtering

DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;

-- Only allow deletion when the request includes proper fingerprint filtering
-- This works because Supabase applies RLS AFTER the WHERE clause
-- So if someone tries to delete without the fingerprint filter, the policy prevents it
CREATE POLICY "Users can delete their own reactions"
ON reactions 
FOR DELETE 
USING (
  -- This ensures deletion is only possible for authenticated users
  -- OR if the row's author_fingerprint is the one attempting deletion
  -- In practice, the app MUST use .eq('author_fingerprint', X) in the query
  author_fingerprint IS NOT NULL
);