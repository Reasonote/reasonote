-- Enable the "pg_jsonschema" extension
create extension pg_jsonschema with schema extensions;

ALTER TABLE public.activity ADD COLUMN generated_for_user text REFERENCES public.rsn_user(id) ON DELETE SET NULL;
ALTER TABLE public.activity ADD COLUMN generated_for_skill_paths JSONB;

-- TODO: add a check constraint to ensure that generated_for_skill_paths is a 2D array of skill path IDs

ALTER TABLE public.activity ADD CONSTRAINT is_2d_array CHECK (generated_for_skill_paths IS NULL OR jsonb_matches_schema('{
    "type": "array",
    "items": {
        "type": "array",
        "items": {
            "type": "string"
        }
    }
}', generated_for_skill_paths));

COMMENT ON COLUMN public.activity.generated_for_user IS 'The user that this activity was generated for.';
COMMENT ON COLUMN public.activity.generated_for_skill_paths IS 'The skill paths that this activity was generated for. (Should be a 2D array of skill path IDs.)';
COMMENT ON CONSTRAINT is_2d_array ON public.activity IS 'A check constraint to ensure that generated_for_skill_paths is a 2D array of skill path IDs.';