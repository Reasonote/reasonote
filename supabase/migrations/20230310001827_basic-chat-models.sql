------------------------------------------------------------------------
-- BEGIN: Create bot
--

CREATE TABLE public.bot (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('bot')),
    name text,
    description text,
    prompt text,
    avatar_url text,
    is_public boolean NOT NULL DEFAULT false,
    forked_from typed_uuid REFERENCES public.bot(id) ON DELETE SET NULL,
    extras JSONB,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT bot_id_check_prefix CHECK (id ILIKE 'bot__%')
);

COMMENT ON TABLE public.bot IS 'A bot is a virtual agent.';
COMMENT ON COLUMN public.bot.name IS 'The name of the bot.';
COMMENT ON COLUMN public.bot.description IS 'The description of the bot.';
COMMENT ON COLUMN public.bot.prompt IS 'The prompt initially given to the bot.';
COMMENT ON COLUMN public.bot.is_public IS 'Indicates if the bot is public.';
COMMENT ON COLUMN public.bot.extras IS 'Extra data related to the bot.';
COMMENT ON COLUMN public.bot.created_date IS 'When the bot was created.';
COMMENT ON COLUMN public.bot.updated_date IS 'When the bot was last updated.';
COMMENT ON COLUMN public.bot.created_by IS 'The user who created the bot.';
COMMENT ON COLUMN public.bot.updated_by IS 'The user who last updated the bot.';

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.bot FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Permissions & Policies
ALTER TABLE public.bot OWNER TO postgres;
ALTER TABLE public.bot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bot INSERT" ON public.bot FOR INSERT WITH CHECK (true);
CREATE POLICY "bot UPDATE" ON public.bot FOR UPDATE USING (true);
CREATE POLICY "bot DELETE" ON public.bot FOR DELETE USING (true);
CREATE POLICY "bot SELECT" ON public.bot FOR SELECT USING (true);
GRANT ALL ON TABLE public.bot TO anon;
GRANT ALL ON TABLE public.bot TO authenticated;
GRANT ALL ON TABLE public.bot TO service_role;

--
-- END: Create bots
------------------------------------------------------------------------

------------------------------------------------------------------------
-- BEGIN: Create bot 
--



-- Insert new entry into the bot table, disabling the trigger so that we can set it to be created by the RSN_SYSTEM_USER
ALTER TABLE public.bot DISABLE TRIGGER run_tgr_apply_audit;
-- Reasonator
INSERT INTO bot (id, name, description, prompt, avatar_url, is_public, created_by, updated_by) VALUES (
    'bot_01010101-0101-0101-0101-010134501073',
    'Reasonator',
    'Reasonator is a virtual agent that helps you to take notes and organize your thoughts.',
    'You are Reasonator, a virtual agent that helps you learn, take notes and organize your thoughts.',
    '',
    true,
    public.rsn_system_user_id(),
    public.rsn_system_user_id()
);

ALTER TABLE public.bot ENABLE TRIGGER run_tgr_apply_audit;

--
-- END: Create bot_user
------------------------------------------------------------------------



------------------------------------------------------------------------
-- BEGIN: Create chat
--

CREATE TABLE public.chat (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('chat')),
    topic text,
    manual_title text,
    auto_title text,
    is_public boolean NOT NULL DEFAULT false,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT chat_id_check_prefix CHECK (public.is_valid_typed_uuid('chat', id))
);

COMMENT ON TABLE public.chat IS 'A chat is a message thread.';
COMMENT ON COLUMN public.chat.id IS 'Unique identifier for the chat.';
COMMENT ON COLUMN public.chat.manual_title IS 'The user-defined title of the chat (if available).';
COMMENT ON COLUMN public.chat.auto_title IS 'The automatically-assigned title of the chat (if no manual title is given).';
COMMENT ON COLUMN public.chat.is_public IS 'Whether or not the chat is publicly accessible.';
COMMENT ON COLUMN public.chat.created_date IS 'The date and time at which the chat was created.';
COMMENT ON COLUMN public.chat.updated_date IS 'The date and time at which the chat was last updated.';
COMMENT ON COLUMN public.chat.created_by IS 'The user who created the chat.';
COMMENT ON COLUMN public.chat.updated_by IS 'The user who last updated the chat.';

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.chat FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Permissions & Policies
ALTER TABLE public.chat OWNER TO postgres;
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;

