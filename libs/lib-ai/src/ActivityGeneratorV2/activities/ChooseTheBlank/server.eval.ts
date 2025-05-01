import { ChooseTheBlankActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const CHOOSE_THE_BLANK_QUALITY_CRITERIA = [
    'Is the sentence structure natural, clear, concise, and complete?',
    'Does the surrounding text provide enough context to determine the answers?',
    'Does the surrounding text make the answers obvious?',
    'Does each blank correspond to a key term for this subject?',
    'Are the options clear and distinct?',
    'Is there only one correct answer, without any ambiguity?',
    'Are the distractors plausible?',
    'Are there distractors that will catch common mistakes the user might make?',
    'Do the distractors have similar length and detail as the correct answer?',
];

createActivityEvaluationTests({
    name: 'ChooseTheBlank',
    server: new ChooseTheBlankActivityTypeServerV2(),
    qualityCriteria: CHOOSE_THE_BLANK_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 