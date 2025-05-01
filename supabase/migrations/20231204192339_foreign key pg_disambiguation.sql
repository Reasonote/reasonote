
-- ALTER TABLE public.skill_link
-- RENAME CONSTRAINT skill_link_downstream_skill_fkey TO connections_friend_id_fkey;

-- ALTER TABLE public.skill_link
-- RENAME CONSTRAINT skill_link_upstream_skill_fkey TO connections_user_id_fkey;

comment on constraint skill_link_downstream_skill_fkey
  on "skill_link"
  is E'@graphql({"foreign_name": "downstream", "local_name": "downstreamOf"})';

comment on constraint skill_link_upstream_skill_fkey
    on "skill_link"
    is E'@graphql({"foreign_name": "upstream", "local_name": "upstreamOf"})';