-- Alter permissions such that only the created_by user can perform any operation on the skill
ALTER TABLE skill ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill DELETE" ON skill;
CREATE POLICY "skill DELETE" ON skill FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "skill INSERT" ON skill;
CREATE POLICY "skill INSERT" ON skill FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "skill SELECT" ON skill;
CREATE POLICY "skill SELECT" ON skill FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "skill UPDATE" ON skill;
CREATE POLICY "skill UPDATE" ON skill FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());


-- Same for activity
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity DELETE" ON activity;
CREATE POLICY "activity DELETE" ON activity FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "activity INSERT" ON activity;
CREATE POLICY "activity INSERT" ON activity FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "activity SELECT" ON activity;
CREATE POLICY "activity SELECT" ON activity FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "activity UPDATE" ON activity;
CREATE POLICY "activity UPDATE" ON activity FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- Same for bot
ALTER TABLE bot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot DELETE" ON bot;
CREATE POLICY "bot DELETE" ON bot FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "bot INSERT" ON bot;
CREATE POLICY "bot INSERT" ON bot FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "bot SELECT" ON bot;
CREATE POLICY "bot SELECT" ON bot FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "bot UPDATE" ON bot;
CREATE POLICY "bot UPDATE" ON bot FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- same for chat_message
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_message DELETE" ON chat_message;
CREATE POLICY "chat_message DELETE" ON chat_message FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "chat_message INSERT" ON chat_message;
CREATE POLICY "chat_message INSERT" ON chat_message FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "chat_message SELECT" ON chat_message;
CREATE POLICY "chat_message SELECT" ON chat_message FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "chat_message UPDATE" ON chat_message;
CREATE POLICY "chat_message UPDATE" ON chat_message FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- same for chat
ALTER TABLE chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat DELETE" ON chat;
CREATE POLICY "chat DELETE" ON chat FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "chat INSERT" ON chat;
CREATE POLICY "chat INSERT" ON chat FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "chat SELECT" ON chat;
CREATE POLICY "chat SELECT" ON chat FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "chat UPDATE" ON chat;
CREATE POLICY "chat UPDATE" ON chat FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- same for goal
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goal DELETE" ON goal;
CREATE POLICY "goal DELETE" ON goal FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "goal INSERT" ON goal;
CREATE POLICY "goal INSERT" ON goal FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "goal SELECT" ON goal;
CREATE POLICY "goal SELECT" ON goal FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "goal UPDATE" ON goal;
CREATE POLICY "goal UPDATE" ON goal FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- Same for journal
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal DELETE" ON journal;
CREATE POLICY "journal DELETE" ON journal FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "journal INSERT" ON journal;
CREATE POLICY "journal INSERT" ON journal FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "journal SELECT" ON journal;
CREATE POLICY "journal SELECT" ON journal FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "journal UPDATE" ON journal;
CREATE POLICY "journal UPDATE" ON journal FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- Same for lesson_activity
ALTER TABLE lesson_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_activity DELETE" ON lesson_activity;
CREATE POLICY "lesson_activity DELETE" ON lesson_activity FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "lesson_activity INSERT" ON lesson_activity;
CREATE POLICY "lesson_activity INSERT" ON lesson_activity FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "lesson_activity SELECT" ON lesson_activity;
CREATE POLICY "lesson_activity SELECT" ON lesson_activity FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "lesson_activity UPDATE" ON lesson_activity;
CREATE POLICY "lesson_activity UPDATE" ON lesson_activity FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- Same for lesson
ALTER TABLE lesson ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson DELETE" ON lesson;
CREATE POLICY "lesson DELETE" ON lesson FOR DELETE USING (created_by = current_rsn_user_id() OR for_user = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "lesson INSERT" ON lesson;
CREATE POLICY "lesson INSERT" ON lesson FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR for_user = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "lesson SELECT" ON lesson;
CREATE POLICY "lesson SELECT" ON lesson FOR SELECT USING (created_by = current_rsn_user_id() OR (for_user = current_rsn_user_id()) OR is_admin());

DROP POLICY IF EXISTS "lesson UPDATE" ON lesson;
CREATE POLICY "lesson UPDATE" ON lesson FOR UPDATE USING ((created_by = current_rsn_user_id()) OR (for_user = current_rsn_user_id()) OR is_admin());

-- member_authorization
ALTER TABLE member_authorization ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_authorization DELETE" ON member_authorization;
CREATE POLICY "member_authorization DELETE" ON member_authorization FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "member_authorization INSERT" ON member_authorization;
CREATE POLICY "member_authorization INSERT" ON member_authorization FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "member_authorization SELECT" ON member_authorization;
CREATE POLICY "member_authorization SELECT" ON member_authorization FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "member_authorization UPDATE" ON member_authorization;
CREATE POLICY "member_authorization UPDATE" ON member_authorization FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- rsn_page
ALTER TABLE rsn_page ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsn_page DELETE" ON rsn_page;
CREATE POLICY "rsn_page DELETE" ON rsn_page FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "rsn_page INSERT" ON rsn_page;
CREATE POLICY "rsn_page INSERT" ON rsn_page FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "rsn_page SELECT" ON rsn_page;
CREATE POLICY "rsn_page SELECT" ON rsn_page FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "rsn_page UPDATE" ON rsn_page;
CREATE POLICY "rsn_page UPDATE" ON rsn_page FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());



-- user_skill
ALTER TABLE user_skill ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_skill DELETE" ON user_skill;
CREATE POLICY "user_skill DELETE" ON user_skill FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "user_skill INSERT" ON user_skill;
CREATE POLICY "user_skill INSERT" ON user_skill FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "user_skill SELECT" ON user_skill;
CREATE POLICY "user_skill SELECT" ON user_skill FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin());

DROP POLICY IF EXISTS "user_skill UPDATE" ON user_skill;
CREATE POLICY "user_skill UPDATE" ON user_skill FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin());

-- 


CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN auth.email() IN (
        'system@reasonote.com',
        'luke@lukebechtel.com',
        'lukebechtel4@gmail.com',
        'luke@reasonote.com',
        'root@reasonote.com'
    );
END;
$function$