import _lodash from 'lodash';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { streamGenActivitiesV1 } from '../streamGenActivitiesV1';
import { ActivityGenerateRequestFullyDefined } from '../types';
import { seedLodash } from './test-helpers';

const _ = seedLodash('SEED');

const SUBJECTS_NOT_REQUIRING_DIAGRAMS = [
    'Haiku Poetry Composition Techniques',
    'Ancient Greek Pronunciation Guide',
    'Common English Idioms and Their Meanings',
    'Famous Quotes from Shakespeare\'s Plays',
];

function setupTest(subject: string) {
    const ai = createDefaultStubAI();
    
    const mockReq: ActivityGenerateRequestFullyDefined = {
        subject: {
            skills: [{
                name: subject
            }]
        },
        context: {
            user: {
                // We don't need specific interests for this test
            }
        },
    };

    return { ai, mockReq };
}

async function runTest(subject: string) {
    const { ai, mockReq } = setupTest(subject);
    const generator = streamGenActivitiesV1({ ai, req: mockReq });

    const activities: any[] = [];
    for await (const activity of generator) {
        activities.push(activity);
    }

    // Check if any activity contains a Mermaid diagram
    const hasMermaidDiagram = activities.some(activity => 
        activity.type === 'slide' && 
        activity.markdownContent.includes('```mermaid')
    );

    expect(hasMermaidDiagram).toBe(false);

    // Additional check: Ensure no activity mentions creating a diagram
    const mentionsDiagram = activities.some(activity =>
        activity.type === 'slide' &&
        activity.markdownContent.toLowerCase().includes('diagram')
    );

    expect(mentionsDiagram).toBe(false);
}

describe('streamGenActivitiesV1 -- unnecessary-diagram-prevention', () => {
    const runComplexTests = process.env.RUN_COMPLEX_TESTS === 'true';

    if (runComplexTests) {
        describe.concurrent('Complex test matrix for unnecessary diagrams', () => {
            SUBJECTS_NOT_REQUIRING_DIAGRAMS.forEach((subject) => {
                it(`Should not generate diagrams for ${subject}`, async () => {
                    await runTest(subject);
                }, { timeout: 90_000 });
            });
        });
    } else {
        it("Should not generate diagrams for a subject that doesn't require them (default case)", async () => {
            await runTest('Basic Arithmetic Operations (Addition and Subtraction)');
        }, { timeout: 90_000 });
    }
});