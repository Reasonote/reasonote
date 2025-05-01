---------------------------------------------------------------------
-- Create a trigger that inserts a row into public.rsn_user when an auth user is created.

-- inserts a row into public.profiles
create function public.tgr_handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = public
as $$
    begin
        -- Insert a row into public.rsn_user
        -- Setting the auth_id to the new user's id.
        insert into public.rsn_user (auth_id)
            values (new.id);

        -- Return the auth user row.
        return new;
    end;
$$
;

-- trigger the function every time a user is created
create trigger run_tgr_handle_new_user
  after insert on auth.users
  for each row execute procedure public.tgr_handle_new_user();

-- Create a trigger that deletes a row from public.rsn_user when an auth user is deleted.
---------------------------------------------------------------------

---------------------------------------------------------------------
-- Create a function that creates a new rsn_user from an auth token.

CREATE OR REPLACE FUNCTION public.create_rsn_user_from_token()
 RETURNS typed_uuid
 LANGUAGE plv8
as $function$
    const execute = plv8.execute; 
    let result = execute('INSERT INTO rsn_user (auth_id) VALUES ($1) RETURNING id', [uid]);    

    if (result.length === 0) {
        throw new Error('')
    }
    else {
        return result[0].id;
    }
$function$
;

GRANT EXECUTE ON FUNCTION public.current_rsn_user_id() TO anon;
GRANT EXECUTE ON FUNCTION public.current_rsn_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_rsn_user_id() TO service_role;

-- END: Create a function that creates a new rsn_user from an auth token.
---------------------------------------------------------------------

---------------------------------------------------------------------
-- Add column auth_email to public.rsn_user
ALTER TABLE public.rsn_user
    ADD COLUMN auth_email text;

-- Create a function that sets the auth_email column to the email address of the auth user.
create function public.tgr_user_auth_sync()
    returns trigger
    language plpgsql
    security definer
as $$
    begin
        -- Set the row's auth_email to the email address of the auth user.
        SELECT email FROM auth.users WHERE new.auth_id = users.id INTO new.auth_email;

        -- Failed attempt
        -- new.auth_email = auth.email();

        -- Return the auth user row.
        return new;
    end;
$$
;

-- trigger the function every time a user is created
CREATE TRIGGER run_tgr_user_auth_sync
  BEFORE INSERT OR UPDATE ON public.rsn_user
  FOR EACH ROW EXECUTE PROCEDURE public.tgr_user_auth_sync();

-- END: Add column auth_email to public.rsn_user
---------------------------------------------------------------------


---------------------------------------------------------------------
-- Add helper function to raise exceptions.

CREATE OR REPLACE FUNCTION f_raise(text)
  RETURNS void
  LANGUAGE plpgsql AS
$func$
BEGIN
   RAISE EXCEPTION '%', $1;
END
$func$;

-- END: Add helper function to raise exceptions.
---------------------------------------------------------------------