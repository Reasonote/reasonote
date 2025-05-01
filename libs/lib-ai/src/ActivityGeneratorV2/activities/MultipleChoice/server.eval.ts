import { MultipleChoiceActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const MULTIPLE_CHOICE_QUALITY_CRITERIA = [
    'Is the question clear and unambiguous?',
    'Are the options clear and distinct?',
    'Is there only one correct answer, without any ambiguity?',
    'Are the distractors plausible?',
    'Are there distractors that will catch common mistakes the user might make?',
    'Do the distractors have similar length and detail as the correct answer?',
];

createActivityEvaluationTests({
    name: 'MultipleChoice',
    server: new MultipleChoiceActivityTypeServerV2(),
    qualityCriteria: MULTIPLE_CHOICE_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
});