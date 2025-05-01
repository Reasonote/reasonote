
ALTER TABLE member_authorization
    ALTER COLUMN user_id DROP NOT NULL,
    ALTER COLUMN bot_id DROP NOT NULL,
    ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE bot ADD COLUMN avatar_emoji TEXT;
ALTER TABLE member_authorization DROP COLUMN modified_by;
ALTER TABLE member_authorization ADD COLUMN updated_by TEXT;
ALTER TABLE member_authorization DROP COLUMN modified_date;
ALTER TABLE member_authorization ADD COLUMN updated_date TIMESTAMP WITH TIME ZONE DEFAULT now();


-- Create function which will take a record of any type and:
-- 1. if `created_by` exists, check if it is equal to the result of `current_rsn_user_id()`, then return true.
-- 2. if `created_date` is within the last 1 minute, then return true.
-- 3. otherwise, return false
CREATE OR REPLACE FUNCTION simple_auth_check(created_by_id TEXT, created_date TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        CASE
            WHEN created_by_id IS NOT NULL AND created_by_id = current_rsn_user_id() THEN
                true
            WHEN created_date > now() - INTERVAL '1 minute' THEN
                true
            ELSE
                false
        END
    );
END;
$$ LANGUAGE plpgsql;

-- DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "member_authorization DELETE" on public.member_authorization;
DROP POLICY IF EXISTS "member_authorization INSERT" on public.member_authorization;
DROP POLICY IF EXISTS "member_authorization SELECT" on public.member_authorization;
DROP POLICY IF EXISTS "member_authorization UPDATE" on public.member_authorization;

-- CREATE NEW POLICIES
ALTER TABLE public.member_authorization ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.member_authorization TO authenticated;
CREATE POLICY member_authorization__authenticated__insert 
    ON public.member_authorization 
    FOR INSERT TO authenticated 
    WITH CHECK (simple_auth_check(created_by, created_date));

CREATE POLICY member_authorization__authenticated__select
    ON public.member_authorization 
    FOR SELECT TO authenticated 
    USING (simple_auth_check(created_by, created_date));

CREATE POLICY member_authorization__authenticated__update
    ON public.member_authorization 
    FOR UPDATE TO authenticated 
    USING (simple_auth_check(created_by, created_date));

CREATE POLICY member_authorization__authenticated__delete
    ON public.member_authorization
    FOR DELETE TO authenticated
    USING (simple_auth_check(created_by, created_date));

-- anon NO access
GRANT ALL ON TABLE public.member_authorization TO anon;
CREATE POLICY member_authorization__anon__insert ON public.member_authorization FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY member_authorization__anon__select ON public.member_authorization FOR SELECT TO anon USING (false);
CREATE POLICY member_authorization__anon__update ON public.member_authorization FOR UPDATE TO anon USING (false);
CREATE POLICY member_authorization__anon__delete ON public.member_authorization FOR DELETE TO anon USING (false);

-- service_role ALL access
GRANT ALL ON TABLE public.member_authorization TO service_role;
CREATE POLICY member_authorization__service_role__insert ON public.member_authorization FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY member_authorization__service_role__select ON public.member_authorization FOR SELECT TO service_role USING (true);
CREATE POLICY member_authorization__service_role__update ON public.member_authorization FOR UPDATE TO service_role USING (true);
CREATE POLICY member_authorization__service_role__delete ON public.member_authorization FOR DELETE TO service_role USING (true);