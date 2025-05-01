alter table skill add column domain text default null;

-- add comment
comment on column skill.domain is 'The domain of the skill';