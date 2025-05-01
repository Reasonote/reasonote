
ALTER TABLE public.snip ADD COLUMN extracting BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.snip.extracting IS 'Whether or not the snip is currently being extracted.';