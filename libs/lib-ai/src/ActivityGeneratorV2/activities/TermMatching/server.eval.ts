import { TermMatchingActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const TERM_MATCHING_QUALITY_CRITERIA = [
    'Are the terms and definitions clear?',
    'Is there only one correct match for each term?',
    'Are the terms and definitions important for understanding the subject?',
    'Does each term represent a key concept or fact for this subject?',
    'Are the distractors plausible but incorrect?',
];

createActivityEvaluationTests({
    name: 'TermMatching',
    server: new TermMatchingActivityTypeServerV2(),
    qualityCriteria: TERM_MATCHING_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 