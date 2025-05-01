import _ from 'lodash';
import { z } from 'zod';

import { SkillLevels } from '@reasonote/core';

import { RNAgentTool } from '../RNAgentTool';

export const OutputsUpdateUserSkillSchema = z.object({
    interest_reasons: z.array(z.string()).nullable().describe("The reasons why the user wants to learn this subject."),
    self_assigned_level: z.enum(SkillLevels).nullable().describe(`The user's self-assigned skill level. (VALID LEVELS: ${SkillLevels.join(", ")})`),
    specifics: z.array(z.string()).nullable().describe("Specific subjects or topics within the skill that the user is interested in."),
  })
  export type OutputsUpdateUserSkill = z.infer<typeof OutputsUpdateUserSkillSchema>;


export class UpdateUserSkillTool implements RNAgentTool<any, any, any> {
    name = 'UpdateUserSkill';
    description = 'Update information about the user\'s skill level and understanding. Only use this if you have new information to update.';
    args = OutputsUpdateUserSkillSchema;
    requiresIteration = false;
} 