import {
  describe,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { AIGenSkillTree } from '../AIGenSkillTree';

describe('AIGenSkillTree.aiInitializeTree', () => {
    it('should generate a journey map', async () => {
        const ai = createDefaultStubAI();

        const tree = await AIGenSkillTree.fromSkillTreeNode({
            ai,
            skillTree: {
                name: 'Calculus',
                subskills: null,
            },
        });

        const journeyMap = await tree.aiGenerateExpertJourneyMap();

        console.log('journeyMap', JSON.stringify(journeyMap, null, 2));
    }, { timeout: 60_000 });

    it('should generate a problem centered approach', async () => {
        const ai = createDefaultStubAI();

        const tree = await AIGenSkillTree.fromSkillTreeNode({
            ai,
            skillTree: {
                name: 'Calculus',
                subskills: null,
            },
        });

        const problems = await tree.aiGenerateProblemCenteredApproach();

        console.log('problems', problems);
    }, { timeout: 60_000 });

    it('should generate a competency framework', async (t) => {
        const ai = createDefaultStubAI();

        const tree = await AIGenSkillTree.fromSkillTreeNode({
            ai,
            skillTree: {
                name: 'Calculus',
                subskills: null,
            },
        });

        const framework = await tree.aiGenerateCompetencyFramework();

        console.log('framework', framework);
    }, { timeout: 60_000 });
});
