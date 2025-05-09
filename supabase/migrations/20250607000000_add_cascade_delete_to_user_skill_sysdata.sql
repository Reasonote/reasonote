-- Drop the existing foreign key constraint
ALTER TABLE ONLY public.user_skill_sysdata
    DROP CONSTRAINT user_skill_sysdata_skill_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE ONLY public.user_skill_sysdata
    ADD CONSTRAINT user_skill_sysdata_skill_fkey 
    FOREIGN KEY (skill) REFERENCES public.skill(id) ON DELETE CASCADE; 