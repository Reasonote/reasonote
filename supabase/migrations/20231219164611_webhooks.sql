
CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON chat FOR EACH ROW EXECUTE FUNCTION tgr_log_operation();
CREATE TRIGGER log_operation AFTER INSERT OR DELETE OR UPDATE ON chat_message FOR EACH ROW EXECUTE FUNCTION tgr_log_operation();

CREATE TYPE webhook_format AS ENUM (
    'discord',
    'slack'
);


CREATE SCHEMA IF NOT EXISTS rsn_private;
CREATE TABLE IF NOT EXISTS rsn_private.oplog_webhooks (
    webhook_name text NOT NULL,
    webhook_url text NOT NULL,
    -- Single element enum of 'discord'
    webhook_format webhook_format NOT NULL,
    tables text[],
    all_tables boolean NOT NULL,
    CONSTRAINT oplog_webhooks_pkey PRIMARY KEY (webhook_name)
);
COMMENT ON TABLE rsn_private.oplog_webhooks IS 'Webhooks that listen on the operation_log table.';
COMMENT ON COLUMN rsn_private.oplog_webhooks.webhook_name IS 'The name of the webhook.';
COMMENT ON COLUMN rsn_private.oplog_webhooks.webhook_url IS 'The url of the webhook.';
COMMENT ON COLUMN rsn_private.oplog_webhooks.webhook_format IS 'The format of the webhook. Currently only supports discord.';
COMMENT ON COLUMN rsn_private.oplog_webhooks.tables IS 'The tables that this webhook listens to. If all_tables is true, this is ignored.';
COMMENT ON COLUMN rsn_private.oplog_webhooks.all_tables IS 'Whether or not this webhook listens to all tables.';

ALTER TABLE rsn_private.oplog_webhooks OWNER TO postgres;


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
                        'id', NEW.id,
                        'who', NEW.rsn_user_id,
                        'json_diff', NEW.jsonb_diff
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



CREATE OR REPLACE FUNCTION json_diff_values(val1 JSON,val2 JSON)
RETURNS JSONB 
LANGUAGE plpgsql
AS $function$
    DECLARE
      result JSONB;
      v RECORD;
    BEGIN
       result = val1;
       FOR v IN SELECT * FROM json_each(val2) LOOP
         IF result @> jsonb_build_object(v.key,v.value)
            THEN result = result - v.key;
         ELSIF result ? v.key THEN CONTINUE;
         ELSE
            result = result || jsonb_build_object(v.key,'null');
         END IF;
       END LOOP;
       RETURN result;
    END;
$function$
;


CREATE OR REPLACE FUNCTION public.tgr_log_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        _id text;
        _diff jsonb;
    BEGIN
        
        IF TG_OP = 'DELETE' THEN 
            _id = OLD.id;
        ELSE 
            _id = NEW.id;
        END IF;
        
        SELECT * 
        INTO _diff
        FROM json_diff_values(row_to_json(NEW.*), row_to_json(OLD.*));
        
        INSERT INTO public.operation_log (id, table_name, trigger_name, operation_when, operation_type, operation_level, entity_id, jsonb_diff, rsn_user_id, event_date)
        VALUES(uuid_generate_v4(), TG_TABLE_NAME, TG_NAME, TG_WHEN, TG_OP, TG_LEVEL, _id, _diff, current_rsn_user_id(), (now() AT TIME ZONE 'utc'::text));
        
        RETURN NEW;
    
    EXCEPTION 
        WHEN OTHERS THEN 
        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
        RETURN NEW;
    END;
$function$
;

DROP TRIGGER IF EXISTS log_operation ON public.rsn_vec;
DROP TRIGGER IF EXISTS log_operation ON public.rsn_vec_queue;
DROP TRIGGER IF EXISTS log_operation ON public.rsn_page_vec_queue;

CREATE TRIGGER tgr_oplog_webhook
    AFTER INSERT ON public.operation_log
    FOR EACH ROW
    EXECUTE FUNCTION public.tgr_oplog_webhook();