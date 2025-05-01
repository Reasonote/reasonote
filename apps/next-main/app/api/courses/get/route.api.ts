import { makeServerApiHandlerV3 } from "../../helpers/serverApiHandlerV3";
import { GetCourseRoute } from "./routeSchema";
import { Resource, Lesson } from "./types";

export const { POST } = makeServerApiHandlerV3({
    route: GetCourseRoute,
    handler: async (ctx) => {
        const { parsedReq, user, supabase } = ctx;

        const { data: coursesData, error } = await supabase
            .rpc('get_courses_for_user', {
                p_principal_id: user?.rsnUserId ?? '',
                p_course_id: parsedReq.courseId ?? undefined
            });

        if (error) {
            console.error('Error fetching courses:', error);
            throw new Error(error.message);
        }

        let resources: Resource[] = [];
        let lessons: Lesson[] = [];
        if (parsedReq.courseId) {
            const { data: resourcesData, error: resourcesError } = await supabase.from('resource')
                .select(`
                    id,
                    child_page_id:rsn_page (
                        id,
                        _name,
                        body,
                        created_date,
                        created_by
                    )
                `)
                .eq('parent_course_id', parsedReq.courseId);

            if (resourcesError) {
                console.error('Error fetching resources:', resourcesError);
                throw new Error(resourcesError.message);
            }
            resources = resourcesData?.map(r => ({
                id: r.id,
                name: r.child_page_id?._name ?? '',
                body: r.child_page_id?.body ?? '',
                createdDate: r.child_page_id?.created_date ?? '',
                createdBy: r.child_page_id?.created_by ?? '',
            })) ?? [];

            const { data: lessonsData, error: lessonsError } = await supabase.from('course_lesson')
                .select('lesson (id, _name, _summary, root_skill, icon), order_index')
                .eq('course', parsedReq.courseId)
                .order('order_index', { ascending: true });

            if (lessonsError) {
                console.error('Error fetching lessons:', lessonsError);
                throw new Error(lessonsError.message);
            }

            lessons = lessonsData?.map(l => ({
                id: l.lesson?.id ?? '',
                name: l.lesson?._name ?? '',
                description: l.lesson?._summary ?? '',
                emoji: l.lesson?.icon ?? '',
                rootSkillId: l.lesson?.root_skill ?? '',
                orderIndex: l.order_index,
            })) ?? [];
        }

        return {
            courses: (coursesData ?? []).map(course => ({
                id: course.course_id,
                name: course.course_name,
                description: course.course_description ?? '',
                rootSkillId: course.course_root_skill ?? '',
                createdDate: course.course_created_date,
                updatedDate: course.course_updated_date,
                coverImageUrl: course.course_cover_image_url ?? '',
                canEdit: course.permissions.includes('course.UPDATE') ?? false,
                lessons: lessons,
                resources: resources
            })),
        };
    }
});