-- Anyone can add? Anyone authenticated can add?
CREATE POLICY "chat INSERT" ON public.chat FOR INSERT WITH CHECK (true);
-- The user who created the chat is the only one who can update.
-- CREATE POLICY "chat UPDATE" ON public.chat FOR UPDATE USING (created_by = current_rsn_user_id());
CREATE POLICY "chat UPDATE" ON public.chat FOR UPDATE USING (true);
-- The user who created the chat is the only one who can delete.
-- CREATE POLICY "chat DELETE" ON public.chat FOR DELETE USING (created_by = current_rsn_user_id());
CREATE POLICY "chat DELETE" ON public.chat FOR DELETE USING (true);
-- The user who created the chat is the only one who can select UNLESS the chat is public.
-- CREATE POLICY "chat SELECT" ON public.chat FOR SELECT USING (is_public = true OR created_by = current_rsn_user_id() OR updated_by = current_rsn_user_id());
Create POLICY "chat SELECT" ON public.chat FOR SELECT USING (true);

GRANT ALL ON TABLE public.chat TO anon;
GRANT ALL ON TABLE public.chat TO authenticated;
GRANT ALL ON TABLE public.chat TO service_role;

--
-- END: Create Chat
------------------------------------------------------------------------


------------------------------------------------------------------------
-- BEGIN: Create chat_entry
--

CREATE TABLE public.chat_message (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('cmsg')),
    body text,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by_bot typed_uuid REFERENCES public.bot(id) ON DELETE SET NULL,
    created_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by typed_uuid REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    CONSTRAINT chat_id_check_prefix CHECK (is_valid_typed_uuid('cmsg', id))
);

COMMENT ON TABLE public.chat_message IS 'A chat message is a message sent in a chat.';
COMMENT ON COLUMN public.chat_message.id IS 'Unique identifier for the chat message.';
COMMENT ON COLUMN public.chat_message.body IS 'The chat that contains the message.';
COMMENT ON COLUMN public.chat_message.created_date IS 'The date and time at which the message was created.';
COMMENT ON COLUMN public.chat_message.created_by IS 'The user who created the message. If the creator was a bot, this will be NULL.';
COMMENT ON COLUMN public.chat_message.created_by_bot IS 'The bot who created the message. If the creator was a user, this will be NULL.';
COMMENT ON COLUMN public.chat_message.updated_date IS 'The date and time at which the message was last updated.';
COMMENT ON COLUMN public.chat_message.updated_by IS 'The user who last updated the message.';

-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE INSERT OR UPDATE ON public.chat_message FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

-- Permissions & Policies
ALTER TABLE public.chat_message OWNER TO postgres;
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;

-- Anyone can add? Anyone authenticated can add?
CREATE POLICY "chat_message INSERT" ON public.chat_message FOR INSERT WITH CHECK (true);
-- The user who created the chat_message is the only one who can update.
-- CREATE POLICY "chat_message UPDATE" ON public.chat_message FOR UPDATE USING (created_by = current_rsn_user_id());
CREATE POLICY "chat_message UPDATE" ON public.chat_message FOR UPDATE USING (true);
-- The user who created the chat_message is the only one who can delete.
-- CREATE POLICY "chat_message DELETE" ON public.chat_message FOR DELETE USING (created_by = current_rsn_user_id());
CREATE POLICY "chat_message DELETE" ON public.chat_message FOR DELETE USING (true);
-- The user who created the chat_message is the only one who can select UNLESS the chat_message is public.
-- CREATE POLICY "chat_message SELECT" ON public.chat_message FOR SELECT USING (is_public = true OR created_by = current_rsn_user_id() OR updated_by = current_rsn_user_id());
Create POLICY "chat_message SELECT" ON public.chat_message FOR SELECT USING (true);

GRANT ALL ON TABLE public.chat_message TO anon;
GRANT ALL ON TABLE public.chat_message TO authenticated;
GRANT ALL ON TABLE public.chat_message TO service_role;

--
-- END: Create Chat
------------------------------------------------------------------------
