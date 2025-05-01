-- Add podcast_playback_speed to user_setting table
ALTER TABLE public.user_setting
ADD COLUMN podcast_playback_speed FLOAT DEFAULT 1.0;

-- Add check constraint to ensure reasonable speed values
ALTER TABLE public.user_setting
ADD CONSTRAINT user_setting_podcast_playback_speed_check 
CHECK (podcast_playback_speed >= 0.5 AND podcast_playback_speed <= 2.0); 

-- Fix policies on user_setting.
DROP POLICY "user_setting INSERT" ON public.user_setting;
CREATE POLICY "user_setting INSERT" ON public.user_setting FOR INSERT WITH CHECK (rsn_user = current_rsn_user_id());

DROP POLICY "user_setting SELECT" ON public.user_setting;
CREATE POLICY "user_setting SELECT" ON public.user_setting FOR SELECT USING (rsn_user = current_rsn_user_id());

DROP POLICY "user_setting UPDATE" ON public.user_setting;
CREATE POLICY "user_setting UPDATE" ON public.user_setting FOR UPDATE USING (rsn_user = current_rsn_user_id());

DROP POLICY "user_setting DELETE" ON public.user_setting;
CREATE POLICY "user_setting DELETE" ON public.user_setting FOR DELETE USING (rsn_user = current_rsn_user_id());

-- Add unique constraint on rsn_user
ALTER TABLE public.user_setting
    ADD CONSTRAINT user_setting_rsn_user_unique UNIQUE (rsn_user);