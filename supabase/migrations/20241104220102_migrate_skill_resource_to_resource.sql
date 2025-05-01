-- First, migrate existing data from skill_resource to resource
INSERT INTO public.resource (
    parent_skill_id,
    child_snip_id,
    child_page_id,
    metadata,
    created_date,
    updated_date,
    created_by,
    updated_by
)
SELECT 
    skill_id,
    snip_id,
    page_id,
    metadata,
    created_date,
    updated_date,
    created_by,
    updated_by
FROM public.skill_resource;

-- Drop the skill_resource table
DROP TABLE public.skill_resource;