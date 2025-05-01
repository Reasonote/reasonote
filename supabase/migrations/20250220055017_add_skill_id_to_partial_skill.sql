alter table partial_skill add column skill_id text default null;

alter table partial_skill add constraint fk_skill_id foreign key (skill_id) references skill(id) on delete set null;

-- add a comment on the skill_id column
comment on column partial_skill.skill_id is 'The skill that the partial skill belongs to';
