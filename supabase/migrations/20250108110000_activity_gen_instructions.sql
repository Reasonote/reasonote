ALTER TABLE public.activity ADD COLUMN gen_instructions text;

COMMENT ON COLUMN public.activity.gen_instructions IS 'The instructions for the AI to generate this activity, if any.';