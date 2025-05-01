
CREATE OR REPLACE FUNCTION public.email_for_rsn_user(rsn_user_id text)
RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN (SELECT auth_email FROM rsn_user WHERE id = rsn_user_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tgr_oplog_webhook()
RETURNS TRIGGER AS $$
DECLARE
    headers CONSTANT TEXT := '{"Content-Type":"application/json"}';
    timeout CONSTANT TEXT := '1000';
    webhook_url TEXT;
    webhook_format TEXT;
BEGIN
    -- For each webhook, check if this table is in the list of tables to watch
    FOR webhook_url, webhook_format IN
        SELECT 
            opw.webhook_url,
            opw.webhook_format
        FROM rsn_private.oplog_webhooks opw
        WHERE 
            opw.webhook_format = 'discord' 
            AND 
            (
                NEW.table_name = ANY(opw.tables)
                OR 
                opw.all_tables
            )
    LOOP
        IF webhook_format = 'discord' THEN
            PERFORM net.http_post(
                url:=webhook_url,
                body:=json_build_object(
                    'username', 'test',
                    'content', jsonb_pretty(json_build_object(
                        'entity_id', NEW.entity_id,
                        'who', NEW.rsn_user_id,
                        'email', public.email_for_rsn_user(NEW.rsn_user_id),
                        'when', NEW.event_date,
                        'table', NEW.table_name,
                        'type', NEW.operation_type,
                        'json_diff', NEW.jsonb_diff
                        'oplog_metadata', json_build_object(
                            'oplog_id', NEW.id
                        )
                    )::jsonb)
                )::JSONB,
                headers:=headers::JSONB
            );
        END IF;
        -- TODO: handle slack webhook_format
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;