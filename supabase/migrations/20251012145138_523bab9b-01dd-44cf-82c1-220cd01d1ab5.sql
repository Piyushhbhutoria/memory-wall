-- Fix reactions DELETE policy to check author ownership
DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;

CREATE POLICY "Users can delete their own reactions"
ON reactions 
FOR DELETE 
USING (
  -- Allow deletion only if the fingerprint matches
  author_fingerprint = current_setting('app.current_fingerprint', true)
);

-- Add server-side content validation trigger to prevent XSS
CREATE OR REPLACE FUNCTION validate_content_security()
RETURNS TRIGGER AS $$
DECLARE
  dangerous_patterns text[] := ARRAY[
    '<script',
    'javascript:',
    'onerror=',
    'onload=',
    'onclick=',
    'onmouseover=',
    'onfocus=',
    'onblur=',
    'onchange=',
    'data:text/html',
    '<iframe',
    '<object',
    '<embed'
  ];
  pattern text;
BEGIN
  -- Check content field for dangerous patterns
  IF NEW.content IS NOT NULL THEN
    FOREACH pattern IN ARRAY dangerous_patterns
    LOOP
      IF LOWER(NEW.content) LIKE '%' || pattern || '%' THEN
        RAISE EXCEPTION 'Content contains potentially unsafe code: %', pattern;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply validation trigger to memories table
DROP TRIGGER IF EXISTS validate_memory_content ON memories;
CREATE TRIGGER validate_memory_content
  BEFORE INSERT OR UPDATE ON memories
  FOR EACH ROW 
  EXECUTE FUNCTION validate_content_security();

-- Apply validation trigger to comments table
DROP TRIGGER IF EXISTS validate_comment_content ON comments;
CREATE TRIGGER validate_comment_content
  BEFORE INSERT OR UPDATE ON comments
  FOR EACH ROW 
  EXECUTE FUNCTION validate_content_security();