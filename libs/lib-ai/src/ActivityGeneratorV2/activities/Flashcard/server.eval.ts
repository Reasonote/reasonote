import { FlashcardActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const FLASHCARD_QUALITY_CRITERIA = [
    'Is the front asking for something specific?',
    'Is the back concise enough?',
    'Is the question/ cue clear and unambiguous?',
    'Is the language plain to avoid confusion?',
    'Does the flashcard target one idea or fact?',
    'Does the flashcard make sense on its own without the need for outside context?',
    'Is the answer complete and accurate?',
];

createActivityEvaluationTests({
    name: 'Flashcard',
    server: new FlashcardActivityTypeServerV2(),
    qualityCriteria: FLASHCARD_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
});
