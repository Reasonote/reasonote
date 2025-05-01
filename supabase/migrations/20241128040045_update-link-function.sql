-- Create function to link anonymous user data to authenticated user
-- Prefer variable names over table names to avoid conflicts
create or replace function public.link_anon_user_to_user(
  p_anon_user_id text,
  p_user_id text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Create migration mode flag table
  CREATE TEMP TABLE _migration_mode ON COMMIT DROP AS SELECT true AS enabled;

  -- Convert user_id to rsn_user_id if it is not already
  p_user_id := convert_to_rsn_user_id(p_user_id);

  -- Validate that the current user matches the target user_id
  if current_rsn_user_id() != p_user_id then
    raise exception 'Unauthorized: Current user does not correspond to p_user_id. You can only link anonymous users to your own account.';
  end if;


  -- Check that the anon_user_id is actually an anonymous user.
  if not public.is_anon_user(p_anon_user_id) then
    raise exception 'Unauthorized: Target user p_anon_user_id is not an anonymous user.';
  end if;


  -- Update activity_set_activity table
  update public.activity_set_activity
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update activity_set table
  update public.activity_set
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update activity_skill table
  update public.activity_skill
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update activity table
  update public.activity
  set 
    created_by = p_user_id,
    updated_by = p_user_id,
    generated_for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or generated_for_user = p_anon_user_id;

  -- Update analyzer table
  update public.analyzer
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update user_activity_feedback table
  update public.user_activity_feedback
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update lesson table
  update public.lesson
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update user_skill table
  update public.user_skill
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    rsn_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or rsn_user = p_anon_user_id;

  -- Update email_subscription table
  update public.email_subscription
  set
    rsn_user_id = p_user_id
  where 
    rsn_user_id = p_anon_user_id;

  -- Update bot table
  update public.bot
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update bot_set table
  update public.bot_set
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update bot_set_bot table
  update public.bot_set_bot
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update chapter table
  update public.chapter
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update chat table
  update public.chat
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update chat_message table
  update public.chat_message
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update entity table
  update public.entity
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update goal table
  update public.goal
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update integration table
  update public.integration
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update integration_token table
  update public.integration_token
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update journal table
  update public.journal
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update lesson_activity table
  update public.lesson_activity
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update lesson_session table
  update public.lesson_session
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    _user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or _user = p_anon_user_id;

  -- Update member_authorization table (using alias to avoid variable name conflicts)
  update public.member_authorization auth
  set
    created_by = p_user_id,
    modified_by = p_user_id,
    user_id = p_user_id
  where 
    auth.created_by = p_anon_user_id
    or auth.modified_by = p_anon_user_id
    or auth.user_id = p_anon_user_id;

  -- Update podcast table
  update public.podcast
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update podcast_line table
  update public.podcast_line
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update podcast_audio table
  update public.podcast_audio
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update podcast_queue_item table
  update public.podcast_queue_item
  set
    for_user = p_user_id
  where 
    for_user = p_anon_user_id;

  -- Update resource table
  update public.resource
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update rsn_page table
  update public.rsn_page
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update skill_link table
  update public.skill_link
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update skill_page table
  update public.skill_page
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update skill_set_skill table, such that they correspond to the skill_set for the new user.
  update public.skill_set_skill
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    skill_set = (select id from public.skill_set where for_user = p_user_id)
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Delete the old user's skill_set -- we copied over all skills, don't need the set.
  delete from public.skill_set where for_user = p_anon_user_id;


  -- Update user_activity_result table (using alias to avoid variable name conflicts)
  update public.user_activity_result result
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    _user = p_user_id
  where 
    result.created_by = p_anon_user_id
    or result.updated_by = p_anon_user_id
    or result._user = p_anon_user_id;

  -- Update skill table
  update public.skill
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    for_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or for_user = p_anon_user_id;

  -- Update snip table
  update public.snip
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    _owner = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or _owner = p_anon_user_id;

  -- Update user_activity_feedback table
  update public.user_activity_feedback
  set
    created_by = p_user_id,
    updated_by = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id;

  -- Update user_history table
  update public.user_history
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    rsn_user_id = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or rsn_user_id = p_anon_user_id;

  -- Update user_lesson_result table
  update public.user_lesson_result
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    _user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or _user = p_anon_user_id;

  -- Update user_setting table
  update public.user_setting
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    rsn_user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or rsn_user = p_anon_user_id;

  -- Update user_skill table (using alias to avoid variable name conflicts)
  update public.user_skill skill
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    rsn_user = p_user_id
  where 
    skill.created_by = p_anon_user_id
    or skill.updated_by = p_anon_user_id
    or skill.rsn_user = p_anon_user_id;

  -- Update user_tour table
  update public.user_tour
  set
    created_by = p_user_id,
    updated_by = p_user_id,
    _user = p_user_id
  where 
    created_by = p_anon_user_id
    or updated_by = p_anon_user_id
    or _user = p_anon_user_id;


  -- Finally, delete the anonymous user
  delete from auth.users where id = get_normal_user_id(p_anon_user_id);
end;
$$;