
-- Add cascade delete
ALTER TABLE public.skill_link
    DROP CONSTRAINT skill_link_downstream_skill_fkey,
    DROP CONSTRAINT skill_link_upstream_skill_fkey,
    ADD CONSTRAINT skill_link_downstream_skill_fkey FOREIGN KEY (downstream_skill) REFERENCES public.skill(id) ON DELETE CASCADE,
    ADD CONSTRAINT skill_link_upstream_skill_fkey FOREIGN KEY (upstream_skill) REFERENCES public.skill(id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE public.skill_link
    ADD CONSTRAINT skill_link_downstream_skill_upstream_skill_unique UNIQUE (downstream_skill, upstream_skill);

-- Re-add graphql comments
comment on constraint skill_link_downstream_skill_fkey
  on "skill_link"
  is E'@graphql({"foreign_name": "downstream", "local_name": "downstreamOf"})';

comment on constraint skill_link_upstream_skill_fkey
    on "skill_link"
    is E'@graphql({"foreign_name": "upstream", "local_name": "upstreamOf"})';