-- Add reference to rsn_page for cover image
ALTER TABLE public.course
ADD COLUMN cover_image_page text REFERENCES public.rsn_page(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.course.cover_image_page IS 'Reference to the rsn_page containing the cover image'; 