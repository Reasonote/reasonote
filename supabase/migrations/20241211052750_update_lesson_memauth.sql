-- Create the updated view
create or replace view vw_lesson_memauth as
select 
    -- Memauth fields
    ma.id as memauth_id,
    ma.principal_id,
    ma.principal_type,
    ma.resource_entity_id AS lesson_id,
    ma.access_level,
    array_agg(alp.permission_code order by alp.permission_code) as permissions,
    ma.is_public,
    -- Lesson fields
    l._name as name,
    l._summary as summary,
    l.for_user,
    l.metadata,
    l.root_skill,
    l.created_date,
    l.updated_date,
    l.created_by,
    l.updated_by,
    l.slides,
    l.activity_stubs,
    l.root_skill_path,
    l.icon,
    l.snip_ids,
    l.lesson_type,
    l.chapter,
    l.chapter_order
from
    (public.memauth ma
     join public.access_level_permission alp on ((((alp.entity_type)::text = 'lesson'::text) and (upper((alp.access_level)::text) = upper((ma.access_level)::text)))))
     join public.lesson l on (l.id = ma.resource_entity_id)
group by
    ma.id,
    ma.principal_id,
    ma.principal_type,
    ma.access_level,
    ma.is_public,
    l.id,
    l._name,
    l._summary,
    l.for_user,
    l.metadata,
    l.root_skill,
    l.created_date,
    l.updated_date,
    l.created_by,
    l.updated_by,
    l.slides,
    l.activity_stubs,
    l.root_skill_path,
    l.icon,
    l.snip_ids,
    l.lesson_type,
    l.chapter,
    l.chapter_order;

-- Grant access to the view
grant select on vw_lesson_memauth to anon, authenticated, service_role;

-- Add comment to describe the view
comment on view vw_lesson_memauth is 'Shows lesson data combined with memauth permissions, including what principals have which access_levels & permissions on which lesson.';
