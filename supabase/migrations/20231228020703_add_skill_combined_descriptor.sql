-- Add a Generated column to the skill table that combines the description and name columns
ALTER TABLE public.skill
    ADD COLUMN name_and_description text GENERATED ALWAYS AS (_name || ': ' || COALESCE(_description, '')) STORED;

-- Add this column to the configuration for the rsn_vec
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('skill', 'name_and_description', NULL);