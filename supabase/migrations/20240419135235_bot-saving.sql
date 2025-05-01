CREATE TABLE bot_set (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('botset')),
    CONSTRAINT bot_set__id__check_prefix CHECK (public.is_valid_typed_uuid('botset', id)),
    _name text,
    -- If this is a user's personal bot set, this will be the user's id
    for_user text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    _description text,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE bot_set IS 'A set of bots';
COMMENT ON COLUMN bot_set.id IS 'The unique identifier for the bot set';
COMMENT ON COLUMN bot_set._name IS 'The name of the bot set';
COMMENT ON COLUMN bot_set.for_user IS 'If this is a user''s personal bot set, this will be the user''s id';
COMMENT ON COLUMN bot_set._description IS 'The description of the bot set';
COMMENT ON COLUMN bot_set.metadata IS 'The metadata for the bot set';
COMMENT ON COLUMN bot_set.created_date IS 'The date the bot set was created';
COMMENT ON COLUMN bot_set.updated_date IS 'The date the bot set was last updated';
COMMENT ON COLUMN bot_set.created_by IS 'The user that created the bot set';
COMMENT ON COLUMN bot_set.updated_by IS 'The user that last updated the bot set';

--------------------
-- Permissions
ALTER TABLE public.bot_set ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.bot_set TO authenticated;
CREATE POLICY bot_set__authenticated__insert ON public.bot_set FOR INSERT TO authenticated WITH CHECK (
    CASE
        -- Can only insert if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY bot_set__authenticated__select ON public.bot_set FOR SELECT TO authenticated USING (
    CASE
        -- Can only select if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY bot_set__authenticated__update ON public.bot_set FOR UPDATE TO authenticated USING (
    CASE
        -- Can only update if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY bot_set__authenticated__delete ON public.bot_set FOR DELETE TO authenticated USING (
    CASE
        -- Can only delete if for_user is the user's id.
        WHEN (for_user IS NOT NULL) THEN (for_user = current_rsn_user_id())
        -- Otherwise we're fine.
        ELSE true
    END
);

-- anon NO access
GRANT ALL ON TABLE public.bot_set TO anon;
CREATE POLICY bot_set__anon__insert ON public.bot_set FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY bot_set__anon__select ON public.bot_set FOR SELECT TO anon USING (false);
CREATE POLICY bot_set__anon__update ON public.bot_set FOR UPDATE TO anon USING (false);
CREATE POLICY bot_set__anon__delete ON public.bot_set FOR DELETE TO anon USING (false);

-- service_role ALL access
GRANT ALL ON TABLE public.bot_set TO service_role;
CREATE POLICY bot_set__service_role__insert ON public.bot_set FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY bot_set__service_role__select ON public.bot_set FOR SELECT TO service_role USING (true);
CREATE POLICY bot_set__service_role__update ON public.bot_set FOR UPDATE TO service_role USING (true);
CREATE POLICY bot_set__service_role__delete ON public.bot_set FOR DELETE TO service_role USING (true);

-------------------------
-- Triggers
CREATE TRIGGER run_tgr_apply_audit BEFORE
    INSERT
        OR
    UPDATE ON public.bot_set FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();

CREATE TRIGGER log_operation
    AFTER
    INSERT
        OR DELETE
        OR
    UPDATE ON public.bot_set FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

---------------------------------------------------------------------
-- Create table `bot_set_bot`
INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('bot_set_bot', 'sklsetskl');

CREATE TABLE bot_set_bot (
    id text NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('sklsetskl')),
    CONSTRAINT bot_set_bot__id__check_prefix CHECK (public.is_valid_typed_uuid('sklsetskl', id)),
    bot_set text REFERENCES public.bot_set(id) ON DELETE CASCADE,
    bot text REFERENCES public.bot(id) ON DELETE CASCADE,
    metadata jsonb,
    created_date timestamptz NOT NULL DEFAULT now(),
    updated_date timestamptz NOT NULL DEFAULT now(),
    created_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES public.rsn_user(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE bot_set_bot IS 'A bot in a bot set';
COMMENT ON COLUMN bot_set_bot.id IS 'The unique identifier for the bot set bot';
COMMENT ON COLUMN bot_set_bot.bot_set IS 'The bot set the bot belongs to';
COMMENT ON COLUMN bot_set_bot.bot IS 'The bot';
COMMENT ON COLUMN bot_set_bot.metadata IS 'The metadata for the bot set bot';
COMMENT ON COLUMN bot_set_bot.created_date IS 'The date the bot set bot was created';
COMMENT ON COLUMN bot_set_bot.updated_date IS 'The date the bot set bot was last updated';
COMMENT ON COLUMN bot_set_bot.created_by IS 'The user that created the bot set bot';
COMMENT ON COLUMN bot_set_bot.updated_by IS 'The user that last updated the bot set bot';

--------------------
-- Permissions
ALTER TABLE public.bot_set_bot ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.bot_set_bot TO authenticated;
CREATE POLICY bot_set_bot__authenticated__insert ON public.bot_set_bot FOR INSERT TO authenticated WITH CHECK (
    CASE
        -- Can only insert if bot_set is the user's id.
        WHEN (bot_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM bot_set WHERE id = bot_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY bot_set_bot__authenticated__select ON public.bot_set_bot FOR SELECT TO authenticated USING (
    CASE
        -- Can only select if bot_set is the user's id.
        WHEN (bot_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM bot_set WHERE id = bot_set_bot.bot_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY bot_set_bot__authenticated__update ON public.bot_set_bot FOR UPDATE TO authenticated USING (
    CASE
        -- Can only update if bot_set is the user's id.
        WHEN (bot_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM bot_set WHERE id = bot_set_bot.bot_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);
CREATE POLICY bot_set_bot__authenticated__delete ON public.bot_set_bot FOR DELETE TO authenticated USING (
    CASE
        -- Can only delete if bot_set is the user's id.
        WHEN (bot_set IS NOT NULL) THEN (
            SELECT for_user = current_rsn_user_id() FROM bot_set WHERE id = bot_set_bot.bot_set
        )
        -- Otherwise we're fine.
        ELSE true
    END
);

-- anon NO access
GRANT ALL ON TABLE public.bot_set_bot TO anon;
CREATE POLICY bot_set_bot__anon__insert ON public.bot_set_bot FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY bot_set_bot__anon__select ON public.bot_set_bot FOR SELECT TO anon USING (false);
CREATE POLICY bot_set_bot__anon__update ON public.bot_set_bot FOR UPDATE TO anon USING (false);
CREATE POLICY bot_set_bot__anon__delete ON public.bot_set_bot FOR DELETE TO anon USING (false);

-- service_role ALL access
GRANT ALL ON TABLE public.bot_set_bot TO service_role;
CREATE POLICY bot_set_bot__service_role__insert ON public.bot_set_bot FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY bot_set_bot__service_role__select ON public.bot_set_bot FOR SELECT TO service_role USING (true);
CREATE POLICY bot_set_bot__service_role__update ON public.bot_set_bot FOR UPDATE TO service_role USING (true);
CREATE POLICY bot_set_bot__service_role__delete ON public.bot_set_bot FOR DELETE TO service_role USING (true);