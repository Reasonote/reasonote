-- Create description column
ALTER TABLE public.rsn_page ADD COLUMN _description text;

-- Move data from metadata->>description to _description column
UPDATE public.rsn_page SET _description = metadata->>'description';