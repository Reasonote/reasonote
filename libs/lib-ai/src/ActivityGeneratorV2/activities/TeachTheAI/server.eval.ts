import { TeachTheAIActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const TEACH_THE_AI_QUALITY_CRITERIA = [
    'Is the goal of the activity clearly stated to the user?',
    'Is the topic that the user must teach the AI specific, well-defined and focused?',
    'Does the topic chosen lend itself to being taught in a conversational manner?',
    'Does the topic chosen allow for a 5+ minute conversation between the user and the AI?',
];

createActivityEvaluationTests({
    name: 'TeachTheAI',
    server: new TeachTheAIActivityTypeServerV2(),
    qualityCriteria: TEACH_THE_AI_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 