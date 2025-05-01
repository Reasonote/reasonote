import _ from "lodash";
import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {NeedsAssessmentRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const {POST, handler} = makeServerApiHandlerV3({
    route: NeedsAssessmentRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user, ai} = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }


        const skillId = parsedReq.skillId;

        if (!skillId) {
            return NextResponse.json({
                error: 'SkillId not provided!'
            }, { status: 400 });
        }

        const userSkillRes = await supabase.from('user_skill').select('*').eq('skill', skillId).eq('rsn_user', rsnUserId).single();

        const userSkill = userSkillRes.data;

        if (!userSkill) {
            return {
                needsAnyAssessment: true,
                assessmentTypesNeeded: ['self-assessment']
            }
        }
        else {
            const selfAssignedLevel = userSkill.self_assigned_level;
            
            if (!selfAssignedLevel){
                return {
                    needsAnyAssessment: true,
                    assessmentTypesNeeded: ['self-assessment']
                }
            }
            else {
                return {
                    needsAnyAssessment: false,
                    assessmentTypesNeeded: []
                }
            }
        }
    }
});