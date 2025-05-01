/**
 * Represents a row of data returned from the useSkillTree hook
 * Contains information about a single skill and its relationships
 */
type UseSkillTreeReturnTypeRow = {
    /** Unique identifier for the skill */
    skill_id: string;
    /** Display name of the skill */
    skill_name: string;
    /** Emoji icon representing the skill */
    skill_emoji?: string | null;
    /** Array of connections to other skills, each with its own ID and target skill */
    skill_links?: {id: string, to: string}[] | null;
    /** Array of IDs representing user's activity results related to this skill */
    user_activity_result_ids?: string[] | null;
}

/**
 * Represents a node (skill) in the skill tree structure
 * Contains basic information about a single skill
 */
export interface SkillTreeNode {
    /** Unique identifier for the skill */
    id: string;
    /** Display name of the skill (optional) */
    name?: string;
    /** Emoji icon representing the skill (optional) */
    emoji?: string | null;
    /** Detailed description of the skill (optional) */
    description?: string;
    /** Additional custom data associated with the skill (optional) */
    metadata?: Record<string, any>;
    /**
     * The user's score for this skill, from 0 to 100
     * Represents direct proficiency in this specific skill
     */
    directScore?: number;

    /**
     * The user's score for this skill, from 0 to 100
     * Represents the user's proficiency in this skill, taking into account all related skills.
     */
    calculatedScore?: number;
}

/**
 * Represents a connection between two skills in the skill tree
 * Defines the relationship and direction between skills
 */
export interface SkillTreeEdge {
    /** Unique identifier for the connection (optional) */
    id?: string;
    /** ID of the source skill where the connection starts (optional) */
    from?: string;
    /** ID of the target skill where the connection ends (optional) */
    to?: string;
    /** Additional custom data associated with the connection (optional) */
    metadata?: Record<string, any>;
}

/**
 * Main class representing a complete skill tree structure
 * Contains collections of skills (nodes) and their connections (edges)
 */
export class SkillTree {
    /**
     * Creates a new SkillTree instance
     * @param skills Array of SkillTreeNode objects representing individual skills
     * @param edges Array of SkillTreeEdge objects representing connections between skills
     */
    constructor(
        public readonly skills: SkillTreeNode[],
        public readonly edges: SkillTreeEdge[],
    ) {}

    /**
     * Factory method to create a SkillTree instance from raw data
     * Transforms data from the useSkillTree hook format into a proper SkillTree structure
     * 
     * @param data Array of UseSkillTreeReturnTypeRow objects containing raw skill data
     * @returns A new SkillTree instance with properly structured skills and edges
     */
    static fromUseSkillTreeReturnType(data: UseSkillTreeReturnTypeRow[]) {
        const {skills, edges} = data.reduce<{skills: SkillTreeNode[], edges: SkillTreeEdge[]}>((acc, d) => {
            // Create edge objects for each skill link
            const theseEdges = d.skill_links?.map(l => ({
                id: l.id,
                from: d.skill_id,
                to: l.to,
            })) ?? [];

            acc.edges.push(...theseEdges);

            acc.skills.push({
                id: d.skill_id,
                name: d.skill_name,
                emoji: d.skill_emoji,
            });

            return acc;
        }, {skills: [], edges: []});
        
        return new SkillTree(skills, edges);
    }
}
