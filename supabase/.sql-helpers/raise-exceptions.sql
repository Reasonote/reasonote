

CREATE OR REPLACE FUNCTION f_raise(text)
  RETURNS void
  LANGUAGE plpgsql AS
$func$
BEGIN
   RAISE EXCEPTION '%', $1;
END
$func$;


-- inserts a row into public.profiles

create or replace function public.tester()
    returns boolean
    language plpgsql
as $$
    begin
        SELECT * FROM f_raise(auth.role());
        return true;
    end;
$$
;


-- This is helpful for debugging.