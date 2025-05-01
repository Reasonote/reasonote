'use client'
import {useCallback} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {z} from "zod";

import {
  GetSuggestedLessonsRoute,
} from "@/app/api/lesson/get_suggested_lessons/routeSchema";
import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useUpdateSearchParams} from "@/clientOnly/hooks/useUpdateSearchParams";
import {NotFoundPage} from "@/components/navigation/NotFound";
import {useApolloClient} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {getUserSkillFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import SkillHomeTabV3 from "./_tabsv3/SkillHomeTabV3";

export const UserSnipIntentSchema = z.object({
    version: z.literal('0.0.0').optional().default('0.0.0'),
    intentCategories: z.array(
        z.union([
            z.literal('learn_this'),
            z.literal('explore_this'),
            z.literal('read_this'),
        ])
    ),
    intentFreeform: z.string().optional().default(''),
})
export interface UserSnipIntent extends z.infer<typeof UserSnipIntentSchema> {}


const REQUIRE_SKILL_ASSESSMENT = false;

export default function SkillIdPage(o: any) {
    const skillId = useRouteParams(o.params, 'skillId');
    const router = useRouter();

    const rsnUserId = useRsnUserId();

    const currentTab = useSearchParams()?.get('tab');

    const updateSearchParams = useUpdateSearchParams();

    const setCurrentTab = useCallback((tab: string | null) => {
        updateSearchParams('tab', tab);
    }, [updateSearchParams]);

    const ac = useApolloClient();

    // If they have not completed self assessment, show the self assessment
    useAsyncEffect(async () => {
        if (REQUIRE_SKILL_ASSESSMENT && skillId) {
            // Run the Apollo query directly
            const userSkillRes = await ac.query({
                query: getUserSkillFlatQueryDoc,
                variables: {
                    filter: {
                        rsnUser: {
                            eq: rsnUserId
                        },
                        skill: {
                            eq: skillId
                        }
                    },
                    first: 1
                },
                fetchPolicy: 'network-only'
            });

            const hasCompletedSelfAssessment = notEmpty(userSkillRes.data?.userSkillCollection?.edges[0]?.node?.selfAssignedLevel);

            if (!hasCompletedSelfAssessment) {
                // Show self assessment
                const res = await GetSuggestedLessonsRoute.call({
                    skillIdPath: [skillId],
                    variant: 'short',
                    maxTokensPerLesson: 200, 
                    forceFirstLesson: true
                });

                const lessonId = res.data?.lessons?.[0]?.id;

                if (lessonId) {
                    router.push(`/app/lessons/${lessonId}/new_session`);
                }
            }
        }
    }, [skillId, rsnUserId])

    if (!skillId) {
        return <NotFoundPage/>
    }


    return <SkillHomeTabV3 skillId={skillId} currentTab={currentTab || null} setCurrentTab={setCurrentTab} />
}