import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CreateCourseRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
    route: CreateCourseRoute,
    handler: async (ctx) => {
        const { parsedReq, user, supabase } = ctx;

        if (!user) {
            throw new Error('User not found');
        }

        // Create the root skill
        const { data: rootSkillData, error: rootSkillError } = await supabase.from('skill').insert({
            _name: parsedReq.rootSkillName,
            for_user: user.rsnUserId,
        }).select().single();

        if (rootSkillError || !rootSkillData) {
            console.error(rootSkillError?.message || 'Failed to create root skill');
            throw new Error(rootSkillError?.message || 'Failed to create root skill');
        }

        // Create the course
        const { data: courseData, error: courseError } = await supabase.from('course').insert({
            _name: parsedReq.name,
            _description: parsedReq.description,
            for_user: user.rsnUserId,
            root_skill: rootSkillData.id,
        }).select().single();

        if (courseError || !courseData) {
            console.error(courseError?.message || 'Failed to create course');
            throw new Error(courseError?.message || 'Failed to create course');
        }

        return {
            courseId: courseData.id,
            rootSkillId: rootSkillData.id,
        };
    }
}); 