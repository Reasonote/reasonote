import {NextResponse} from "next/server";
import {z} from "zod";

import {openai} from "@ai-sdk/openai";
import {
  notEmpty,
  trimAllLines,
} from "@lukebechtel/lab-ts-utils";
import {genObject} from "@reasonote/lib-ai";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {getSkillContext} from "../_utils/getLessonContext";
import {SuggestedLessonSchema} from "../get_suggested_lessons/routeSchema";
import {LessonEnhanceRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: LessonEnhanceRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, ac, ai, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        // Get the skills from the request
        // TODO actually load in all the context too...
        const skillId = parsedReq.skillIdPath[parsedReq.skillIdPath.length - 1];

        // Let's get the activities this user has completed under each skill,
        // and how they're doing on them. For now, let's just get the first skill...
        // const skillId = skillIds[0];
        const {
            skillRes,
            snipRes,
            skillResourceSnipIds,
            snipsFromResources
        } = await getSkillContext(supabase, skillId);

        // TODO: CAll the AI to produce a few lessons that make sense.
        // This should be doable in a single call, but we need to collect all the requisite data.
        // 
        // What Does it need to know?
        // - The skill data (What resources does this skill have? etc)
        // - The User Skill Data (How is the User doing on this skill?)
        // - User Activity Data (What activities has the user done on this skill?)
        const OutputSchema = z.object({
            updatedLessons: z.array(
                SuggestedLessonSchema.pick({
                    // Always output title, it's how we know what to match this to.
                    title: true,
                    // Output the fields that were requested to be enhanced.
                    ...Object.fromEntries(parsedReq.fieldsToEnhance.map((f) => [f, true]))
                })
            ).describe('The updated lessons'),
        });

        const availableModels = ['gpt-4o' as const] as const;
        
        const lessonsFormatted = await ai.prompt.lessons.formatMany({
            lessonIds: parsedReq.lessons.map(l => l.id).filter(notEmpty)
        })

        var lessonOutput: Awaited<ReturnType<typeof genObject<z.infer<typeof OutputSchema>>>> | null = null;
        for (const modelIdx in availableModels) {
            const model = availableModels[modelIdx];
            try {
                const LessonSection = `
                # All of The Lessons So Far:
                ${lessonsFormatted?.map((l) => l).join('\n') ?? ''}
                `

                lessonOutput = await ai.genObject({
                    prompt: trimAllLines(`
                    # Your Role
                    You have been tasked with improving a number of micro-learning lessons based on a user's skill.


                    # The Primary Skill You Are Teaching:
                    ${skillRes?._name}

                   
                    # The Lessons So Far:
                    ${lessonsFormatted?.map((l) => l).join('\n') ?? ''}
                    
                    ------------------------------
                    
                    ${await ai.prompt.skills.formatSnips({
                        skillId,
                        aiGenerateContext: `
                        We are building micro-lessons on the subject of: "${skillRes?._name}".
                    
                        We're trying to enhance the following lessons:
                        
                        ${LessonSection}
                        `
                    })}

                    `),
                    functionName: 'update_lessons',
                    functionDescription: 'Output updated lessons',
                    schema: OutputSchema,
                    model: openai('gpt-4o-mini'),
                })
                break;
            } catch (e) {
                console.error(e)
            }
        }
        const lessonOutputComplete = lessonOutput;

        if (!lessonOutputComplete) {
            return NextResponse.json({
                error: `No data returned from AI!`
            }, { status: 500 });
        }
        

        // TODO pair the results together with the lessons provided.
        // We should update the lessons in the database.
        const lessonsAndUpdates = parsedReq.lessons.map((l) => {
            const updatedLesson = lessonOutputComplete.object?.updatedLessons.find((ul) => ul.title === l.title);
            if (!updatedLesson) {
                return l;
            }

            return {
                ...l,
                ...updatedLesson
            }
        })

        const resps = await Promise.all(lessonsAndUpdates.map(async (l) => {
            if (!l.id) {
                return;
            }
            
            return await supabase.from('lesson').update({
                _summary: l.description,
                metadata: {learningObjectives: l.learningObjectives},
            }).eq('id', l.id);
        }));


        if (!lessonOutputComplete.object){
            return NextResponse.json({
                error: `No data returned from AI! (Warnings: ${lessonOutputComplete.warnings})`
            }, { status: 500 });
        }

        return {
            lessons: lessonOutputComplete.object.updatedLessons
        }
    }
})
