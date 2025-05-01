-- create table
--   public.user_skill (
--     id text not null default generate_typed_uuid ('usrskill'::text),
--     skill character varying not null,
--     rsn_user character varying not null,
--     metadata jsonb null,
--     created_date timestamp with time zone not null default now(),
--     updated_date timestamp with time zone not null default now(),
--     created_by character varying null,
--     updated_by character varying null,
--     constraint user_skill_pkey primary key (id),
--     constraint user_skill_created_by_fkey foreign key (created_by) references rsn_user (id) on delete set null,
--     constraint user_skill_rsn_user_fkey foreign key (rsn_user) references rsn_user (id) on delete cascade,
--     constraint user_skill_skill_fkey foreign key (skill) references skill (id) on delete cascade,
--     constraint user_skill_updated_by_fkey foreign key (updated_by) references rsn_user (id) on delete set null,
--     constraint user_skill__id__check_prefix check (
--       is_valid_typed_uuid ('usrskill'::text, (id)::typed_uuid)
--     )
--   ) tablespace pg_default;

-- create trigger run_tgr_apply_audit before insert
-- or
-- update on user_skill for each row
-- execute function tgr_apply_audit ();

-- create trigger log_operation
-- after insert
-- or delete
-- or
-- update on user_skill for each row
-- execute function tgr_log_operation ();

ALTER TABLE public.activity DROP CONSTRAINT is_2d_array;
ALTER TABLE public.activity ADD CONSTRAINT generated_for_skill_paths_is_2d_array CHECK (generated_for_skill_paths IS NULL OR jsonb_matches_schema('{
    "type": "array",
    "items": {
        "type": "array",
        "items": {
            "type": "string"
        }
    }
}', generated_for_skill_paths));


-- Make user_skill unique to user and skill
ALTER TABLE public.user_skill ADD CONSTRAINT user_skill_unique_to_user_and_skill UNIQUE (rsn_user, skill);