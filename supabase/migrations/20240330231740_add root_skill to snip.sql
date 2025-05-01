ALTER TABLE snip ADD COLUMN root_skill text REFERENCES skill(id) ON DELETE SET NULL;

-- Add trigger to create skill when snip is created,
-- Unless root_skill already exists
CREATE OR REPLACE FUNCTION tgr_create_snip_skill() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.root_skill IS NULL THEN
        -- Create the skill, saving its id so we can use it
        INSERT INTO skill (_name) VALUES (NEW._name) RETURNING id INTO NEW.root_skill;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER create_snip_skill
    BEFORE INSERT OR UPDATE ON snip
    FOR EACH ROW
    EXECUTE FUNCTION tgr_create_snip_skill();

-- Add trigger to update skill name when snip name is updated
CREATE OR REPLACE FUNCTION tgr_update_snip_skill() RETURNS TRIGGER AS $$
BEGIN
    UPDATE skill SET _name = NEW._name WHERE id = NEW.root_skill;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_snip_skill
    BEFORE UPDATE OF _name ON snip
    FOR EACH ROW
    EXECUTE FUNCTION tgr_update_snip_skill();
