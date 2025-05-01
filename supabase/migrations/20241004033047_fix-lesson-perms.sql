-- Update the SELECT policy
DROP POLICY IF EXISTS "lesson SELECT" ON public.lesson;
CREATE POLICY "lesson SELECT" ON public.lesson
    FOR SELECT USING (
        created_by = (public.current_rsn_user_id())::text
        OR for_user = (public.current_rsn_user_id())::text
        OR public.is_admin()
    );

-- Update the INSERT policy
DROP POLICY IF EXISTS "lesson INSERT" ON public.lesson;
CREATE POLICY "lesson INSERT" ON public.lesson
    FOR INSERT WITH CHECK (
        created_by = (public.current_rsn_user_id())::text
        OR for_user = (public.current_rsn_user_id())::text
        OR public.is_admin()
    );

-- Update the UPDATE policy
DROP POLICY IF EXISTS "lesson UPDATE" ON public.lesson;
CREATE POLICY "lesson UPDATE" ON public.lesson
    FOR UPDATE USING (
        created_by = (public.current_rsn_user_id())::text
        OR for_user = (public.current_rsn_user_id())::text
        OR public.is_admin()
    );

-- Update the DELETE policy
DROP POLICY IF EXISTS "lesson DELETE" ON public.lesson;
CREATE POLICY "lesson DELETE" ON public.lesson
    FOR DELETE USING (
        created_by = (public.current_rsn_user_id())::text
        OR for_user = (public.current_rsn_user_id())::text
        OR public.is_admin()
    );

-- Update the user_history SELECT policy
DROP POLICY IF EXISTS "user_history SELECT" ON public.user_history;
CREATE POLICY "user_history SELECT" ON public.user_history
    FOR SELECT USING (
        (public.current_rsn_user_id())::text = rsn_user_id
        OR public.is_admin()
    );

-- Update the user_history INSERT policy
DROP POLICY IF EXISTS "user_history INSERT" ON public.user_history;
CREATE POLICY "user_history INSERT" ON public.user_history
    FOR INSERT WITH CHECK (
        (public.current_rsn_user_id())::text = rsn_user_id
        OR public.is_admin()
    );

-- Update the user_history UPDATE policy
DROP POLICY IF EXISTS "user_history UPDATE" ON public.user_history;
CREATE POLICY "user_history UPDATE" ON public.user_history
    FOR UPDATE USING (
        (public.current_rsn_user_id())::text = rsn_user_id
        OR public.is_admin()
    );

-- Update the user_history DELETE policy
DROP POLICY IF EXISTS "user_history DELETE" ON public.user_history;
CREATE POLICY "user_history DELETE" ON public.user_history
    FOR DELETE USING (
        (public.current_rsn_user_id())::text = rsn_user_id
        OR public.is_admin()
    );