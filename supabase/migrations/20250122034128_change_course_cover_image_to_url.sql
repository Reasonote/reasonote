-- Add column for cover image path
ALTER TABLE public.course
ADD COLUMN cover_image_url text;

COMMENT ON COLUMN public.course.cover_image_url IS 'URL to the cover image';

-- Remove the reference to rsn_page for cover image
ALTER TABLE public.course
DROP COLUMN IF EXISTS cover_image_page;