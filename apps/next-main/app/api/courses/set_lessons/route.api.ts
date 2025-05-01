import { makeServerApiHandlerV3 } from "../../helpers/serverApiHandlerV3";
import { SetCourseLessonsRoute } from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
    route: SetCourseLessonsRoute,
    handler: async (ctx) => {
        const { parsedReq, user, supabase } = ctx;

        if (!user) {
            throw new Error('User not found');
        }

        const { courseId, lessons } = parsedReq;

        // Fetch existing lessons for the course
        const { data: existingLessons, error: fetchError } = await supabase
            .from('course_lesson')
            .select('lesson, order_index')
            .eq('course', courseId);

        if (fetchError) {
            throw new Error(`Failed to fetch existing lessons: ${fetchError.message}`);
        }

        const existingLessonIds = existingLessons.map(l => l.lesson);

        // Delete lessons that are not in the new list
        const lessonsToDelete = existingLessons.filter(l => !lessons.some(newLesson => newLesson.id === l.lesson));
        if (lessonsToDelete.length > 0) {
            const deleteIds = lessonsToDelete.map(l => l.lesson);
            await supabase.from('course_lesson').delete().in('lesson', deleteIds);
            await supabase.from('lesson').delete().in('id', deleteIds);
        }

        // Add or update lessons
        const lessonPromises = lessons.map(async (lesson, index) => {
            if (!lesson.id || !existingLessonIds.includes(lesson.id) || lesson.id.startsWith('new-')) {
                // Create new lesson
                const { data: lessonData, error: lessonError } = await supabase.from('lesson').insert({
                    _name: lesson.name,
                    _summary: lesson.description,
                    for_user: user?.rsnUserId,
                    root_skill: lesson.rootSkillId,
                }).select().single();

                if (lessonError || !lessonData) {
                    throw new Error(`Failed to create lesson: ${lessonError?.message}`);
                }

                // Link lesson to course
                // Temporary index is the number of existing lessons + the index of the new lesson
                const { data: courseLessonData, error: courseLessonError } = await supabase.from('course_lesson').insert({
                    course: courseId,
                    lesson: lessonData.id,
                    order_index: existingLessons.length + index,
                }).select().single();

                if (courseLessonError || !courseLessonData) {
                    throw new Error(`Failed to link lesson to course: ${courseLessonError?.message}`);
                }

                return {
                    id: lessonData.id,
                    name: lessonData._name,
                    description: lessonData._summary,
                    rootSkillId: lessonData.root_skill,
                    order_index: index
                };
            } else {
                // For existing lessons, just return the data - we'll update order indices in bulk later
                return {
                    id: lesson.id,
                    name: lesson.name,
                    description: lesson.description,
                    rootSkillId: lesson.rootSkillId,
                    order_index: index
                };
            }
        });

        const updatedLessons = await Promise.all(lessonPromises);

        // Bulk update all order indices for existing lessons
        const orderUpdates = updatedLessons
            .map(lesson => ({
                lesson: lesson.id,
                course: courseId,
                order_index: lesson.order_index
            }));

        if (orderUpdates.length > 0) {
            // First, move all existing lessons to temporary negative indices to avoid conflicts
            const { error: tempUpdateError } = await supabase
                .from('course_lesson')
                .update({ order_index: -1000 })
                .eq('course', courseId);

            if (tempUpdateError) {
                throw new Error(`Failed to prepare lesson order update: ${tempUpdateError.message}`);
            }

            // Then update each lesson's order index one by one to ensure order
            for (const update of orderUpdates) {
                const { error: updateError } = await supabase
                    .from('course_lesson')
                    .update({ order_index: update.order_index })
                    .eq('course', courseId)
                    .eq('lesson', update.lesson);

                if (updateError) {
                    throw new Error(`Failed to update lesson order: ${updateError.message}`);
                }
            }
        }

        return {
            lessons: updatedLessons.map(lesson => ({
                id: lesson.id,
                name: lesson.name ?? '',
                description: lesson.description ?? '',
                rootSkillId: lesson.rootSkillId ?? '',
                orderIndex: lesson.order_index,
            })),
        };
    }
}); 
