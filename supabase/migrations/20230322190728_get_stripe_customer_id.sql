
create function public.env_name()
    RETURNS text
    LANGUAGE plpgsql
as $$
    begin
        return 'LOCAL';
    end;
$$
;

GRANT EXECUTE ON FUNCTION public.env_name() TO anon;
GRANT EXECUTE ON FUNCTION public.env_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.env_name() TO service_role;

create function public.throw_if_not_local()
    RETURNS void
    LANGUAGE plpgsql
as $$
    begin
        if public.env_name() <> 'LOCAL' then
            raise exception 'Local environment detected. Throwing.';
        end if;
    end;
$$
;

GRANT EXECUTE ON FUNCTION public.env_name() TO anon;
GRANT EXECUTE ON FUNCTION public.env_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.env_name() TO service_role;


-- A postgresql function which will fetch the current stripe id for the user.
CREATE OR REPLACE FUNCTION public.cur_user_stripe_customer_id(mock text default null)
    RETURNS text
    LANGUAGE plpgsql
as $$
    begin
        PERFORM public.throw_if_not_local();

        return mock;
    end;
$$
;

GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id(mock text) TO anon;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id(mock text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cur_user_stripe_customer_id(mock text) TO service_role;