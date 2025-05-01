import {useMemo} from "react";

import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {findAncestorPath} from "./useParentSkills";
import {useSkillSimpleTree} from "./useSkillSimpleTree";

export function useParentSkillIds(skillId: string): {data: string[], loading: boolean, error: Error | null} {
    // 1. Get the skill
    const { data: skillData, loading: skillLoading, error: skillError } = useSkillFlatFragLoader(skillId);

    // 2. Get the tree of its root skill
    const { data: skillTree, loading: skillTreeLoading, error: skillTreeError } = useSkillSimpleTree({
        topicOrId: skillData?.rootSkillId ?? 'FAKE_ROOT_SKILL_ID'
    });

    const parentSkillIds = useMemo(() => {
        if (!skillTree || !skillId || skillLoading || skillTreeLoading) {
            return [];
        }
        
        // If the skillId is the same as the root skill, return just the root
        if (skillTree.skill_id === skillId) {
            return [skillTree.skill_id];
        }
        
        // Use the shared ancestor path finding logic
        const nodePath = findAncestorPath(skillTree, skillId);
        
        // Extract just the skill IDs from the path
        return nodePath.map(node => node.skill_id);
        
    }, [skillTree, skillId, skillLoading, skillTreeLoading]);

    const loading = skillLoading || skillTreeLoading;
    const error = (skillError || skillTreeError) as Error | null;

    return {
        data: parentSkillIds,
        loading,
        error
    };
}