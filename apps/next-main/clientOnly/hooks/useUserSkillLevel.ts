// import _ from "lodash";

// import {useSupabase} from "@/components/supabase/SupabaseProvider";
// import {
//   SkillLevel,
//   SkillLevels,
// } from "@reasonote/core";

// import {useSkillScores} from "./useSkillScores";
// import {
//   useUserSkillSelfAssessmentLevel,
// } from "./useUserSkillSelfAssessmentLevel";

// export function getSkillLevelFromUserHistory({skillId, skillScores, userSelfAssessmentLevel}: {skillId: string, skillScores: NonNullable<ReturnType<typeof useSkillScores>['data']>, userSelfAssessmentLevel: ReturnType<typeof useUserSkillSelfAssessmentLevel>['data']}): SkillLevel | undefined {
//     if (userSelfAssessmentLevel && userSelfAssessmentLevel !== "UNKNOWN"){
//         return SkillLevels.find((level) => level === userSelfAssessmentLevel);
//     }

//     // Get every entry in skillScores which has a direct parent of this skillid.
//     const directChildScores = skillScores?.filter((score) => score.path_to[score.path_to.length - 1] === skillId);

//     // If we don't have any children, we calculate a level based on the direct score.
//     if (!directChildScores || directChildScores.length < 1){
//         const scoreForThisSkill = skillScores?.find((score) => score.skill_id === skillId);

//         if (!scoreForThisSkill){
//             return undefined;
//         }

//         const {average_normalized_score_upstream} = scoreForThisSkill;

//         // Now, the skill level is based on the average_normalized_score_upstream.
//         if (average_normalized_score_upstream >= 0.9){
//             return SkillLevels[5];
//         }
//         else if (average_normalized_score_upstream >= 0.8){
//             return SkillLevels[4];
//         }
//         else if (average_normalized_score_upstream >= 0.7){
//             return SkillLevels[3];
//         }
//         else if (average_normalized_score_upstream >= 0.6){
//             return SkillLevels[2];
//         }
//         else {
//             return SkillLevels[1];
//         }
//     }

//     // Now, group by their level_on_parent
//     const groupedByLevelOnParent = _.groupBy(directChildScores, (score) => score.level_on_parent);

//     // Now, average each group.
//     const statsForEachGroup = _.mapValues(groupedByLevelOnParent, (group) => {
//         const scores = _.flatten(group.map((score) => score.all_scores));

//         return {
//             scores,
//             numScoresForEachSkill: group.map((score) => score.activity_result_count_upstream),
//             mean: _.mean(scores),
//             min: _.min(scores),
//             max: _.max(scores),
//             count: scores.length,
//         }
//     })

//     // Now, walk upwards through levels.
//     // Break when we hit a level that is not "passed":

//     // A level is "passed" if:
//     // 1. The average score for this level is > .9
//     // 2. Every skill has at least 4 scores.
//     var i = 0;
//     for (i = 0; i < 4; i++){
//         const stats = statsForEachGroup[i];

//         if (!stats) {
//             break;
//         }

//         const {mean, count} = stats;

//         if (mean < 0.9 && count < 4){
//             break;
//         }
//     }

//     // Now, we have the level we are at.
//     return SkillLevels[i + 1];
// }


// export function useUserSkillLevel({topicOrId}: {topicOrId: string}): {level: SkillLevel | undefined, isLoading: boolean, error: any} {
//   const {supabase: sb} = useSupabase();

//   const {
//     data: skillScores,
//     loading,
//     error
//   } = useSkillScores({topicOrId});

//   const {data: userSelfAssessmentLevel} = useUserSkillSelfAssessmentLevel({skillId: topicOrId});
  
//   if (userSelfAssessmentLevel){
//     return {
//       level: userSelfAssessmentLevel,
//       isLoading: false,
//       error: null,
//     }
//   }

//   if (!skillScores){
//     return {
//       level: undefined,
//       isLoading: loading,
//       error: error
//     }
//   }

//   const result = getSkillLevelFromUserHistory({skillId: topicOrId, skillScores, userSelfAssessmentLevel});

//   return {
//     level: result,
//     isLoading: loading,
//     error: error
//   }
// }

export default 1;