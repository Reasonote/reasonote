import {NextResponse} from "next/server";
import {z} from "zod";

import {latexFixer} from "@/components/activity/utils/latexFixer";
import {SlideActivityConfigSchema} from "@reasonote/activity-definitions";
import {ActivityTypesGradedSchema} from "@reasonote/core";
import {ApiRoute} from "@reasonote/lib-api-sdk";
import {
  Database,
} from "@reasonote/lib-sdk/src/services/supabase/supabase-rest/codegen/supabase-rest-codegen";
import {JSONSafeParse} from "@reasonote/lib-utils";
import {GetResult} from "@supabase/postgrest-js/src/select-query-parser";

import {ApiRouteContextFull} from "../../helpers/ApiRouteContext";

export interface LessonData {
  slides?: any[];
  practice?: {
    activities: any[];
  };
  review?: {
    description: string;
  };
}


type ResultSimple<TTableName extends keyof Database['public']['Tables'], Query extends string> = GetResult<
  Database['public'], 
  Database['public']['Tables'][TTableName]['Row'], 
  unknown, 
  unknown,
  Query
>

export type LessonResultEntry = ResultSimple<'lesson', 'lesson(*, lesson_activity(*, activity(*)))'>['lesson'][number];

export async function getLessonData(
  ctx: ApiRouteContextFull<ApiRoute<any, any>>,
  lessonId: string
): Promise<{lesson: LessonResultEntry; existingContent: LessonData | null}> {
  const {supabase} = ctx;

  const {data: lesson} = await supabase
    .from('lesson')
    .select('* , lesson_activity(*, activity(*))')
    .eq('id', lessonId)
    .single();

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  const slides = lesson.lesson_activity.filter((la) => la.activity?._type === 'slide');
  const activities = lesson.lesson_activity.filter((la) => la.activity?._type !== 'slide');

  // Check for existing content
  const existingSlides = JSONSafeParse(slides)?.data;
  const existingActivities = JSONSafeParse(activities)?.data;
  
  if (existingSlides && existingActivities) {
    return {
      lesson,
      existingContent: {
        slides: existingSlides,
        practice: {
          activities: existingActivities
        },
        review: {
          description: 'This is a review of the lesson.'
        }
      }
    };
  }

  return {lesson, existingContent: null};
}

export async function saveLessonSlideOverviews(
  ctx: ApiRouteContextFull<ApiRoute<any, any>>,
  lessonId: string,
  slides: {
    title: string;
    content: string;
    titleEmoji: string;
  }[]
) {
  const {supabase, ai} = ctx;

  // Process all slides
  const latexFixResults = await Promise.all(
    slides.map(s => latexFixer({stringsToFix: [s.title, s.content]}, ai))
  );
  
  const processedSlides = slides.map((s, i) => ({
    ...s,
    title: latexFixResults[i]?.fixedLatexStrings?.[0] ?? s.title,
    content: latexFixResults[i]?.fixedLatexStrings?.[1] ?? s.content,
  }));

  const {data: lesson} = await supabase.from('lesson').select('root_skill').eq('id', lessonId).single();

  // Create activities first
  const activitiesRes = await supabase.from('activity').insert(processedSlides.map(s => ({
    _name: s.title,
    _type: 'slide',
    type_config: SlideActivityConfigSchema.parse({
      titleEmoji: s.titleEmoji,
      title: s.title,
      markdownContent: s.content,
    }),
    generated_for_skill_paths: lesson?.root_skill ? [[lesson.root_skill]] : null,
  }))).select('id');

  if (activitiesRes.error) {
    console.error(activitiesRes.error);
    throw new Error("Failed to create activities");
  }

  const activities = activitiesRes.data;

  if (!activities) {
    console.error('no activities');
    throw new Error("Failed to create activities");
  }

  // Add activities to lesson using RPC calls
  const lessonActivities = await Promise.all(
    activities.map(async (activity) => {
      const result = await supabase.rpc('lesson_activity_add', {
        p_lesson_id: lessonId,
        p_activity_id: activity.id,
        p_metadata: null,
      });

      if (result.error) {
        throw new Error(`Failed to add lesson activity: ${result.error.message}`);
      }

      return result.data;
    })
  );

  return {
    activities,
    lessonActivities,
  }
}

export async function saveLessonActivities(
  ctx: ApiRouteContextFull<ApiRoute<any, any>>,
  lessonId: string,
  inputActivities: {type: z.infer<typeof ActivityTypesGradedSchema>, [key: string]: any}[]
) {
  const {supabase} = ctx;

  const {data: lesson} = await supabase.from('lesson').select('root_skill').eq('id', lessonId).single();

  // Create activities first
  const actResp = await supabase.from('activity').insert(inputActivities.map(act => ({
    _name: act.type,
    _type: act.type,
    gen_instructions: JSON.stringify(act),
    generated_for_skill_paths: lesson?.root_skill ? [[lesson.root_skill]] : null,
  }))).select('id');

  if (actResp.error) {
    throw new Error("Failed to create activities");
  }

  const activities = actResp.data;

  if (!activities) {
    throw new Error("Failed to create activities");
  }

  // Add activities to lesson using RPC calls
  const lessonActivities = await Promise.all(
    activities.map(async (activity) => {
      const result = await supabase.rpc('lesson_activity_add', {
        p_lesson_id: lessonId,
        p_activity_id: activity.id,
        p_metadata: null,
      });

      if (result.error) {
        throw new Error(`Failed to add lesson activity: ${result.error.message}`);
      }

      return result.data;
    })
  );

  return {
    activities,
    lessonActivities,
  }
}

export async function getSkillContext(
  ctx: ApiRouteContextFull<ApiRoute<any, any>>,
  skillIdPath: string[] | undefined,
  rootSkill: string
) {
  const {rsn} = ctx;
  const effectiveSkillPath = (skillIdPath ?? [rootSkill]).filter(Boolean);
  return await rsn.skill.getSkillPathAiContext({ids: effectiveSkillPath});
}

export function handleUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function handleLessonNotFound() {
  return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
} 