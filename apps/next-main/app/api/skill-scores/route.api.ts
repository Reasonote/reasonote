import {z} from "zod";

import {isTypedUuidV4} from "@lukebechtel/lab-ts-utils";
import {createSimpleLogger} from "@reasonote/lib-utils";

import {DAGScoreCollector} from "../../../../../libs/skill-dag/src";
import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {SkillScoresRoute} from "./routeSchema";

const logger = createSimpleLogger("skillScoresApi");

/** Type representing a skill fetched directly from the skill table */
type SkillType = {
  id: string;
  _name: string;
  emoji: string | null;
  root_skill_id: string | null;
};

/** Type representing a skill link fetched directly from the skill_link table */
type SkillLinkType = {
  id: string;
  upstream_skill: string;
  downstream_skill: string;
};

/** Type representing an activity skill association fetched from the activity_skill table */
type ActivitySkillType = {
  id: string;
  activity: string;
  skill: string;
};

/** Type representing a user activity result fetched from the user_activity_result table */
type UserActivityResultType = {
  id: string;
  activity: string;
  _user: string;
  score_normalized: number;
};

// Define return type based on the response schema in routeSchema.ts
type SkillScoreItem = z.infer<typeof SkillScoresRoute.responseSchema>[number];

/**
 * Helper function to calculate average of an array of numbers
 */
function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0.5; // Default value if no scores
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Helper function to calculate standard deviation
 */
