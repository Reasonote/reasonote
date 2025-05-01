-- Create blog_posts table
CREATE TABLE public.blog_post (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('blogpost')),
    title text NOT NULL,
    short_description text,
    slug text NOT NULL UNIQUE,
    tags text[] NOT NULL DEFAULT '{}',
    content text NOT NULL,
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    is_published boolean NOT NULL DEFAULT false,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blog_post__id__check_prefix CHECK (public.is_valid_typed_uuid('blogpost', id))
);

-- Create index on slug for faster lookups
CREATE INDEX blog_post_slug_idx ON public.blog_post(slug);

-- Create index on created_date for faster sorting
CREATE INDEX blog_post_created_date_idx ON public.blog_post(created_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_post ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "blog_post SELECT"
    ON public.blog_post FOR SELECT
    USING (
        is_published = true OR 
        (is_published = false AND public.is_admin())
    );

CREATE POLICY "blog_post INSERT"
    ON public.blog_post FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "blog_post UPDATE"
    ON public.blog_post FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "blog_post DELETE"
    ON public.blog_post FOR DELETE
    USING (public.is_admin());


-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
INSERT
    OR
UPDATE ON public.blog_post FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation
AFTER
INSERT
    OR DELETE
    OR
UPDATE ON public.blog_post FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();
