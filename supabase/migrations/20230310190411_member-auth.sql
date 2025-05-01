
CREATE TYPE public.agent_type AS ENUM ('user', 'bot', 'group');

CREATE OR REPLACE FUNCTION public.is_base_access_level(_entity_type text, _access_level text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    BEGIN 
        RETURN ( _access_level ILIKE 'OWNER' OR 
                _access_level ILIKE 'ADMIN' OR 
                _access_level ILIKE 'EDITOR' OR
                _access_level ILIKE 'VIEWER' OR
                _access_level ILIKE 'COMMENTOR' OR
                _access_level ILIKE 'GUEST'
        ); 
    END; 
$function$
;
GRANT ALL ON FUNCTION public.is_base_access_level(_entity_type text, _access_level text) TO authenticated;
GRANT ALL ON FUNCTION public.is_base_access_level(_entity_type text, _access_level text) TO service_role;


----------------------------------------------------------------------------
-- BEGIN: Group
-- An GROUP can consist of other groups, users, and bots
CREATE TABLE public.group (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('grp')),
    CONSTRAINT group__id__check_prefix CHECK (public.is_valid_typed_uuid('grp', id)),
    group_name text
)
;

ALTER TABLE public.group ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group DELETE" ON public.group FOR DELETE USING (true);
CREATE POLICY "group INSERT" ON public.group FOR SELECT USING (true);
CREATE POLICY "group SELECT" ON public.group FOR SELECT USING (true);
CREATE POLICY "group UPDATE" ON public.group FOR UPDATE USING (true);
GRANT ALL ON TABLE public.group TO anon;
GRANT ALL ON TABLE public.group TO authenticated;
GRANT ALL ON TABLE public.group TO service_role;
-- END: Group
-----------------------------------------------------------------------------

CREATE TABLE public.member_authorization (
    id typed_uuid NOT NULL PRIMARY KEY DEFAULT (generate_typed_uuid('ma')),
    CONSTRAINT member_auth__id__check_prefix CHECK (public.is_valid_typed_uuid('ma', id)),
    --------------------------------------------------------
    -- WHAT ARE WE GRANTING ACCESS TO?
    granted_chat_id typed_uuid REFERENCES public.chat(id) ON DELETE CASCADE,
    granted_bot_id typed_uuid REFERENCES public.bot(id) ON DELETE CASCADE,
    granted_group_id typed_uuid REFERENCES public.group(id) ON DELETE CASCADE,
    -- What is being granted?
    granted_entity_id typed_uuid GENERATED ALWAYS AS (COALESCE(granted_chat_id, granted_bot_id, granted_group_id)) STORED,
    -- What kind of agent is this?
    granted_entity_type text,

    -------------------------------------------------------
    -- WHAT LEVEL OF ACCESS?
    access_level character varying(512) NOT NULL,
    -- Check if this is a base access level.
    is_base_access_level boolean GENERATED ALWAYS AS (public.is_base_access_level((granted_entity_type)::text, (access_level)::text)) STORED,

    -------------------------------------------------------
    -- WHO IS BEING AUTHORIZED?
    user_id typed_uuid NOT NULL REFERENCES public.rsn_user(id) ON DELETE CASCADE,
    bot_id typed_uuid NOT NULL REFERENCES public.bot(id) ON DELETE CASCADE,
    group_id typed_uuid NOT NULL REFERENCES public.group(id) ON DELETE CASCADE,
    -- ID of agent who is being authorized
    agent_id typed_uuid GENERATED ALWAYS AS (COALESCE(user_id, bot_id, group_id)) STORED,
    -- What kind of agent is this?
    agent_type public.agent_type NOT NULL GENERATED ALWAYS AS (
        CASE WHEN user_id IS NULL THEN 
            (CASE when bot_id IS NULL THEN 'group'::agent_type ELSE 'bot'::agent_type END) 
            ELSE 'user'::agent_type
        END
    ) STORED,

    -- ---------------------------------------------------------
    -- -- AUDIT PROPERTIES
    created_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    modified_by typed_uuid DEFAULT public.current_rsn_user_id(),
    modified_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    created_by typed_uuid DEFAULT public.current_rsn_user_id()

    -- --------------------------------------------------------
    -- -- CONSTRAINTS
    -- -- Only one member per member authorization.
    CONSTRAINT one_member_only_check CHECK ((
        (user_id IS NOT NULL)::integer + 
        (bot_id IS NOT NULL)::integer + 
        (group_id IS NOT NULL)::integer
    ) = 1),

    -- Only one item can be granted per member authorization
    CONSTRAINT member_authorization_check CHECK ((
        (granted_chat_id IS NOT NULL)::integer +
        (granted_bot_id IS NOT NULL)::integer +
        (granted_group_id IS NOT NULL)::integer
    ) = 1),

    CONSTRAINT ma_type_matches_typename CHECK ((
        ((granted_chat_id IS NOT NULL) AND (granted_entity_type = 'chat')) OR
        ((granted_bot_id IS NOT NULL) AND (granted_entity_type = 'bot')) OR
        ((granted_group_id IS NOT NULL) AND (granted_entity_type = 'group'))
    )),

    -- Only one grant per access level, member, 
    CONSTRAINT member_authorization_member_entity_type_id_access_level_key UNIQUE (
        agent_id, granted_entity_type, granted_entity_id, access_level
    )
);