function calculateStdDev(scores: number[], average: number): number {
  if (scores.length <= 1) return 0;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

export const {POST} = makeServerApiHandlerV3({
  route: SkillScoresRoute,
  handler: async (ctx) => {
    const {parsedReq, supabase, user} = ctx;
    const {topicOrId} = parsedReq;
    
    if (!user) {
      return [];
    }
    
    const userId = user.rsnUserId;
    
    try {
      const isId = isTypedUuidV4(topicOrId);

      /**
       * Looks up a skill ID by topic name
       * @param {string} topicName - Name of the topic to look up
       * @returns {Promise<string | null>} Skill ID if found, null otherwise
       */
      async function getTopicId(topicName: string) {
        const res = await supabase.from("skill").select("id").eq("_name", topicName).single();
        return res.data?.id ?? null;
      }

      const skillId = isId ? topicOrId : await getTopicId(topicOrId);
      if (!skillId) return [];

      // First, get the skill to determine its root_skill_id
      const skillRes = await supabase.from("skill").select("id, _name, emoji, root_skill_id").eq("id", skillId).single();
      if (skillRes.error) throw skillRes.error;
      
      const skill = skillRes.data;
      const rootSkillId = skill.root_skill_id || skill.id;

      // Get all skills with the same root_skill_id
      const relatedSkillsRes = await supabase.from("skill")
        .select("id, _name, emoji, root_skill_id")
        .eq("root_skill_id", rootSkillId);
      
      if (relatedSkillsRes.error) throw relatedSkillsRes.error;
      
      // Add the root skill itself if not included in the results
      let allSkills: SkillType[] = relatedSkillsRes.data;
      
      // Check if the root skill is included in the results
      const rootSkillIncluded = allSkills.some(s => s.id === rootSkillId);
      
      if (!rootSkillIncluded) {
        const rootSkillRes = await supabase.from("skill")
          .select("id, _name, emoji, root_skill_id")
          .eq("id", rootSkillId)
          .single();
        
        if (rootSkillRes.error) throw rootSkillRes.error;
        allSkills.push(rootSkillRes.data);
      }
      
      // Get all skill links between these skills
      const skillIds = allSkills.map(s => s.id);
      
      // Check for any sample activity skills and user activity results
      // This is to help diagnose any data issues
      const sampleActivitySkillsRes = await supabase.from("activity_skill")
        .select("id, activity, skill")
        .limit(10);
        
      if (sampleActivitySkillsRes.error) throw sampleActivitySkillsRes.error;
      
      logger.log('Sample of all activity-skill associations:', sampleActivitySkillsRes.data);
      
      // Check if there are any activity results for this user at all
      const sampleUserActivityResultsRes = await supabase.from("user_activity_result")
        .select("id, activity, _user, score_normalized")
        .eq("_user", userId)
        .limit(10);
        
      if (sampleUserActivityResultsRes.error) throw sampleUserActivityResultsRes.error;
      
      logger.log('Sample of all user activity results for this user:', sampleUserActivityResultsRes.data);
      
      const skillLinksRes = await supabase.from("skill_link")
        .select("id, upstream_skill, downstream_skill")
        .in("upstream_skill", skillIds)
        .in("downstream_skill", skillIds);
      
      if (skillLinksRes.error) throw skillLinksRes.error;
      
      const skillLinks: SkillLinkType[] = skillLinksRes.data.filter(
        link => link.upstream_skill !== null && link.downstream_skill !== null
      ) as SkillLinkType[];
      
      // Fetch activity skills for all skills
      const activitySkillRes = await supabase.from("activity_skill")
        .select("id, activity, skill")
        .in("skill", skillIds);
        
      if (activitySkillRes.error) throw activitySkillRes.error;
      
      logger.log('Raw activity skills result:', activitySkillRes.data.length);
      
      const activitySkills: ActivitySkillType[] = activitySkillRes.data.filter(
        as => as.activity !== null && as.skill !== null
      ) as ActivitySkillType[];
      
      logger.log('Filtered activity skills:', activitySkills.length);
      
      // Get all activity IDs
      const activityIds = activitySkills.map(as => as.activity);
      logger.log('Unique activity IDs:', new Set(activityIds).size);
      
      // Initialize empty user activity results in case there are no activities
      let userActivityResults: UserActivityResultType[] = [];
      
      // Only fetch user activity results if there are activities
      if (activityIds.length > 0) {
        // Fetch user activity results for these activities and user
        logger.log('Fetching user activity results for user:', userId);
        
        const userActivityResultsRes = await supabase.from("user_activity_result")
          .select("id, activity, _user, score_normalized")
          .in("activity", activityIds)
          .eq("_user", userId);
          
        if (userActivityResultsRes.error) throw userActivityResultsRes.error;
        
        logger.log('Activity IDs:', activityIds.length);
        logger.log('User activity results:', userActivityResultsRes.data.length);
        
        userActivityResults = userActivityResultsRes.data.filter(
          uar => uar.activity !== null && uar._user !== null && uar.score_normalized !== null
        ) as UserActivityResultType[];
        
        logger.log('Filtered user activity results:', userActivityResults.length);
      } else {
        logger.log('No activity IDs found, skipping user activity results fetch');
      }
      
      // Get all activity IDs that have results
      const activitiesWithResults = new Set(userActivityResults.map(uar => uar.activity));
      logger.log('Activities with results:', activitiesWithResults.size);
      
      // Create maps for quick lookups
      const skillMap = new Map<string, SkillType>();
      allSkills.forEach(skill => skillMap.set(skill.id, skill));
      
      // Map of skill ID to activity IDs
      const skillToActivities = new Map<string, string[]>();
      activitySkills.forEach(as => {
        if (!skillToActivities.has(as.skill)) {
          skillToActivities.set(as.skill, []);
        }
        skillToActivities.get(as.skill)!.push(as.activity);
      });
      
      // Map of activity ID to user activity results
      const activityToResults = new Map<string, UserActivityResultType[]>();
      userActivityResults.forEach(uar => {
        if (!activityToResults.has(uar.activity)) {
          activityToResults.set(uar.activity, []);
        }
        activityToResults.get(uar.activity)!.push(uar);
      });
      
      // Log skill to activities mapping
      logger.log('Skills with activities:');
      allSkills.forEach(skill => {
        const activities = skillToActivities.get(skill.id) || [];
        logger.log(`Skill ${skill._name} (${skill.id}) has ${activities.length} activities`);
      });

      //-------------------------------------------------------------
      // PHASE 1: Convert skills data into the DAGScoreCollector format
      //-------------------------------------------------------------
      logger.log('PHASE 1: Converting skills data to DAG format');
      
      const collector = new DAGScoreCollector();
      
      // Map to track activity result IDs used for each skill
      const skillToResultIds = new Map<string, Set<string>>();
      
      // Add nodes for each skill with direct scores
      allSkills.forEach(skill => {
        // Get activities for this skill
        const activities = skillToActivities.get(skill.id) || [];
        const scores: number[] = [];
        const usedResultIds = new Set<string>();
        
        // Collect scores from activities associated with this skill
        activities.forEach(activityId => {
          const results = activityToResults.get(activityId) || [];
          
          results.forEach(result => {
            scores.push(result.score_normalized);
            usedResultIds.add(result.id);
          });
        });
        
        // Add the node to the collector
        collector.addNode({ id: skill.id, scores });
        
        // Store the result IDs used for this skill's direct scores
        skillToResultIds.set(skill.id, usedResultIds);
        
        logger.log(`Added node for ${skill._name} (${skill.id}) with ${scores.length} direct scores`);
      });
      
      // Add edges based on skill links
      // In the DAG, upstream skills are parents of downstream skills
      skillLinks.forEach(link => {
        // In our domain, upstream_skill is the prerequisite/parent of downstream_skill
        collector.addEdge({
          fromId: link.downstream_skill,
          toId: link.upstream_skill,
          direction: 'to_child',
          id: link.id
        });
        logger.log(`Added edge from ${link.upstream_skill} to ${link.downstream_skill} with ID ${link.id}`);
      });
      
      //-------------------------------------------------------------
      // PHASE 2: Run the DAGScoreCollector algorithm
      //-------------------------------------------------------------
      logger.log('PHASE 2: Running DAG score calculation');
      
      // Calculate scores for all nodes in the DAG
      const nodeScores = collector.calculateNodeScores();
      
      logger.log(`Calculated scores for ${nodeScores.size} nodes`);
      
      //-------------------------------------------------------------
      // PHASE 3: Convert results back to the API response format
      //-------------------------------------------------------------
      logger.log('PHASE 3: Converting DAG results to API response format');
      
      // Create a map of path to links for each skill
      // We'll build the paths using the descendants information
      const skillToPaths = new Map<string, { path_to: string[], path_to_links: string[] }>();
      
      // For all skills, initialize with a direct path from the requested skill
      allSkills.forEach(skill => {
        if (skill.id === skillId) {
          // For the requested skill itself, the path is just itself
          skillToPaths.set(skill.id, { path_to: [skill.id], path_to_links: [] });
        } else {
          // For other skills, we'll compute paths later if they're descendants
          skillToPaths.set(skill.id, { path_to: [], path_to_links: [] });
        }
      });
      
      // Check if the requested skill has a node result
      const requestedSkillResult = nodeScores.get(skillId);
      if (requestedSkillResult) {
        // Get all descendants of the requested skill
        const descendants = requestedSkillResult.descendants;
        
        // For each descendant, try to build a path from the requested skill
        for (const descendantId of descendants) {
          if (descendantId === skillId) continue; // Skip the skill itself
          
          // Build a path by searching for edges between nodes
          const path = [skillId];
          const links: string[] = [];
          
          // Simple BFS to find a path
          const visited = new Set<string>([skillId]);
          const queue: string[] = [skillId];
          const parent = new Map<string, string>(); // child -> parent mapping
          
          let found = false;
          
          while (queue.length > 0 && !found) {
            const current = queue.shift()!;
            
            // Get all children of current node
            const nodeResult = nodeScores.get(current);
            if (!nodeResult) continue;
            
            for (const childId of nodeResult.descendants) {
              // Skip itself and already visited nodes
              if (childId === current || visited.has(childId)) continue;
              
              // Check if this is a direct child (has an edge from current to child)
              const edgeId = collector.getEdgeId(current, childId);
              if (!edgeId) continue; // No direct edge
              
              visited.add(childId);
              parent.set(childId, current);
              queue.push(childId);
              
              // If we found the descendant, build the path
              if (childId === descendantId) {
                found = true;
                break;
              }
            }
          }
          
          // If we found a path, reconstruct it
          if (found) {
            let current = descendantId;
            const reversePath = [current];
            
            while (current !== skillId) {
              const parentId = parent.get(current);
              if (!parentId) break;
              
              // Get the link ID between parent and current
              const edgeId = collector.getEdgeId(parentId, current);
              if (edgeId) {
                links.unshift(edgeId);
              }
              
              current = parentId;
              reversePath.unshift(current);
            }
            
            skillToPaths.set(descendantId, { path_to: reversePath, path_to_links: links });
          }
        }
      }
      
      // Transform the data to match the expected return type
      const transformedData: SkillScoreItem[] = [];
      
      for (const skill of allSkills) {
        // Get the node score data from DAG
        const nodeResult = nodeScores.get(skill.id);
        
        if (!nodeResult) {
          logger.warn(`Missing score data for skill ${skill.id}, skipping`);
          continue;
        }
        
        // Get path info
        const { path_to, path_to_links } = skillToPaths.get(skill.id) || { path_to: [], path_to_links: [] };
        
        // Calculate statistics from all_scores
        const allScores = nodeResult.all_scores;
        const average = nodeResult.full_score;
        const min = allScores.length > 0 ? Math.min(...allScores) : 0.5;
        const max = allScores.length > 0 ? Math.max(...allScores) : 0.5;
        const stdDev = calculateStdDev(allScores, average);
        
        // Count unique result IDs (this is an approximation since we don't track result IDs in DAG)
        const activityResultCount = allScores.length; 
        
        transformedData.push({
          skill_id: skill.id,
          skill_name: skill._name,
          path_to: collector.firstParentPath(skill.id),
          min_normalized_score_upstream: min,
          max_normalized_score_upstream: max,
          average_normalized_score_upstream: average,
          stddev_normalized_score_upstream: stdDev,
          activity_result_count_upstream: activityResultCount,
          all_scores: allScores,
          num_upstream_skills: nodeResult.descendants.length - 1,
          // TODO: hack
          level_on_parent: "INTRO",
        });
      }
      
      return transformedData;
    } catch (error) {
      console.error("Error fetching skill scores:", error);
      throw error;
    }
  }
}); 