import {
  describe,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { giveFeedbackOnSkillTree } from '../feedback/giveFeedbackOnSkillTree';
import {
  fillSubskillTree,
  FillSubskillTreeArgs,
} from './fillSubskillTree';

describe('fillSubskillTree', () => {
    it('should work for Calculus', async () => {
        const ai = createDefaultStubAI();

        const input: FillSubskillTreeArgs = {
            ai,
            skillName: 'Calculus',
            parentSkillNames: [],
            skillsToAdd: [],
            relevantDocuments: [],
        };
       
        const aiResult = await fillSubskillTree(input);

        console.log('ROUND 1', JSON.stringify(aiResult, null, 2));

        if (!aiResult.adjustedRootSkill) {
            throw new Error('No adjusted root skill found!');
        }

        const ratings = await giveFeedbackOnSkillTree({
            ai,
            rootSkill: aiResult.adjustedRootSkill,
        }); 

        console.log('RATINGS BY NODE:', JSON.stringify(ratings, null, 2));
        
        // Optional: Calculate average rating across all nodes
        const averageRating = ratings.reduce((sum, r) => sum + r.rating.feedback.overallRating0To100, 0) / ratings.length;
        console.log('AVERAGE RATING:', averageRating);


        // ROUND 2: Pass in the feedback.


    }, { timeout: 60_000 });
});