ALTER TABLE public.member_authorization OWNER TO postgres;

COMMENT ON TABLE public.member_authorization IS '@graphql({"totalCount": {"enabled": true}})';

------------------------------------
-- INDICES
-- TODO finish Indices
-- CREATE INDEX member_authorization_authorized_organization_id_idx ON public.member_authorization USING btree (authorized_organization_id);
-- CREATE INDEX member_authorization_authorized_chat_id_idx ON public.member_authorization USING btree (authorized_chat_id);
-- CREATE INDEX member_authorization_member_id_idx ON public.member_authorization USING btree (member_id);
-- CREATE UNIQUE INDEX unique_base_access_level_check_idx ON public.member_authorization USING btree (member_id, authorized_entity_type, authorized_entity_id) WHERE (is_base_access_level = true);

-----------------------
-- TRIGGERS
CREATE TRIGGER handle_audit_properties BEFORE INSERT OR UPDATE ON public.member_authorization FOR EACH ROW EXECUTE FUNCTION public.tgr_apply_audit();
CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON public.member_authorization FOR EACH ROW EXECUTE FUNCTION public.tgr_log_operation();

ALTER TABLE public.member_authorization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_authorization DELETE" ON public.member_authorization FOR DELETE USING (true);
CREATE POLICY "member_authorization INSERT" ON public.member_authorization FOR SELECT USING (true);
CREATE POLICY "member_authorization SELECT" ON public.member_authorization FOR SELECT USING (true);
CREATE POLICY "member_authorization UPDATE" ON public.member_authorization FOR UPDATE USING (true);
GRANT ALL ON TABLE public.member_authorization TO anon;
GRANT ALL ON TABLE public.member_authorization TO authenticated;
GRANT ALL ON TABLE public.member_authorization TO service_role;



CREATE TYPE mock__get_user_stripe_subs_short AS (
    id TEXT,
    product_lookup_key TEXT,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP
);


CREATE OR REPLACE FUNCTION public.get_user_stripe_subs_short(mock mock__get_user_stripe_subs_short DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    product_lookup_key TEXT,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP
)
LANGUAGE plv8
AS $$
    const defaultData = {
        id: 'fake_id_1',
        product_lookup_key: 'Reasonote-Free',
        current_period_start: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        current_period_end: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
    };

    const data = [
        {
            id: (mock && mock.id) || defaultData.id,
            product_lookup_key: (mock && mock.product_lookup_key) || defaultData.product_lookup_key,
            current_period_start: (mock && mock.current_period_start) || defaultData.current_period_start,
            current_period_end: (mock && mock.current_period_end) || defaultData.current_period_end
        }
    ];

    // Convert JSON to table rows
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        plv8.return_next(row);
    }
$$
;