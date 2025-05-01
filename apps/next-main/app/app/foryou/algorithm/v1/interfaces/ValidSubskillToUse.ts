import {
  GetValidSubskillsV1RouteResponse,
} from "@/app/api/skills/get_valid_subskills_v1/routeSchema";

export interface ValidSubskillToUse {
    subskill: Awaited<GetValidSubskillsV1RouteResponse>['validSubskillsAscendingScore'][number]
    skillId: string,
    pathFromRootSkill: string[]
}