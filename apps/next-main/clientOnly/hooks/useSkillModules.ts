import {
  useCallback,
  useEffect,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";

import {useEntityCache} from "./useEntityCache";
import {useRsnUserId} from "./useRsnUser";

export interface ModuleNode {
    id: string;
    _name: string;
    children_ids: string[] | null;
    position: number;
    root_skill_id: string | null;
    created_by: string | null;
    created_date: string;
    updated_by: string | null;
    updated_date: string;
    completed?: boolean;
    score?: number;
}

export interface LessonNode {
    id: string;
    _name: string;
    root_skill_id: string | null;
    metadata: {
        [key: string]: any;
        expected_duration_minutes?: number;
    } | null;
    position?: number;
}

export interface SkillModulesData {
    modules: ModuleNode[];
    moduleMap: Map<string, ModuleNode>;
    lessonMap: Map<string, LessonNode>;
}

/**
 * Fetches module and lesson data from Supabase for a given skill
 * @param {string} id - Skill ID to fetch modules for
 * @param {ReturnType<typeof useSupabase>["sb"]} sb - Supabase client instance
 * @returns {Promise<SkillModulesData | null>} Module and lesson data or null if invalid input
 */
async function fetchSkillModules(id: string, sb: ReturnType<typeof useSupabase>["sb"]): Promise<SkillModulesData | null> {
    if (!id) return null;

    // Fetch modules
    const { data: moduleData, error: moduleError } = await sb
        .from('skill_module')
        .select('*')
        .eq('root_skill_id', id)
        .order('position');

    if (moduleError) throw moduleError;

    // Fetch lessons
    const { data: lessonData, error: lessonError } = await sb
        .from('skill')
        .select('*')
        .eq('root_skill_id', id)
        .eq('_type', 'lesson');

    if (lessonError) throw lessonError;

    // Create maps for efficient lookups, preserving the order from children_ids
    const moduleMap = new Map(moduleData.map(module => [module.id, {
        id: module.id,
        _name: module._name,
        children_ids: module.children_ids || [],
        position: module.position,
        root_skill_id: module.root_skill_id,
        created_by: module.created_by,
        created_date: module.created_date,
        updated_by: module.updated_by,
        updated_date: module.updated_date
    } satisfies ModuleNode]));

    // Create a map of lessons with their positions based on children_ids arrays
    const lessonPositions = new Map<string, number>();
    moduleData.forEach(module => {
        if (module.children_ids) {
            module.children_ids.forEach((childId, index) => {
                if (lessonData.some(lesson => lesson.id === childId)) {
                    lessonPositions.set(childId, index);
                }
            });
        }
    });

    const lessonMap = new Map(lessonData.map(lesson => [lesson.id, {
        id: lesson.id,
        _name: lesson._name,
        root_skill_id: lesson.root_skill_id,
        metadata: lesson.metadata as LessonNode['metadata'],
        position: lessonPositions.get(lesson.id)
    } satisfies LessonNode]));

    // Filter and sort top-level modules by position
    const topLevelModules = moduleData
        .filter(module => !moduleData.some(otherModule => 
            otherModule.children_ids && 
            otherModule.children_ids.includes(module.id)
        ))
        .sort((a, b) => a.position - b.position)
        .map(module => ({
            id: module.id,
            _name: module._name,
            children_ids: module.children_ids || [],
            position: module.position,
            root_skill_id: module.root_skill_id,
            created_by: module.created_by,
            created_date: module.created_date,
            updated_by: module.updated_by,
            updated_date: module.updated_date
        } satisfies ModuleNode));

    return {
        modules: topLevelModules,
        moduleMap,
        lessonMap
    };
}

/**
 * Hook to fetch and cache module tree for a given skill ID
 * @param {Object} params - Hook parameters
 * @param {string} params.skillId - Skill ID to fetch modules for
 * @returns {Object} Entity cache result containing:
 *   - data: The module tree data if successful
 *   - error: Any error that occurred during fetch
 *   - loading: Whether the data is currently being fetched
 *   - refetch: Function to manually trigger a refresh of the data
 */
export function useSkillModules({ skillId }: { skillId: string }) {
    const { sb } = useSupabase();
    const userId = useRsnUserId();

    const fetchFn = useCallback(async (id: string) => {
        return fetchSkillModules(id, sb);
    }, [sb]);

    const useEntityCacheResult = useEntityCache<SkillModulesData | null, SkillModulesData | null>({
        queryName: "skillModules",
        id: skillId,
        fetchFn,
        transformFn: ({ rawData }) => rawData,
    });

    useEffect(() => {
        // useEffect if userId changes, and we aren't already refetching, refetch the data
        if (!useEntityCacheResult.loading && !useEntityCacheResult.data && userId) {
          console.debug('useSkillScores: refetching skill scores', userId);
          useEntityCacheResult.refetch();
        }
      }, [userId]);

    return useEntityCacheResult;
} 