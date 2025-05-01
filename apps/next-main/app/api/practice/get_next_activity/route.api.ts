import _ from "lodash";
import { NextResponse } from "next/server";

import { notEmpty } from "@lukebechtel/lab-ts-utils";
import {
    GetActivitySetWithActivitiesDocument,
    GetActivitySkillWithResultsDocument,
} from "@reasonote/lib-sdk-apollo-client";

import { makeServerApiHandlerV2 } from "../../helpers/serverApiHandlerV2";
import { PracticeGetNextActivityRoute } from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 90;

export const POST = makeServerApiHandlerV2({
    route: PracticeGetNextActivityRoute,
    handler: async (ctx) => {
        const { req, parsedReq, supabase, ac, rsn, logger, user, ai } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        const { practiceMode, skillIdPath, activityTypes } = parsedReq;

        const lastSkillId = skillIdPath[skillIdPath.length - 1];

        if (!lastSkillId) {
            return NextResponse.json({
                error: 'Invalid skillIdPath! Must have at least one skill.'
            }, { status: 400 });
        }

        // Get all skills in this tree.
        const skillsWithScores = (await supabase.rpc('get_linked_skills_with_scores', { user_id: rsnUserId, input_skill_id: lastSkillId }))?.data;
        if (!skillsWithScores) {
            return NextResponse.json({
                error: 'No skills returned from database!'
            }, { status: 500 });
        }

        if (practiceMode === 'missed') {
            // Get any activitySkills with ids that match, and show whichever has the lowest score.
            const activitySkillsInTree = await ac.query({
                query: GetActivitySkillWithResultsDocument,
                variables: {
                    filter: {
                        skill: {
                            in: skillsWithScores.map(skill => skill.skill_id)
                        }
                    }
                }
            });

            const activityResultsInTree = _.uniq(activitySkillsInTree.data?.activitySkillCollection?.edges?.map(e => e.node)
                .map(n => n.activity?.userActivityResultCollection?.edges?.map(e => e.node))
                .filter(notEmpty)
                .flat()
                .filter((ar) => ar.score) ?? []);

            // First, group all ActivityResults by activityId. 
            const activityResultsByActivityId = _.groupBy(activityResultsInTree, (ar) => ar.activity?.id);

            // Now, create an ordered list of activityIds, sorted by the average score of all ActivityResults for that activity.
            const activitiesByAverageScore = Object.entries(activityResultsByActivityId)
                .map(([activityId, activityResults]) => {
                    const resultCount = activityResults.length;
                    const averageScore = activityResults.reduce((acc, ar) => acc + (ar.score ?? 0), 0) / activityResults.length;
                    return { activityId, averageScore, resultCount, activityResults, type: activityResults[0].activity?.type };
                })
                .sort((a, b) => a.averageScore - b.averageScore);

            // Now, for any activity that appeared in activitySkillsInTree, but not in activityResultsInTree,
            // Add it to activitiesByAverageScore with a score of 0.
            const activitiesWithoutScores = _.difference(
                (activitySkillsInTree.data?.activitySkillCollection?.edges?.map(e => e.node.activity?.id) ?? []),
                Array.from(Object.keys(activityResultsByActivityId))
            ).filter(notEmpty);

            activitiesByAverageScore.push(
                ...activitiesWithoutScores.map(a => {
                    const activitySkill = activitySkillsInTree.data?.activitySkillCollection?.edges?.find(e => e.node.activity?.id === a)?.node;

                    if (!activitySkill) {
                        return null;
                    }

                    return {
                        activityId: a,
                        averageScore: 0,
                        resultCount: 0,
                        activityResults: [],
                        type: activitySkill?.activity?.type
                    }
                }).filter(notEmpty)
            );

            if (activitiesByAverageScore.length === 0) {
                return {
                    activityList: [],
                    warnings: [{
                        code: 'NO_MISSED_ACTIVITIES',
                        message: 'No missed activities found for user.'
                    }]
                }
            }

            // Filter out ignored activities
            const activityListAfterIgnorefilter = activitiesByAverageScore.filter(a => !parsedReq.ignoreActivities.includes(a.activityId))

            // Filter out activities for type
            const activitiesAfterTypeFilter = activityListAfterIgnorefilter.filter(a => activityTypes.includes(a.type ?? ''))

            // Only requested number
            const activityList = activitiesAfterTypeFilter.slice(0, parsedReq.numActivities);

            return {
                activityList: activityList
                    .map(a => ({
                        activityId: a.activityId,
                        type: a.type ?? 'unknown'
                    }))
                    .filter(a => !parsedReq.ignoreActivities.includes(a.activityId))
                    .slice(0, parsedReq.numActivities),
                warnings: [
                    (activityListAfterIgnorefilter.length === 0 ?
                        {
                            code: 'NO_ACTIVITIES_AFTER_IGNORE',
                            message: 'No more activities found for user.'
                        } : null
                    ),
                    (activitiesAfterTypeFilter.length === 0 ?
                        {
                            code: 'NO_ACTIVITIES_AFTER_TYPE_FILTER',
                            message: 'No more activities found for user after type filter.'
                        } : null
                    )
                ].filter(notEmpty)
            }
        }
        else if (practiceMode === 'saved') {

            // Get all the activities this user has saved.
            const activitiesUserHasSavedResult = await ac.query({
                query: GetActivitySetWithActivitiesDocument,
                variables: {
                    filter: {
                        forUser: {
                            eq: rsnUserId,
                        },
                    },
                },
            })

            const activitiesUserHasSaved = activitiesUserHasSavedResult.data?.activitySetCollection?.edges?.map(e => e.node.activitySetActivityCollection?.edges?.map(e => e.node)).filter(notEmpty).flat().map(n => n.activity);

            if (!activitiesUserHasSaved || activitiesUserHasSaved.length === 0) {
                return {
                    activityList: [],
                    warnings: [{
                        code: 'NO_SAVED_ACTIVITIES',
                        message: 'No saved activities found for user.'
                    }]
                }
            }

            // Filter out ignored activities
            const activityListAfterIgnoreFilter = activitiesUserHasSaved.filter(notEmpty).filter(a => !parsedReq.ignoreActivities.includes(a.id));

            // Filter out activities for type
            const activitiesAfterTypeFilter = activityListAfterIgnoreFilter.filter(a => activityTypes.includes(a.type ?? ''));

            // Now check that the skills are linked to the activities
            const skillsLinkedToActivitiesResult = await ac.query({
                query: GetActivitySkillWithResultsDocument,
                variables: {
                    filter: {
                        activity: {
                            in: activitiesAfterTypeFilter.map(a => a.id)
                        },
                        skill: {
                            in: skillsWithScores.map(s => s.skill_id)
                        }
                    }
                }
            })

            const savedActivitiesForTheseSkills = skillsLinkedToActivitiesResult.data?.activitySkillCollection?.edges.map(e => e.node.activity?.id).filter(notEmpty);

            const activitiesToReturn = activitiesAfterTypeFilter.filter(a => savedActivitiesForTheseSkills?.includes(a.id));

            // Now check that the skills are linked to the activities
            return {
                activityList: activitiesToReturn
                    .slice(0, parsedReq.numActivities)
                    .map(a => ({
                        activityId: a.id,
                        type: a.type ?? 'unknown'
                    })),
                warnings: [
                    (activityListAfterIgnoreFilter.length === 0 ?
                        {
                            code: 'NO_ACTIVITIES_AFTER_IGNORE',
                            message: 'No more activities found for user.'
                        } : null
                    ),
                    (activitiesAfterTypeFilter.length === 0 ?
                        {
                            code: 'NO_ACTIVITIES_AFTER_TYPE_FILTER',
                            message: 'No more activities found for user after type filter.'
                        } : null
                    )
                ].filter(notEmpty),
            }
        }
        else {
            return NextResponse.json({
                error: 'Invalid practice mode!'
            }, { status: 400 });
        }
    }
})
