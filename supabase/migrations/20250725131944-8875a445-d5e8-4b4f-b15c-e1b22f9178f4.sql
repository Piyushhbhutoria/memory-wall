-- Fix remaining function search path issues
CREATE OR REPLACE FUNCTION public.validate_upload_content_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.bucket_id = 'wall-media' THEN
    IF NEW.metadata->>'mimetype' NOT SIMILAR TO '(image|video)/.*' THEN
      RAISE EXCEPTION 'Only image and video files are allowed in wall-media bucket';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;