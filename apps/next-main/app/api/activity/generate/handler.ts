import _ from "lodash";
import {NextResponse} from "next/server";

import {
  getActivityTypeDefinition,
} from "@/components/activity/activity-type-definition/getActivityTypeDefinition";
import {
  getActivityTypeServer,
} from "@/components/activity/activity-type-servers/getActivityTypeServer";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  LearningObjectiveSchema,
  UserFeelingSchema,
} from "@reasonote/core";
import {
  createActivityFlatMutDoc,
  createActivitySkillFlatMutDoc,
  GetLessonFlatDocument,
  GetLessonSessionDeepDocument,
  LessonFlatFragFragment,
  LessonSessionFlatFragFragment,
  updateActivityFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {JSONSafeParse} from "@reasonote/lib-utils";

export const ActivityGenerateHandler = async (ctx) => {
    const { ac, ai, req, parsedReq, supabase, logger, user, rsn } = ctx;

    const warnings: { code: string, text: string }[] = [];

    // If we already have an activityId, we get this data from the db.
    const fillActivityId = parsedReq.fillActivityId;


    const fillActivity = fillActivityId ? (await supabase.from('activity').select('*').eq('id', fillActivityId).single())?.data : undefined;

    const activityTypes = fillActivity ? [fillActivity._type] : parsedReq.activityTypes;

    // TODO: replace this I think
    const activityType = _.sample(activityTypes)

    const actServer = await getActivityTypeServer({
        activityType
    })
    const ActTypeDef = await getActivityTypeDefinition({
        activityType
    })

    if (!actServer) {
        throw new Error(`Activity type server not found for activity type ${activityType}`)
    }

    const skillId = parsedReq.from?.skill?.id;

    var skill = skillId ? await supabase.from('skill')
        .select('*')
        .eq('id', skillId)
        .single()
        : undefined

    const skillName = skill?.data?._name ?? parsedReq.from?.skill?.name ?? undefined;

    const skillExpertQuestions = skill?.data?.metadata?.genData?.expertQuestions ?? [];

    console.log('skillExpertQuestions', skillExpertQuestions);

    var lessonSession: LessonSessionFlatFragFragment & { lesson?: LessonFlatFragFragment | null } | undefined;
    var lesson: LessonFlatFragFragment | null | undefined;

    var lessonObjectives: { id?: string, name: string, description?: string | null }[] = parsedReq.lesson?.learningObjectives ?? [];
    if (parsedReq.lessonSessionId) {
        const lessonSessionResp = await ac.query({
            query: GetLessonSessionDeepDocument,
            variables: {
                filter: {
                    id: {
                        eq: parsedReq.lessonSessionId
                    }
                }
            }
        })

        lessonSession = lessonSessionResp.data?.lessonSessionCollection?.edges?.[0]?.node
        lesson = lessonSession?.lesson;

        if (lesson) {
            lessonObjectives = JSONSafeParse(lesson.metadata).data?.learningObjectives
                ?.map((lo) => {
                    const parsed = LearningObjectiveSchema.safeParse(lo)
                    return parsed.success ? parsed.data : undefined
                })
                ?.filter(notEmpty)

            if (!skill && lesson.rootSkill) {
                skill = await supabase.from('skill').select('*').eq('id', lesson.rootSkill).single() ?? undefined;
            }
        }
    }
    if (parsedReq.lesson?.id && !lesson) {
        lesson = await ac.query({
            query: GetLessonFlatDocument,
            variables: {
                filter: {
                    id: {
                        eq: parsedReq.lesson.id
                    }
                }
            }
        }).then((r) => r.data?.lessonCollection?.edges?.[0]?.node)
    }

    if (!user) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }

    // TODO: should be a FOR USER / FOR USERS passed, not just the current user...
    const rsnUser = (await supabase.from('rsn_user').select('*').eq('id', user?.rsnUserId).single())?.data;
    const rsnUserPrefs = (await supabase.from('user_setting').select('*').eq('rsn_user', user?.rsnUserId).single())?.data;
    const userFeelings = rsnUserPrefs?.feelings ? JSONSafeParse(rsnUserPrefs.feelings)?.data
        ?.map?.(UserFeelingSchema.safeParse)
        ?.map((f) => f.success ? f.data : undefined)
        .filter(notEmpty)
        :
        undefined;

    // If we have parentSkillIds, get the names of all those parents.
    const parentSkillIds = _.uniq(parsedReq.from?.skill?.parentIds ??
        skill?.data?.generated_from_skill_path ??
        [
            lesson?.rootSkill,
            ...(lesson?.rootSkillPath ?? [])
        ] ??
        []
    ).filter(notEmpty)
    const parentSkills = parentSkillIds.length > 0 ? (await supabase.from('skill').select('*').in('id', parentSkillIds))?.data : undefined;
    const parentSkillNames = parentSkills && parentSkillIds ?
        _.sortBy(
            parentSkills,
            (a) => parentSkillIds.indexOf(a.id)
        )
            ?.map((sk) => sk._name)
        : undefined;
    const parentSkillJoined = parentSkillNames?.join(" -> ") ?? undefined;


    const ret = await actServer?.generate(
        {
            from: {
                skill: (skillName ? {
                    id: skillId ?? undefined,
                    name: skillName,
                    parentSkillIds: parentSkillIds as string[],
                    parentSkillContext: parentSkillJoined,
                    expertQuestions: skillExpertQuestions
                } : undefined),
                documents: parsedReq.from?.documents ?? [],
                activityIds: parsedReq.from?.activityIds ?? [],
                activityConfigs: parsedReq.from?.activityConfigs ?? [],
            },
            additionalInstructions: `
                ${parsedReq.additionalInstructions ?? ''}
                -------
                ${fillActivity?.gen_instructions ?? ''}
                `,
            // TODO: should not always be for current user. Argument `forUser` should be used...
            user: rsnUser ? {
                id: rsnUser.id ?? '',
                givenName: rsnUser.given_name ?? '',
                familyName: rsnUser.family_name ?? '',
                aiContext: rsnUserPrefs?.ai_about_me ?? '',
                feelings: userFeelings
            } : undefined,
            // TODO: hack
            lesson: !lesson ? undefined : {
                id: lesson.id,
                basic: {
                    name: lesson.name ?? '',
                    summary: lesson.summary ?? '',
                },
                // TODO: hack
                activities: [],
                // TODO: hack
                rootSkillId: lesson.rootSkill ?? '',
                learningObjectives: lessonObjectives?.map((lo) => ({ ...lo, description: lo.description ?? '', id: lo.id ?? Math.random().toString() })),
            },
            activityTypeSpecificConfig: parsedReq.activityTypeSpecificConfig,
            otherMessages: parsedReq.otherMessages,
            ctxInjectors: parsedReq.ctxInjectors,
        },
        ai
    )

    const rsnUserId = user?.rsnUserId

    if (!rsnUserId) {
        return NextResponse.json({
            error: 'User not found!'
        }, { status: 404 });
    }

    if (ret?.data) {
        // If we were passed fillActivityIds, we don't create any activities -- we simply fill the ones we were given.
        if (fillActivityId) {
            await ac.mutate({
                mutation: updateActivityFlatMutDoc,
                variables: {
                    filter: {
                        id: {
                            eq: fillActivityId
                        }
                    },
                    set: {
                        typeConfig: JSON.stringify(ret.data)
                    },
                    atMost: 1
                }
            })

            return {
                activityIds: [fillActivityId],
                activities: [{
                    id: fillActivityId,
                    activityConfig: ret.data
                }],
                warnings: undefined
            }
        } else {
            const activityCreateResponse = await ac.mutate({
                mutation: createActivityFlatMutDoc,
                variables: {
                    objects: [
                        {
                            name: ActTypeDef?.typeHumanName ?? 'New Activity',
                            source: "ai-generated",
                            generatedForUser: rsnUserId,
                            generatedForSkillPaths: skillId ? JSON.stringify([_.uniq([...(parentSkillIds ?? []), skillId]).filter(notEmpty)]) : undefined,
                            type: activityType,
                            typeConfig: JSON.stringify(ret.data),
                        },
                    ],
                },
            });

            const ids = activityCreateResponse.data?.insertIntoActivityCollection?.records?.map(r => r.id);

            if (!ids || ids.length === 0) {
                throw new Error(`Failed to generate activity! No activity ids returned from db post.`)
            }

            logger.debug(`Generated activity with ids: ${ids.join(', ')}`)

            // Create the lesson-activity linkage
            const lessonId = lesson?.id ?? parsedReq.lesson?.id ?? undefined;
            if (lessonId) {
                const res = await supabase.rpc('lesson_activity_add', {
                    p_lesson_id: lessonId,
                    p_activity_id: ids[0]
                })

                if (!res.data) {
                    warnings.push({
                        code: 'lesson-activity-linkage-failure',
                        text: `Failed to create lesson-activity linkage for lesson ${lessonId} and activities ${ids.join(', ')}`
                    })
                }
            }

            // Create the skill-activity linkage
            if (skillId) {
                const activitySkillResult = await ac.mutate({
                    mutation: createActivitySkillFlatMutDoc,
                    variables: {
                        objects: [
                            ...ids.map((activityId) => ({
                                activity: activityId,
                                skill: skillId,
                                weight: .5
                            })),
                        ]
                    }
                })
            }

            return {
                activityIds: ids,
                activities: activityCreateResponse.data?.insertIntoActivityCollection?.records?.map(r => ({
                    id: r.id,
                    activityConfig: JSONSafeParse(r.typeConfig).data,
                })) ?? [],
                warnings: warnings.length > 0 ? warnings : undefined
            };
        }
    }
    else {
        console.warn(`Failed to generate activity -- no data returned from generator. Error: ${ret?.error}`)

        rsn.posthog?.capture({
            distinctId: rsnUserId,
            event: 'error_activity_generation_failed',
            properties: {
                error: ret?.error
            }
        })

        throw new Error(`Failed to generate activity!`)
    }
}