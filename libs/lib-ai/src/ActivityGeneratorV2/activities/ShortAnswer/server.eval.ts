import { ShortAnswerActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const SHORT_ANSWER_QUALITY_CRITERIA = [
    'Is the question clear and specific, without leaving room for multiple interpretations?',
    'Is the scope, what kind of answer is expected (e.g. a specific term, a brief explanation, a definition, etc.), defined?',
    'Do we outline if any specific details need to be included in the answer (e.g. key terms, examples, etc.)?',
    'Does the question allow the user room for individual expression and synthesis of ideas?',
    'Is the grading criteria clear, specific and complete?',
    'Does the grading criteria provide an example of good and bad answers?',
];

createActivityEvaluationTests({
    name: 'ShortAnswer',
    server: new ShortAnswerActivityTypeServerV2(),
    qualityCriteria: SHORT_ANSWER_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 