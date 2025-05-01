import _ from 'lodash';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { AIGenerator } from '@reasonote/lib-ai-common';
import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { streamGenActivitiesV1 } from '../streamGenActivitiesV1';
import {
  collectActivities,
  expectInterestsMentioned,
} from './test-helpers';

const ACTIVITY_TYPES = ['slide', 'multiple-choice', 'flashcard', 'term-matching'];
const SUBJECTS = ['Calculus', 'Physics', 'Psychology', 'Economics', 'Literature', 'Computer Science'];
const INTERESTS = ['Soccer', 'Cooking', 'Photography', 'Gardening', 'Chess'];


function setupTest(subject: string, interests: string[] = [], activityTypes: string[] = ACTIVITY_TYPES) {
    const ai = createDefaultStubAI();
    const activityInstructions = activityTypes.map((type, index) => 
      `The ${['first', 'second', 'third', 'fourth'][index] || `${index + 1}th`} one a ${type}`
    ).join(', ');
  
    const mockReq = {
      specialInstructions: `Please make ${activityTypes.length} activities, gradually introducing the concept of ${subject}. ${activityInstructions}.`,
      subject: {
        skills: [{ name: subject }]
      },
      context: {
        user: {
          feelings: interests.map((interest, index) => ({
            id: (index + 1).toString(),
            feeling: 'likes',
            subject_name: interest,
            subject_type: 'interest'
          }))
        }
      }
    };
    return { ai, mockReq };
}

function runCommonAssertions(ai: AIGenerator, activities: any[], expectedSubject: string, expectedActivityTypes: string[], expectedInterests: any[] = []) {
    expect(activities.length).toBeGreaterThanOrEqual(expectedActivityTypes.length);
    
    expectedActivityTypes.forEach((type, index) => {
      expect(activities[index].type).toBe(type);
    });
 
    expectInterestsMentioned({interests: expectedInterests, activities, ai});
}

describe.concurrent('streamGenActivitiesV1 - basic-variations', () => {
    const runComplexTests = process.env.RUN_COMPLEX_TESTS === 'true';
  
    const testCases = runComplexTests
      ? SUBJECTS.flatMap(subject => 
          INTERESTS.map(interest => ({ subject, interests: [interest], activityTypes: _.sampleSize(ACTIVITY_TYPES, 4) }))
        )
      : [{ subject: 'Calculus', interests: ['Soccer'], activityTypes: _.sampleSize(ACTIVITY_TYPES, 4) }];
  
    testCases.forEach(({ subject, interests, activityTypes }) => {
      it(`generates activities for ${subject} with interest in ${interests.join(', ')}`, async () => {
        const { ai, mockReq } = setupTest(subject, interests, activityTypes);
        const generator = streamGenActivitiesV1({ ai, req: mockReq });
        const activities = await collectActivities(generator);
        runCommonAssertions(ai, activities, subject, activityTypes, interests);
      }, 30000);
    });
  
    if (runComplexTests) {
      it('handles multiple interests', async () => {
        const subject = 'Psychology';
        const interests = _.sampleSize(INTERESTS, 3);
        const activityTypes = _.sampleSize(ACTIVITY_TYPES, 5);
        const { ai, mockReq } = setupTest(subject, interests, activityTypes);
        const generator = streamGenActivitiesV1({ ai, req: mockReq });
        const activities = await collectActivities(generator);
        runCommonAssertions(ai, activities, subject, activityTypes, interests);
      }, 30000);
    }
  });