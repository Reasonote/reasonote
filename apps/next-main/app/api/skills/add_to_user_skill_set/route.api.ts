import _ from "lodash";
import {NextResponse} from "next/server";

import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {AddtoUserSkillSetRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: AddtoUserSkillSetRoute,
    handler: async (ctx) => {
        const { req, rsn, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        const resp = await rsn.skill.addSkillsToUserSkillSet({
            addIds: parsedReq.addIds,
            addSkills: parsedReq.addSkills,
            addSkillResources: parsedReq.addSkillResources,
            rsnUserId: rsnUserId,
        })

        if (resp.data) {
            return NextResponse.json(resp.data, { status: 200 });
        }
        else {
            return NextResponse.json({
                error: resp.error
            }, { status: 500 });
        }
    }
})
