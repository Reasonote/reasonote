-- Create user_skill_sysdata table for XP tracking
create table public.user_skill_sysdata (
    id text DEFAULT public.generate_typed_uuid('usrsklsd'::text) NOT NULL,
    rsn_user public.typed_uuid references public.rsn_user(id),
    skill public.typed_uuid references public.skill(id),
    total_xp integer NOT NULL DEFAULT 0,
    daily_xp integer NOT NULL DEFAULT 0,
    last_daily_reset timestamp with time zone NOT NULL DEFAULT now(),
    highest_level_shown integer default 1,
    PRIMARY KEY (id),
    UNIQUE(rsn_user, skill),
    CONSTRAINT user_skill_sysdata__id__check_prefix CHECK (public.is_valid_typed_uuid('usrsklsd'::text, (id)::public.typed_uuid))
);

-- Enable row level security
ALTER TABLE public.user_skill_sysdata ENABLE ROW LEVEL SECURITY;

-- Create policies for user_skill_sysdata
CREATE POLICY "user_skill_sysdata SELECT" ON public.user_skill_sysdata
    FOR SELECT USING ((public.is_admin() OR (rsn_user = (public.current_rsn_user_id())::public.typed_uuid)));

CREATE POLICY "user_skill_sysdata INSERT" ON public.user_skill_sysdata
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "user_skill_sysdata UPDATE" ON public.user_skill_sysdata
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "user_skill_sysdata DELETE" ON public.user_skill_sysdata
    FOR DELETE USING (public.is_admin());

-- Function to add XP for a specific skill
create or replace function public.add_skill_xp(
    user_id text,
    skill_id text,
    xp_amount integer
) returns void as $$
declare
    last_reset timestamp with time zone;
    user_timezone text;
begin
    -- Get user's timezone
    select timezone into user_timezone
    from public.rsn_user
    where id = user_id;

    -- Get or create user_skill_sysdata record
    insert into public.user_skill_sysdata (rsn_user, skill)
    values (user_id::public.typed_uuid, skill_id::public.typed_uuid)
    on conflict (rsn_user, skill) do nothing;

    -- Check if we need to reset daily XP based on user's timezone
    select last_daily_reset into last_reset
    from public.user_skill_sysdata
    where rsn_user = user_id::public.typed_uuid and skill = skill_id::public.typed_uuid;

    if (last_reset AT TIME ZONE COALESCE(user_timezone, 'UTC'))::date < 
       (current_timestamp AT TIME ZONE COALESCE(user_timezone, 'UTC'))::date then
        -- Reset daily XP if it's a new day in user's timezone
        update public.user_skill_sysdata
        set daily_xp = xp_amount,
            last_daily_reset = current_timestamp,
            total_xp = total_xp + xp_amount
        where rsn_user = user_id::public.typed_uuid and skill = skill_id::public.typed_uuid;
    else
        -- Add XP to both daily and total
        update public.user_skill_sysdata
        set daily_xp = daily_xp + xp_amount,
            total_xp = total_xp + xp_amount
        where rsn_user = user_id::public.typed_uuid and skill = skill_id::public.typed_uuid;
    end if;
end;
$$ language plpgsql;

-- Revoke all permissions from public, anon, authenticated
REVOKE ALL ON FUNCTION public.add_skill_xp(text, text, integer) FROM public, anon, authenticated;

-- Grant execute to postgres, service_role
GRANT EXECUTE ON FUNCTION public.add_skill_xp(text, text, integer) TO postgres, service_role;

-- Function to get total XP across all skills
create or replace function public.get_total_user_xp(user_id text)
returns table (
    total_xp bigint,
    daily_xp bigint
) as $$
begin
    return query
    select sum(usd.total_xp)::bigint as total_xp,
           sum(usd.daily_xp)::bigint as daily_xp
    from public.user_skill_sysdata usd
    where usd.rsn_user = user_id::public.typed_uuid;
end;
$$ language plpgsql;

-- Add daily_xp_goal to user_setting table
ALTER TABLE public.user_setting
ADD COLUMN daily_xp_goal integer NOT NULL DEFAULT 500,
ADD COLUMN temporary_daily_xp_goal integer,
ADD COLUMN temporary_daily_xp_goal_set_datetime timestamp with time zone default null;

