
ALTER TABLE chat_message ADD COLUMN context_type TEXT;
ALTER TABLE chat_message ADD COLUMN context_id TEXT;
ALTER TABLE chat_message ADD COLUMN context_data JSONB;

COMMENT ON COLUMN chat_message.context_type IS 'The type of context for the message, if any.';
COMMENT ON COLUMN chat_message.context_id IS 'The id of the context for the message, if any.';
COMMENT ON COLUMN chat_message.context_data IS 'The data of the context for the message, if any.';

-- Make it such that context columns can only be set on messages who have a `_role` not set to "user"
CREATE OR REPLACE FUNCTION chat_message_context_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW._role = 'user' THEN
    IF NEW.context_type IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot set context_type on a message with _role=user';
    END IF;
    IF NEW.context_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot set context_id on a message with _role=user';
    END IF;
    IF NEW.context_data IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot set context_data on a message with _role=user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_message_context_check
    BEFORE INSERT OR UPDATE ON chat_message
    FOR EACH ROW
    EXECUTE FUNCTION chat_message_context_check();
