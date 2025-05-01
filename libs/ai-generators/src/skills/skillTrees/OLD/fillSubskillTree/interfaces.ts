import { SkillTreeNode } from '../interfaces';

export interface FillSubskillTreeResult {
    resultType: 'TREE_IS_DONE' | 'ENHANCE_TREE';
    adjustedRootSkill: SkillTreeNode | null;
}