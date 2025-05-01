-- Add resend_synced column to email_subscription table
ALTER TABLE email_subscription
ADD COLUMN resend_synced BOOLEAN NOT NULL DEFAULT FALSE;

-- Create function and trigger for rsn_user table
CREATE OR REPLACE FUNCTION update_resend_synced_on_user_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE email_subscription
  SET resend_synced = FALSE
  WHERE rsn_user_id = NEW.id
    AND (
      OLD.given_name IS DISTINCT FROM NEW.given_name
      OR OLD.family_name IS DISTINCT FROM NEW.family_name
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resend_synced_on_user_change
AFTER UPDATE ON rsn_user
FOR EACH ROW
EXECUTE FUNCTION update_resend_synced_on_user_change();

-- Create function and trigger for email_subscription table
CREATE OR REPLACE FUNCTION update_resend_synced_on_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.product_updates IS DISTINCT FROM NEW.product_updates
      OR OLD.edtech_updates IS DISTINCT FROM NEW.edtech_updates
      OR OLD.newsletter IS DISTINCT FROM NEW.newsletter) THEN
    NEW.resend_synced = FALSE;
  ELSE
    NEW.resend_synced = NEW.resend_synced;  -- Keep the new value if only resend_synced is changing
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resend_synced_on_subscription_change
BEFORE UPDATE ON email_subscription
FOR EACH ROW
EXECUTE FUNCTION update_resend_synced_on_subscription_change();