import {NextResponse} from "next/server";
import {z} from "zod";

import {createLessonFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

import {ApiRouteContextFull} from "../../helpers/ApiRouteContext";
import {
  GetSuggestedLessonsRoute,
  SuggestedLessonSchema,
} from "./routeSchema";

export async function getNormalLessons(ctx:  ApiRouteContextFull<typeof GetSuggestedLessonsRoute>){
    const { req, ac, rsn, parsedReq,  supabase, logger, user, ai } = ctx;

    const rsnUserId = user?.rsnUserId

    if (!rsnUserId) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }

    // Get the skills from the request
    const skillIdPath = parsedReq.skillIdPath;

    const rootSkillId = skillIdPath?.[0];

    const skillsInPath = (await rsn.skill.getSkillsInPath(skillIdPath))?.data;

    if (!skillsInPath) {
        return NextResponse.json({
            error: 'Could not fetch skills in path.'
        }, { status: 404 });
    }
    const aiCtxRes = await rsn.skill.getSkillPathAiContext({names: skillsInPath.map((s) => s._name)});

    if (!aiCtxRes.data) {
        console.error('Could not fetch skill context:', aiCtxRes.error)
        throw new Error(`Could not fetch skill context. ${JSON.stringify(aiCtxRes.error)}`)
    }

    const initSection = `
        # The Primary Skill You Are Teaching:
        ${aiCtxRes.data}

        ${parsedReq.existingLessons && parsedReq.existingLessons.length > 0 ?
        `
        # Existing Lessons
        The following lessons have already been created for this user:
        ${parsedReq.existingLessons.map((l) => `
        ## ${l.title}
        ${l.description}`
        ).join('\n')}
        `
        : ''}        
    ` 

    const defaultOneShotArgs = {
        prompt: `
        # Your Role
        You are responsible for creating a set of ${parsedReq.numLessons} very short auto-generated lessons for a user based on their skill data and activity data.

        ${initSection}

        --------------------------------
        # About the User
        ## The User's Relationship to the Skill
        ${await ai.prompt.skills.formatUserSkillData({
            skillId: rootSkillId,
            rsnUserId: rsnUserId,
            skillIdPath: skillIdPath,
        })}

        --------------------------------

        # Relevant Context
        The following documents help construct relevant context for the skill you are teaching:

        ${await ai.prompt.skills.formatSnips({
            skillId: rootSkillId,
            aiGenerateContext: `
            We are building micro-lessons.
            
            ${initSection}
            `
        })}

        --------------------------------

        # Final Notes
        - Remember to keep the lessons short and to the point.
        - Do not prefix lessons with "Lesson 1", "Lesson 2", etc.
        - You are only making ${parsedReq.numLessons} lessons.
        - Your Description should be 1-2 sentences long, MAX. It should start with "Learn ..."
        `,
        functionName: 'output_lessons',
        functionDescription: 'Output a set of lessons for a user based on their skill data and activity data',
        schema: z.object({
            lessons: z.array(SuggestedLessonSchema.omit({id: true})).describe('The lessons to output'),
        }),
        driverConfig: {
            type: 'openai' as const,
            config: {
                model: 'gpt-4o' as const,
                max_tokens: parsedReq.maxTokensPerLesson * parsedReq.numLessons,
            }
        },
        maxTokens: parsedReq.maxTokensPerLesson * parsedReq.numLessons,
    }


    if (parsedReq.variant === 'short') {
        const lessonOutput = await ai.genObject({
            ...defaultOneShotArgs,
            schema: z.object({
                lessons: z.array(
                    SuggestedLessonSchema.pick({title: true, lessonIconEmoji: true, description: true})
                ).describe('The lessons to output'),
            }),
        })

        if (!lessonOutput.object) {
            return NextResponse.json({
                error: 'No data returned from AI server!'
            }, { status: 500 });
        }

        // Add to backend, in order.
        for (const lesson of lessonOutput.object.lessons) {
            const result = await ac.mutate({
                mutation: createLessonFlatMutDoc,
                variables: {
                    objects: [{
                        name: lesson.title,
                        icon: lesson.lessonIconEmoji,
                        summary: lesson.description,
                        rootSkill: rootSkillId,
                        rootSkillPath: skillIdPath,
                        forUser: rsnUserId,
                    }]
                }
            });

            //@ts-expect-error
            lesson.id = result.data?.insertIntoLessonCollection?.records?.[0].id;
        }

        return {
            lessons: lessonOutput.object?.lessons.map((l, i) => ({
                ...l,
            })) ?? []
        }
    }
    else {
        const lessonOutput = await ai.genObject(defaultOneShotArgs)

        if (!lessonOutput.object) {
            return NextResponse.json({
                error: 'No data returned from AI server!'
            }, { status: 500 });
        }

        // Add to backend, in order.
        for (const lesson of lessonOutput.object.lessons) {
            const result = await ac.mutate({
                mutation: createLessonFlatMutDoc,
                variables: {
                    objects: [{
                        name: lesson.title,
                        icon: lesson.lessonIconEmoji,
                        summary: lesson.description,
                        rootSkill: rootSkillId,
                        rootSkillPath: skillIdPath,
                        forUser: rsnUserId,
                        metadata: JSON.stringify({learningObjectives: lesson.learningObjectives}),

                    }]
                }
            });

            //@ts-expect-error
            lesson.id = result.data?.insertIntoLessonCollection?.records?.[0].id;
        }

        return {
            lessons: lessonOutput.object?.lessons.map((l, i) => ({
                ...l,
            })) ?? []
        }
    }
}