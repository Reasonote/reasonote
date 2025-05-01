
---------------------
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity DELETE" ON activity;
CREATE POLICY "activity DELETE" ON activity FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin() OR generated_for_user = current_rsn_user_id());

DROP POLICY IF EXISTS "activity INSERT" ON activity;
CREATE POLICY "activity INSERT" ON activity FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin() OR generated_for_user = current_rsn_user_id());

DROP POLICY IF EXISTS "activity SELECT" ON activity;
CREATE POLICY "activity SELECT" ON activity FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin() OR generated_for_user = current_rsn_user_id());

DROP POLICY IF EXISTS "activity UPDATE" ON activity;
CREATE POLICY "activity UPDATE" ON activity FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin() OR generated_for_user = current_rsn_user_id());


---------------------
ALTER TABLE user_activity_result ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_activity_result DELETE" ON user_activity_result;
CREATE POLICY "user_activity_result DELETE" ON user_activity_result FOR DELETE USING (created_by = current_rsn_user_id() OR is_admin() OR _user = current_rsn_user_id());

DROP POLICY IF EXISTS "user_activity_result INSERT" ON user_activity_result;
CREATE POLICY "user_activity_result INSERT" ON user_activity_result FOR INSERT WITH CHECK (created_by = current_rsn_user_id() OR is_admin() OR _user = current_rsn_user_id());

DROP POLICY IF EXISTS "user_activity_result SELECT" ON user_activity_result;
CREATE POLICY "user_activity_result SELECT" ON user_activity_result FOR SELECT USING (created_by = current_rsn_user_id() OR is_admin() OR _user = current_rsn_user_id());

DROP POLICY IF EXISTS "user_activity_result UPDATE" ON user_activity_result;
CREATE POLICY "user_activity_result UPDATE" ON user_activity_result FOR UPDATE USING (created_by = current_rsn_user_id() OR is_admin() OR _user = current_rsn_user_id());