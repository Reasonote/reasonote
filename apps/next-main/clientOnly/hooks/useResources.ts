import assert from "assert";

import {useQuery} from "@apollo/client";
import {GetResourceDeepDocument} from "@reasonote/lib-sdk-apollo-client";

export function useResources(params: { skills?: string[], courseId?: string | null }) {
    assert(params.skills && params.skills.length > 0 || params.courseId, 'Either skills or courseId must be provided');

    const { data, loading, error, refetch, reobserve } = useQuery(GetResourceDeepDocument, {
        variables: {
            filter: {
                //@ts-ignore
                or: [
                    { parentSkillId: { in: params.skills } },
                    { parentCourseId: { eq: params.courseId } }
                ]
            }
        }
    })

    return {
        data,
        loading,
        error,
        refetch,
        reobserve
    }
}