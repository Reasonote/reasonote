import { SlideActivityTypeServerV2 } from '../../';
import { createActivityEvaluationTests } from '../../eval-helpers';

const SLIDE_QUALITY_CRITERIA = [
    'Is the content well-organized and clear?',
    'Is the slide centered around a single key concept or idea?',
    'Does the slide present the informaton in a logical oder that builds on itself?',
    'Is the slide formatted in a way that is easy to read and understand?',
    'Does the slide use appropriate visuals to support the content?',
];

createActivityEvaluationTests({
    name: 'Slide',
    server: new SlideActivityTypeServerV2(),
    qualityCriteria: SLIDE_QUALITY_CRITERIA,
    minimumScoreThreshold: 5.0
}); 