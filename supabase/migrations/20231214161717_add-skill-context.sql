-- A page that a skill came from
ALTER TABLE public.skill ADD COLUMN context_page text;
ALTER TABLE public.skill ADD COLUMN _description text;
COMMENT ON COLUMN public.skill.context_page IS 'The page that the skill came from';
COMMENT ON COLUMN public.skill._description IS 'The description of the skill. This should disambiguate context.';

-- foreign key constraint on rsn_page for context_page
ALTER TABLE public.skill ADD CONSTRAINT skill__context_page__fkey FOREIGN KEY (context_page) REFERENCES public.rsn_page(id) ON DELETE SET NULL;

