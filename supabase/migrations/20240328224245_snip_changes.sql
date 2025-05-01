
-- CREATE TYPE extraction_state AS ENUM ('pending', 'processing', 'success', 'failed');
-- ALTER TABLE public.snip ADD COLUMN extraction_state extraction_state DEFAULT 'pending';

ALTER TYPE extraction_state ADD VALUE 'unnecessary';

-----------------------------------------------------------
-- Create trigger which will check if there is already content_text,
-- or if content text is all spaces, and mark that the extraction is unnecessary.
CREATE OR REPLACE FUNCTION mark_extraction_as_unnecessary() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_url IS NOT NULL 
    AND (NEW.source_url ~ '^\s*$')
    AND NEW.text_content IS NOT NULL
    AND (NEW.text_content ~ '^\s*$')
  THEN
    NEW.extraction_state := 'unnecessary';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_extraction_as_unnecessary_trigger
  BEFORE INSERT OR UPDATE ON snip
  FOR EACH ROW
  EXECUTE FUNCTION mark_extraction_as_unnecessary();

-----------------------------------------------------------
-- These parameters will be filled by an LLM.
ALTER TABLE snip ADD COLUMN auto_title TEXT;
COMMENT ON COLUMN public.snip.auto_title IS 'The title that was automatically generated for this snip.';

ALTER TABLE snip ADD COLUMN auto_summary TEXT;
COMMENT ON COLUMN public.snip.auto_summary IS 'The summary that was automatically generated for this snip.';

ALTER TABLE snip ADD COLUMN auto_tags TEXT[];
COMMENT ON COLUMN public.snip.auto_tags IS 'The tags that were automatically generated for this snip.';

ALTER TABLE snip ADD COLUMN auto_last_updated_date TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN public.snip.auto_last_updated_date IS 'The date that the automated params on this snip were last updated.';

ALTER TABLE snip ADD COLUMN auto_param_update_state extraction_state DEFAULT 'pending';
COMMENT ON COLUMN public.snip.auto_param_update_state IS 'The state of the last run of the automated parameter update.';

ALTER TABLE snip ADD COLUMN auto_param_update_attempts INT DEFAULT 0;
COMMENT ON COLUMN public.snip.auto_param_update_attempts IS 'The number of times the automated parameter update has been attempted.';


CREATE OR REPLACE FUNCTION pop_snips_for_auto_param_update(num_snips INT) RETURNS SETOF snip AS $$
DECLARE
  snip_record snip;
BEGIN
    -- A Function which will will try to pop of a number of snips (the number Provided as an argument) in one of the following states:
        -- auto_param_update_state = 'pending'
        -- auto_param_update_state = 'failed' AND auto_param_update_attempts < 3
        -- auto_last_updated_date is older than 1 hour AND updated_date is newer than 1 hour
    -- When these are popped off, they will be marked as processing.
    -- This function will be called by an LLM.

    FOR snip_record IN
        SELECT * FROM snip
            WHERE auto_param_update_state = 'pending'
            OR (auto_param_update_state = 'failed' AND auto_param_update_attempts < 3)
            OR (auto_last_updated_date < now() - interval '1 hour' AND updated_date > now() - interval '1 hour')
            LIMIT num_snips
    LOOP
    -- Update and set to processing
    -- Also set the auto_param_update_attempts to 0
        UPDATE snip
            SET auto_param_update_state = 'processing'
            WHERE id = snip_record.id;
            RETURN NEXT snip_record;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Perms -- service role only.
REVOKE ALL ON FUNCTION pop_snips_for_auto_param_update(INT) FROM public;
REVOKE ALL ON FUNCTION pop_snips_for_auto_param_update(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION pop_snips_for_auto_param_update(INT) TO service_role;


CREATE OR REPLACE FUNCTION update_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is null or empty, set it to a default value.
  IF NEW._name IS NULL OR NEW._name ~ '^\s*$' THEN
    NEW._name := 'Snip on ' || to_char(NOW(), 'Day, Mon DD, HH12:MIam');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;