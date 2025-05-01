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
                    'username', (CASE 
                        WHEN NEW.rsn_user_id IS NULL THEN 'Null User'
                        ELSE public.email_for_rsn_user(NEW.rsn_user_id) || ' (' || public.reverse_name_for_rsn_user(NEW.rsn_user_id) || ' ' ||  NEW.rsn_user_id || ')'
                    END),
                    'content', jsonb_pretty(json_build_object(
                        'what', json_build_object(
                            'id', NEW.entity_id,
                            'table', NEW.table_name,
                            'optype', NEW.operation_type,
                            'json_diff', NEW.jsonb_diff
                        ),
                        'when', NEW.event_date,
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