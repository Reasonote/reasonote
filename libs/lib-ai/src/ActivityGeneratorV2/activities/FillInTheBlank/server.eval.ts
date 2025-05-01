import { FillInTheBlankActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const FILL_IN_THE_BLANK_QUALITY_CRITERIA = [
    'Is the sentence structure natural, clear, concise, and complete?',
    'Does the surrounding text provide enough context to determine the answers?',
    'Does the surrounding text make the answers obvious?',
    'Does each blank correspond to a key term for this subject?',
    'Are the intended answers clear, without ambiguity and with minimal room for multiple interpretations?',
];

createActivityEvaluationTests({
    name: 'FillInTheBlank',
    server: new FillInTheBlankActivityTypeServerV2(),
    qualityCriteria: FILL_IN_THE_BLANK_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 