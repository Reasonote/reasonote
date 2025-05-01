import _ from "lodash";
import {NextResponse} from "next/server";

import {
  FillSubskillTreeRoute,
  FillSubskillTreeRouteRequestSchema,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {Database} from "@reasonote/lib-sdk";
import {
  GetActivityResultsDeepDocument,
  GetActivityResultsDeepQuery,
  GetSkillUserSkillDocument,
  OrderByDirection,
  ReasonoteApolloClient,
} from "@reasonote/lib-sdk-apollo-client";
import {SupabaseClient} from "@supabase/supabase-js";

import {isNextResponse} from "../../helpers/isNextResponse";
import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {FillSubskillTreeRouteHandler} from "../fill_subskill_tree/route.api";
import {
  GetSubskillsDirectRouteHandler,
} from "../get_subskills_direct/route.api";
import {GetSubskillsDirectRoute} from "../get_subskills_direct/routeSchema";
import {GetValidSubskillsV1Route} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;


async function getSkillUserSkill(ac: ReasonoteApolloClient, skillId: string){
    return (await ac.query({
        query: GetSkillUserSkillDocument,
        variables: {
            filter: {
                id: {
                    eq: skillId,
                },
            },
        },
        fetchPolicy: 'network-only',
    }))?.data.skillCollection?.edges?.[0]?.node?.userSkillCollection?.edges?.[0]?.node;
}

export const POST = makeServerApiHandlerV2({
    route: GetValidSubskillsV1Route,
    handler: async (ctx) => {
        const { req, ac, parsedReq,  supabase, logger, user } = ctx;

        const rsnUserId = user?.rsnUserId

        if (!rsnUserId) {
            return NextResponse.json({
                error: 'User not found!'
            }, { status: 404 });
        }

        const skill = parsedReq.skill;
        const parentSkillIds = parsedReq.parentSkillIds;

        const res = await GetSubskillsDirectRouteHandler({
            ...ctx,
            route: GetSubskillsDirectRoute,
            parsedReq: {
                skill: parsedReq.skill
            } as any,
        })

        // Get all the subkskills of this skill, along with their scores, and their skill links.
        // The results are ordered by their difficulty.
        var subskillsOrdered = isNextResponse(res) ? [] : res ?? [];
        
        // If we don't yet have enough skills, we should at least *try* to fill them in.
        // TODO: Better algorithm to ensure we have a valid tree...
        // Possibly based on user's current level...
        const MIN_SKILLS_TO_SKIP_FILL = 10;
        if (subskillsOrdered.length < MIN_SKILLS_TO_SKIP_FILL){
            console.log(`Not enough skills (${subskillsOrdered.length} < ${MIN_SKILLS_TO_SKIP_FILL}) -- filling tree...`)
            // TODO: A basic version of this should happen when the skill is created,
            // and then it should successively improve over time.
            const fillResult = await FillSubskillTreeRouteHandler({
                ...ctx,
                route: FillSubskillTreeRoute,
                // Do this so we set defaults correctly.
                parsedReq: FillSubskillTreeRouteRequestSchema.parse({
                    skill: {
                        id: skill.id,
                        parentSkillIds
                    }
                })
            })

            // Try getting the updated tree.
            const res = await GetSubskillsDirectRouteHandler({
                ...ctx,
                route: GetSubskillsDirectRoute,
                parsedReq: {
                    skill: parsedReq.skill
                } as any,
            })
            subskillsOrdered = isNextResponse(res) ? [] : res ?? [];
        }

        /** The score a student needs before we'll say they're "good to go" on this skill. */
        const SKILL_THRESHOLD = 0.9;

        const userSkill = await getSkillUserSkill(ac, skill.id);

        const recentActivityResults = await ac.query({
            query: GetActivityResultsDeepDocument,
            variables: {
                filter: {
                    user: {
                        eq: rsnUserId
                    }
                },
                orderBy: {
                    createdDate: OrderByDirection.DescNullsLast,
                },
                // TODO: Increase this number
                first: 1000,
            },
            fetchPolicy: "network-only"
        });

        function isBadScore(subskill: typeof subskillsOrdered[0]){
            return !subskill.average_normalized_score_upstream || subskill.average_normalized_score_upstream < SKILL_THRESHOLD;
        }

        function skillHasAlreadyBeenQueued(subskill: typeof subskillsOrdered[0]){
            return parsedReq.activitiesAlreadyQueued?.some((activity) => {
                return !!activity?.skillIdStack?.find((skid) => skid === subskill.skill_id)
            })
        }

        function wasShownRecently(subskill: typeof subskillsOrdered[0]){
            return recentActivityResults.data?.userActivityResultCollection?.edges.map((e) => e.node).slice(0,3).some((result) => {
                return result.activity?.activitySkillCollection?.edges?.some((edge) => {
                    return edge.node.skill?.id === subskill.skill_id;
                })
            })
        }

        function isAtOrAboveUserAttestedLevel(subskill: typeof subskillsOrdered[0]){
            if (!userSkill){
                return true;
            }

            const attestedLevel = userSkill?.selfAssignedLevel;

            // If they know their level, we should check if this skill is at or above their level.
            // No skill is invalidated.
            if (attestedLevel && attestedLevel !== "UNKNOWN"){
                // The others map this way:
                // ["beginner", "novice", "adept", "pro", "expert"]
                // ["INTRO", "BASIC", "INTERMEDIATE", "ADVANCED", "MASTER"]

                // Now, find the idx of the skill in the path.
                const idxOfSkill = subskill.path_to.findIndex((skillId) => skillId === skill.id);
                // Now, get the level of *the next skill* in the path.
                const nextSkillLevel = subskill.level_path[idxOfSkill + 1];

                if (nextSkillLevel){
                    const idxOfAttested = ["BEGINNER", "NOVICE", "ADEPT", "PRO", "EXPERT"].indexOf(attestedLevel);
                    const idxOfImmediateChildLevel = ["INTRO", "BASIC", "INTERMEDIATE", "ADVANCED", "MASTER"].indexOf(nextSkillLevel);

                    // We only filter up.
                    // This is because our algorithm will progress naturally 
                    // through a tree given a start point, wherever that is.
                    if (idxOfAttested <= idxOfImmediateChildLevel){
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    if (skill.id !== subskill.skill_id){
                        logger.warn('No next skill level for non-same skill -- this is probably a bug.')
                    }
                }
            }

            return true;
        }

        // First, filter out the skills that don't meet the constraints.
        var validSubskills = subskillsOrdered.filter((subskill, idx) => {
            return isBadScore(subskill) && !skillHasAlreadyBeenQueued(subskill) && !wasShownRecently(subskill) && isAtOrAboveUserAttestedLevel(subskill);
        })

        // If there are no valid subskills, we must relax our constraints to remove the isAtOrAboveUserAttestedLevel constraint.
        if (validSubskills.length === 0){
            validSubskills = subskillsOrdered.filter((subskill) => {
                return isBadScore(subskill) && !skillHasAlreadyBeenQueued(subskill) && !wasShownRecently(subskill);
            })
        }

        // If there are *still* no valid subskills, we should relax the shownRecently constraint.
        if (validSubskills.length === 0){
            validSubskills = subskillsOrdered.filter((subskill) => {
                return isBadScore(subskill) && !skillHasAlreadyBeenQueued(subskill);
            })
        }

        // If there are *still* no valid subskills, we should relax the skillHasAlreadyBeenQueued constraint.
        if (validSubskills.length === 0){
            validSubskills = subskillsOrdered.filter((subskill) => {
                return isBadScore(subskill);
            })
        }

        // If there are *still* no valid subskills, we should relax the isBadScore constraint.
        if (validSubskills.length === 0){
            validSubskills = subskillsOrdered.filter((subskill) => {
                return true;
            })
        }

        const validSubskillObjsResult = await batchGetSkills({
            sb: supabase,
            skillIds: validSubskills.map((subskill) => subskill.skill_id)
        })

        const validSubskillObjs = validSubskillObjsResult ?? [];
        if (!validSubskillObjs){
            throw new Error("No valid subskills -- WEIRD CASE")
        }

        const validSubskillsFinal = validSubskills.map((subskill) => {
            const score = subskill;
            const obj = validSubskillObjs.find((obj) => obj.id === subskill.skill_id);
            
            if (!score || !obj){
                return null
            }

            return {
                ...subskill,
                obj
            }
        }).filter(notEmpty)

        // Sort by the average normalized score upstream.
        const validSubskillsAscendingScore = _.sortBy(validSubskillsFinal, (subskill) => subskill.average_normalized_score_upstream ?? 0)

        return {
            skill,
            validSubskillsAscendingScore,
            subskillsOrdered
        }
    }
})

type SkillLinkDifficulty = "INTRO" | "BASIC" | "INTERMEDIATE" | "ADVANCED" | "MASTER";

type ActivityResultDeepNode = NonNullable<GetActivityResultsDeepQuery['userActivityResultCollection']>['edges'][0]['node'];

async function batchGetSkills({sb, skillIds}: {sb: SupabaseClient<Database>, skillIds: string[]}){
    // Get in batches of 50.
    return _.flatten(await Promise.all(_.chunk(skillIds, 50).map(async (chunk) => {
        return (await sb.from('skill').select('id,_name').in('id', chunk))?.data;
    }))).filter(notEmpty);
}