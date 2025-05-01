import _ from "lodash";

import {isNextResponse} from "../../helpers/isNextResponse";
import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ActivityGenerateHandler} from "../generate/handler";
import {ActivityGenerateRoute} from "../generate/routeSchema";
import {ActivityGenerateUniqueRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 120 seconds.
export const maxDuration = 120;

export const { POST } = makeServerApiHandlerV3({
    route: ActivityGenerateUniqueRoute,
    handler: async (ctx) => {
        const { ai, parsedReq } = ctx;

        const { skillName, skillPath, skillId, level, allowedActivityTypes, activityIdsToAvoidSimilarity, slideActivityIdToAnchorOn, domainCtxInjectors } = parsedReq;

        // Get the activity information
        const activity_context = await ai.prompt.activities.formatConfigsByIds(activityIdsToAvoidSimilarity ?? []);
        const slide_anchor_context = await ai.prompt.activities.formatConfigsByIds([slideActivityIdToAnchorOn ?? '']);

        const activity_context_string = `
            ${activityIdsToAvoidSimilarity ? `
                <AVOID_ACTIVITIES>
                    MAKE SURE TO GENERATE ACTIVITIES THAT ARE SUFFICIENTLY DIFFERENT FROM THE FOLLOWING ACTIVITIES THE USER HAS ALREADY SEEN.
                    <ACTIVITIES_TO_AVOID>
                        ${activity_context}
                    </ACTIVITIES_TO_AVOID>
                </AVOID_ACTIVITIES>
            ` : ''}

            <LEVEL>
                The activities should be at the following skill level: ${level}
            </LEVEL>

            ${slideActivityIdToAnchorOn ? `
                <ANCHOR_ACTIVITY>
                    The activities should be anchored on the following slide which provides an overview of this topic:
                    <SLIDE_ANCHOR>
                        ${slide_anchor_context}
                    </SLIDE_ANCHOR>
                </ANCHOR_ACTIVITY>
            ` : ''}
        `;

        console.log('activity_context_string', activity_context_string);
        // generate the activities with the additional context
        const res = await ActivityGenerateHandler({
            ...ctx,
            route: ActivityGenerateRoute,
            parsedReq: {
                from: {
                    skill: {
                        name: skillName,
                        id: skillId,
                        parentIds: skillPath,
                    },
                },
                activityTypes: allowedActivityTypes,
                additionalInstructions: activity_context_string,
                numActivities: 1,
                ctxInjectors: [
                    ...(domainCtxInjectors ? [{
                        name: 'Domain',
                        config: {
                            subjectName: skillName,
                            skillId: skillId,
                            specificity: 'activityGeneration'
                        }
                    }] : []),
                    // ...(parsedReq.ctxInjectors ?? []),
                ]
            },
        });

        if (isNextResponse(res)) {
            return res
        }

        return {
            activities: res.activities
        }
    }
});
