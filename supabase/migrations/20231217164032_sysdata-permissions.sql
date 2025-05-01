CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN auth.email() IN (
        'system@reasonote.com',
        'luke@lukebechtel.com',
        'lukebechtel4@gmail.com'
    );
END;
$function$
;

ALTER POLICY "rsn_user_sysdata INSERT" ON public.rsn_user_sysdata WITH CHECK (
    public.is_admin()
);
ALTER POLICY "rsn_user_sysdata UPDATE" ON public.rsn_user_sysdata USING (
    public.is_admin()
);
ALTER POLICY "rsn_user_sysdata DELETE" ON public.rsn_user_sysdata USING (
    -- Allow either the current user or an admin to delete the sysdata
    public.is_admin() OR
    public.current_rsn_user_id() = rsn_user_id
);
ALTER POLICY "rsn_user_sysdata SELECT" ON public.rsn_user_sysdata USING (
    -- Allow either the current user or an admin to read the sysdata
    public.is_admin() OR
    public.current_rsn_user_id() = rsn_user_id
);