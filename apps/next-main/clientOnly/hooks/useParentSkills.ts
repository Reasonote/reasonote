import {useMemo} from "react";

import {SimpleSkillTreeNode} from "@reasonote/lib-ai-common";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {useSkillSimpleTree} from "./useSkillSimpleTree";

export interface ParentSkill {
  id: string;
  name: string;
}

/**
 * Find the path from root to target skill using BFS
 * This is shared between useParentSkills and useParentSkillIds
 */
export function findAncestorPath(
  rootSkill: SimpleSkillTreeNode, 
  targetSkillId: string
): SimpleSkillTreeNode[] {
  // If the root is the target, return just the root
  if (rootSkill.skill_id === targetSkillId) {
    return [rootSkill];
  }

  // Queue for BFS traversal - each entry contains the node and its path from root
  const queue: {node: SimpleSkillTreeNode, path: SimpleSkillTreeNode[]}[] = [
    {node: rootSkill, path: [rootSkill]}
  ];
  
  // Set to track visited nodes and avoid cycles
  const visited = new Set<string>([rootSkill.skill_id]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    
    for (const childSkill of node.upstream_skills) {
      if (childSkill.skill_id === targetSkillId) {
        // Found the target, return the path including the target
        return [...path, childSkill];
      }
      
      if (!visited.has(childSkill.skill_id)) {
        visited.add(childSkill.skill_id);
        queue.push({
          node: childSkill,
          path: [...path, childSkill]
        });
      }
    }
  }
  
  // If we get here, no path was found
  return [];
}

export function useParentSkills(skillId: string): {
  data: ParentSkill[];
  loading: boolean;
  error: Error | null;
} {
  // 1. Get the skill
  const { data: skillData, loading: skillLoading, error: skillError } = useSkillFlatFragLoader(skillId);

  // 2. Get the tree of its root skill
  const { data: skillTree, loading: skillTreeLoading, error: skillTreeError } = useSkillSimpleTree({
    topicOrId: skillData?.rootSkillId ?? 'FAKE_ROOT_SKILL_ID'
  });
  
  // 3. Find the path from root to the target skill
  const parentSkills = useMemo(() => {
    if (!skillTree || !skillId || skillLoading || skillTreeLoading) {
      return [];
    }
    
    // If the skillId is the same as the root skill, return just the root
    if (skillTree.skill_id === skillId) {
      return [{
        id: skillTree.skill_id,
        name: skillTree.skill_name
      }];
    }
    
    // Find the path from root to the target skill
    const nodePath = findAncestorPath(skillTree, skillId);
    
    // Convert to ParentSkill objects with id and name
    return nodePath.map(node => ({
      id: node.skill_id,
      name: node.skill_name
    }));
  }, [skillTree, skillId, skillLoading, skillTreeLoading]);

  const loading = skillLoading || skillTreeLoading;
  const error = (skillError || skillTreeError) as Error | null;
  
  return {
    data: parentSkills,
    loading,
    error
  };
} 