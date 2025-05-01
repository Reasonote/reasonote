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

const SUBJECTS_REQUIRING_DIAGRAMS = [
    'DNA Replication Process',
    'OSI Network Model',
    'Binary Search Tree Operations',
    'RC Circuit Analysis',
    'Carbon Cycle in Ecosystems'
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

    // Check if at least one activity contains a Mermaid diagram
    const hasMermaidDiagram = activities.some(activity => 
        activity.type === 'slide' && 
        activity.markdownContent.includes('```mermaid')
    );

    expect(hasMermaidDiagram).toBe(true);

    // Additional checks can be added here if needed
}

describe('streamGenActivitiesV1 -- diagram-generation', () => {
    const runComplexTests = process.env.RUN_COMPLEX_TESTS === 'true';

    if (runComplexTests) {
        describe.concurrent('Complex test matrix', () => {
            SUBJECTS_REQUIRING_DIAGRAMS.forEach((subject) => {
                it(`Should generate at least one diagram for ${subject}`, async () => {
                    await runTest(subject);
                }, { timeout: 90_000 });
            });
        });
    } else {
        it('Should generate at least one diagram (default case)', async () => {
            await runTest('Molecular Biology');
        }, { timeout: 90_000 });
    }
});