-- Add daily_xp_goal_celebration_time to rsn_user_sysdata table
ALTER TABLE public.rsn_user_sysdata
ADD COLUMN daily_xp_goal_celebration_time timestamp with time zone default null;

-- Add timezone column to rsn_user table
ALTER TABLE public.rsn_user
ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';

-- Add cleanup function for daily XP and temporary goals
CREATE OR REPLACE FUNCTION crn_cleanup_daily_xp_and_goals() RETURNS void AS $$
BEGIN
    -- Reset daily XP for users whose last reset was yesterday or earlier in their timezone
    UPDATE public.user_skill_sysdata usd
    SET daily_xp = 0,
        last_daily_reset = current_timestamp
    FROM public.rsn_user u
    WHERE usd.rsn_user = u.id
    AND (usd.last_daily_reset AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date < 
        (current_timestamp AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date;

    -- Clear temporary daily XP goals from previous days
    UPDATE public.user_setting us1
    SET temporary_daily_xp_goal = NULL,
        temporary_daily_xp_goal_set_datetime = NULL
    FROM public.rsn_user u
    WHERE us1.rsn_user = u.id
    AND us1.temporary_daily_xp_goal IS NOT NULL
    AND (us1.temporary_daily_xp_goal_set_datetime AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date < 
        (current_timestamp AT TIME ZONE COALESCE(u.timezone, 'UTC'))::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run the cleanup function daily at midnight UTC
SELECT cron.schedule(
    'crn_cleanup_daily_xp_and_goals',  -- job name
    '0 */30 * * *',               -- cron schedule (every 30 minutes)
    'SELECT crn_cleanup_daily_xp_and_goals()'
);

-- Revoke all permissions from public, anon, authenticated
REVOKE ALL ON FUNCTION crn_cleanup_daily_xp_and_goals() FROM public, anon, authenticated;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION crn_cleanup_daily_xp_and_goals() TO postgres;

-- Modify the existing login_jwt function to include timezone update
DROP FUNCTION IF EXISTS public.login_jwt();

CREATE OR REPLACE FUNCTION public.login_jwt(
    browser_timezone text DEFAULT 'UTC'
)
RETURNS typed_uuid
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    authId uuid;
    userId typed_uuid;
    rawUserData jsonb;
    oauthImageUrl text;
    existingProfile record;
BEGIN
    -- Call the auth.uid() function and store its result
    authId := auth.uid();

    -- If no authId, return null
    IF authId IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if a user with this authId already exists
    SELECT id INTO userId 
        FROM rsn_user 
        WHERE auth_id = authId;

    -- If the user doesn't exist, insert and get the new id
    IF userId IS NULL THEN
        INSERT INTO rsn_user (auth_id) 
        VALUES (authId) 
        RETURNING id INTO userId;
    END IF;

    -- Check if profile exists
    SELECT * INTO existingProfile 
        FROM user_profile 
        WHERE rsn_user_id = userId;

    -- If profile doesn't exist, create it
    IF existingProfile IS NULL THEN
        -- Get the raw user data from auth.users()
        SELECT raw_user_meta_data
            INTO rawUserData
            FROM auth.users
            WHERE id = authId;

        -- Extract avatar_url from OAuth data if it exists
        oauthImageUrl := NULLIF(rawUserData->>'picture', '')::text;

        -- Only set profile_image_url if we have a trusted OAuth image
        IF oauthImageUrl IS NOT NULL THEN
            INSERT INTO user_profile (rsn_user_id, profile_image_url)
            VALUES (userId, oauthImageUrl);
        ELSE
            INSERT INTO user_profile (rsn_user_id)
            VALUES (userId);
        END IF;
    END IF;

    -- Set first_login_date if it is null
    UPDATE rsn_user
        SET first_login_date = NOW()
        WHERE auth_id = authId
        AND first_login_date IS NULL;

    -- Set last_login_date to NOW()
    UPDATE rsn_user
        SET last_login_date = NOW()
        WHERE auth_id = authId;

    -- Set the timezone for this session
    UPDATE rsn_user
        SET timezone = browser_timezone
        WHERE auth_id = authId;

    RETURN userId;
END;
$$;