export interface SimplerSkillTree {
    id: string;
    name: string;
    prerequisites: SimplerSkillTree[];
}