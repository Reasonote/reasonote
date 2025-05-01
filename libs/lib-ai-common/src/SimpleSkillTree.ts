import _ from 'lodash';

export type TreeFromSkillsWithScores = {
    skill_id: string;
    skill_name: string;
    path_to: string[];
    path_to_links: string[];
    min_normalized_score_upstream: number;
    max_normalized_score_upstream: number;
    average_normalized_score_upstream: number;
    stddev_normalized_score_upstream: number;
    activity_result_count_upstream: number;
    all_scores: number[];
    num_upstream_skills: number;
    level_on_parent: string;
}[]

export interface FormatSimpleSkillTreeArgs {
    skillsWithScores: TreeFromSkillsWithScores;
    skillId: string;
    visitedSkillIds?: string[];
}

export interface SimpleSkillTreeNode {
    skill_id: string;
    skill_name: string;
    path_to: string[];
    min_normalized_score_upstream: number;
    max_normalized_score_upstream: number;
    average_normalized_score_upstream: number;
    stddev_normalized_score_upstream: number;
    activity_result_count_upstream: number;
    upstream_skills: SimpleSkillTreeNode[];
    level_on_parent: string;
}

export class SimpleSkillTreeFactory  {
    static toAIString(skillTree: SimpleSkillTreeNode, indent: number): string {
        // Create a visual string representation of the tree.
        // - skill_name
        //      [LEVEL: <levelname>]
            //      - upstream_skill_name
            //          [LEVEL: <levelname>]
            //              - upstream_skill_name
            //  [LEVEL: <levelname>]
            //      upstream_skill_name

        const subskillsByLevel = _.groupBy(skillTree.upstream_skills, (subskill) => subskill.level_on_parent);

        const spacer = "--"

        const levelsInOrder = [
            'INTRO',
            'BASIC',
            'INTERMEDIATE',
            'ADVANCED',
            'MASTER',
        ]

        const orderedLevelsOnSkill = _.orderBy(Object.keys(subskillsByLevel), (level) => levelsInOrder.indexOf(level));

        return `${spacer.repeat(indent)}${skillTree.skill_name}\n`
            + _.flatten(orderedLevelsOnSkill.map((skillLevel) => {
                const subskills = subskillsByLevel[skillLevel] ?? [];

                return [
                    `${spacer.repeat(indent + 1)}[${skillLevel} Subskills]\n`,
                    ...subskills.map((subskill) => {
                        // For each subskill, get its string rep.
                        return SimpleSkillTreeFactory.toAIString(subskill, indent + 2);
                    })
                ]
            })).join('');
    }

    static toAiStringNoLevels({skillTree, indent, formatLine}: {skillTree: SimpleSkillTreeNode, indent: number, formatLine?: (n: SimpleSkillTreeNode) => string}): string {
        // Create a visual string representation of the tree.
        // - skill_name
        //      - upstream_skill_name
        //          - upstream_skill_name
        //      - upstream_skill_name
        //          - upstream_skill_name

        const spacer = "--"

        const subskillsByLevel = _.groupBy(skillTree.upstream_skills, (subskill) => subskill.level_on_parent);

        const levelsInOrder = [
            'INTRO',
            'BASIC',
            'INTERMEDIATE',
            'ADVANCED',
            'MASTER',
        ]

        const orderedLevelsOnSkill = _.orderBy(Object.keys(subskillsByLevel), (level) => levelsInOrder.indexOf(level));

        const formatter = formatLine ?? ((n) => `${n.skill_name}`);
        const formatted = formatter(skillTree);

        // We don't output the levels, but we do output the subskills for each level.
        return `${spacer.repeat(indent)}${formatted}\n`
            + _.flatten(orderedLevelsOnSkill.map((skillLevel) => {
                const subskills = subskillsByLevel[skillLevel] ?? [];

                return [
                    ...subskills.map((subskill) => {
                        // For each subskill, get its string rep.
                        return SimpleSkillTreeFactory.toAiStringNoLevels({skillTree: subskill, indent: indent + 1, formatLine});
                    })
                ]
            })).join('');
    }

    static getImmediateChildrenByLevel(skillTree: SimpleSkillTreeNode, level: string): SimpleSkillTreeNode[] {
        return skillTree.upstream_skills.filter((subskill) => subskill.level_on_parent === level);
    }

    static fromSkillsWithScores({skillsWithScores, skillId, visitedSkillIds}: FormatSimpleSkillTreeArgs): SimpleSkillTreeNode {



        // Recurse through the skillsWithScores, and build a tree.
        // Whenever an item has a `path_to` that starts with this skill's path_to, we know it's an upstream skill.
        const thisSkill = skillsWithScores.find((skillWithScores) => skillWithScores.skill_id === skillId);

        if (!thisSkill){
            throw new Error(`No skill with id ${skillId} found in skillsWithScores`)
        }

        const thisPathTo = thisSkill.path_to;
        const thisPathToStr = thisPathTo.join(',');
        
        // TODO: from skills with scores is N^2. Optimize later.
        // For now, we'll make this n^2, and optimize later.
        const immediateUpstreamSkills = skillsWithScores.filter((skillWithScores) => {
            // Stringify both path tos, and check if the upstream skill's path to starts with this skill's path to.
            const upstreamPathTo = skillWithScores.path_to;
            const upstreamPathToStr = upstreamPathTo.join(',');

            // Don't include the skill itself.
            const isSame = upstreamPathToStr === thisPathToStr;

            const startsWith = upstreamPathToStr.startsWith(thisPathToStr);

            const isImmediate = upstreamPathTo.length === thisPathTo.length + 1;
            
            return !isSame && startsWith && isImmediate;
        });


        // If this skill has already been visited, we don't need to do anything.
        // NOTE: this means that skills will only show up at one place in the tree.
        if (visitedSkillIds?.includes(skillId)){
            return {
                skill_id: skillId,
                skill_name: thisSkill.skill_name,
                path_to: thisPathTo,
                min_normalized_score_upstream: thisSkill.min_normalized_score_upstream,
                max_normalized_score_upstream: thisSkill.max_normalized_score_upstream,
                average_normalized_score_upstream: thisSkill.average_normalized_score_upstream,
                stddev_normalized_score_upstream: thisSkill.stddev_normalized_score_upstream,
                activity_result_count_upstream: thisSkill.activity_result_count_upstream,
                // Fake this because we already visited this and we don't want multiple downstream.
                // VERY DIRTY!
                upstream_skills: [],
                level_on_parent: thisSkill.level_on_parent,
            }
        }

        visitedSkillIds = visitedSkillIds ?? [];
        visitedSkillIds.push(skillId);


        const upstreamSkillsTree = immediateUpstreamSkills.map((upstreamSkill) => {
            return SimpleSkillTreeFactory.fromSkillsWithScores({
                skillsWithScores,
                skillId: upstreamSkill.skill_id,
                visitedSkillIds,
            })
        })

        return {
            skill_id: skillId,
            skill_name: thisSkill.skill_name,
            path_to: thisPathTo,
            min_normalized_score_upstream: thisSkill.min_normalized_score_upstream,
            max_normalized_score_upstream: thisSkill.max_normalized_score_upstream,
            average_normalized_score_upstream: thisSkill.average_normalized_score_upstream,
            stddev_normalized_score_upstream: thisSkill.stddev_normalized_score_upstream,
            activity_result_count_upstream: thisSkill.activity_result_count_upstream,
            upstream_skills: upstreamSkillsTree,
            level_on_parent: thisSkill.level_on_parent,
        }
    }
}