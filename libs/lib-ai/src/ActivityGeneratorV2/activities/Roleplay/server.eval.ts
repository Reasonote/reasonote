import { RoleplayActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const ROLEPLAY_QUALITY_CRITERIA = [
    'Is the scenario realistic and engaging?',
    'Does the scenario mirror real-life situations that the user might encounter?',
    'Is the objective clear, specific and aligned with mastery of the subject?',
    'Is the context and setting well-developed and sufficient for meaningful interaction between the characters/roles?',
    'Are the characters/roles well-developed, realistic and relevant to the subject?',
];

createActivityEvaluationTests({
    name: 'Roleplay',
    server: new RoleplayActivityTypeServerV2(),
    qualityCriteria: ROLEPLAY_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 