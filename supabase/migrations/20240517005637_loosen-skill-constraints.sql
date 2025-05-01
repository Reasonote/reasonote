-- First, we need to drop the existing foreign key constraints

ALTER TABLE "chapter" DROP CONSTRAINT "chapter_root_skill_fkey";
ALTER TABLE "lesson" DROP CONSTRAINT "lesson_root_skill_fkey";

-- Now, let's add them back with ON DELETE CASCADE

ALTER TABLE "chapter" 
ADD CONSTRAINT "chapter_root_skill_fkey" 
FOREIGN KEY (root_skill) 
REFERENCES skill(id) 
ON DELETE CASCADE;

ALTER TABLE "lesson" 
ADD CONSTRAINT "lesson_root_skill_fkey" 
FOREIGN KEY (root_skill) 
REFERENCES skill(id) 
ON DELETE CASCADE;