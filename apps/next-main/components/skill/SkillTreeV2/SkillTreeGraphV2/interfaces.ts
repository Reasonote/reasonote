import {Node} from "reactflow";

import {SkillTree} from "@reasonote/core/src/interfaces/SkillTree";

export type SkillTreeV2GraphNodeDataShowMore = {
    type: 'showMore';
    remainingCount: number;
    onShowMore: () => void;
    rankDir: 'TB' | 'LR';
}

export interface SkillTreeV2GraphNodeDataSkill {
    type: 'skill';
    id: string;
    rankDir: 'TB' | 'LR';
    score?: number;
    activityCount?: number;
    label?: string;
    hasChildren: boolean;
    isHidden: boolean;
    selectedNodeId?: string | null;
    onCreateLesson?: (skillId: string) => void;
    onPractice?: (skillId: string) => void;
    onPodcast?: (skillId: string) => void;
    onRefetchTree?: () => void;
    onDeepen?: (skillId: string) => void;
    isDeepening?: boolean;
    onAddSubskillByName?: (subskillName: string, parentId: string) => void;
    onToggleCollapse?: (skillId: string) => void;
    rootNode: SkillTree;
    parentIds?: string[];
    selected: boolean;
    isCollapsed: boolean;
    canEdit?: boolean;
    rootSkillId: string;
    onClick: (skillId: string) => void;
    totalChildCount: number;
    editDisabled?: boolean;
    onDelete?: (skillId: string) => void;
}

export type SkillTreeV2GraphNodeData = SkillTreeV2GraphNodeDataSkill | SkillTreeV2GraphNodeDataShowMore;
  
export  interface SkillTreeV2GraphNode extends Node<SkillTreeV2GraphNodeData> {
    parentIds?: string[];
    childIds?: string[];
}  


export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 85;
export const MAX_INITIAL_CHILDREN = 6;
