import fs from 'fs';
import path from 'path';
import {
  describe,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { AIExtraContext } from '../../../../utils/AIExtraContext';
import { AIGenSkillTree } from '../AIGenSkillTree';

// Define our test dimensions
const SUBJECTS = [
    'Algebra',
    'Programming',
    'Chemistry',
] as const;

const CONTEXT_CONFIGS = {
    none: [],
    // expertJourney: [
    //     new AIExtraContext({
    //         title: 'ExpertJourney',
    //         description: 'Expert journey for learning this skill',
    //         body: JSON.stringify({
    //             stages: [
    //                 { name: 'Beginner', skills: ['Basic concepts', 'Fundamentals'] },
    //                 { name: 'Intermediate', skills: ['Advanced concepts', 'Problem solving'] },
    //                 { name: 'Expert', skills: ['Complex applications', 'Teaching others'] }
    //             ]
    //         })
    //     })
    // ],
    // relevantDocs: [
    //     new AIExtraContext({
    //         title: 'Documentation',
    //         description: 'Relevant documentation for the skill',
    //         body: 'Example documentation content'
    //     })
    // ],
    // fullContext: [
    //     new AIExtraContext({
    //         title: 'ExpertJourney',
    //         description: 'Expert journey for learning this skill',
    //         body: JSON.stringify({
    //             stages: [
    //                 { name: 'Beginner', skills: ['Basic concepts', 'Fundamentals'] },
    //                 { name: 'Intermediate', skills: ['Advanced concepts', 'Problem solving'] },
    //                 { name: 'Expert', skills: ['Complex applications', 'Teaching others'] }
    //             ]
    //         })
    //     }),
    //     new AIExtraContext({
    //         title: 'Documentation',
    //         description: 'Relevant documentation for the skill',
    //         body: 'Example documentation content'
    //     })
    // ]
} as const;

type Subject = typeof SUBJECTS[number];
type ContextConfigName = keyof typeof CONTEXT_CONFIGS;

interface TestMatrixEntry {
    subject: Subject;
    contextConfig: ContextConfigName;
    extraContext: AIExtraContext[];
    description: string;
}

// Generate the test matrix
function generateTestMatrix(): TestMatrixEntry[] {
    const matrix: TestMatrixEntry[] = [];

    SUBJECTS.forEach(subject => {
        Object.entries(CONTEXT_CONFIGS).forEach(([configName, context]) => {
            matrix.push({
                subject,
                contextConfig: configName as ContextConfigName,
                extraContext: [...context], // Clone the array
                description: `${subject} learning objectives with ${configName} context`
            });
        });
    });

    return matrix;
}

const TEST_MATRIX = generateTestMatrix();

// Optional: Filter the matrix for specific test cases
const FILTER_MATRIX = false; // Set to true to enable filtering
const filteredMatrix = (FILTER_MATRIX ? TEST_MATRIX.filter(entry => 
    // Add your filter conditions here
    entry.subject === 'Programming' && 
    entry.contextConfig === 'none'
) : TEST_MATRIX);

describe('AIGenSkillTree getLearningObjectives Matrix Tests', () => {
    const ai = createDefaultStubAI();

    // Helper function to save output files
    const saveOutput = (entry: TestMatrixEntry, content: string, fname: string) => {
        const dirname = `out-${entry.subject}-${entry.contextConfig}-objectives`;
        const dirpath = path.join(__dirname, 'test_output', dirname);
        const filepath = path.join(dirpath, fname);
        
        fs.mkdirSync(dirpath, { recursive: true });
        fs.writeFileSync(filepath, content);
    };

    // Run tests for each matrix entry
    filteredMatrix.forEach((entry) => {
        describe(`${entry.subject} with ${entry.contextConfig} context`, () => {
            let skillTree: AIGenSkillTree;

            beforeEach(async () => {
                skillTree = AIGenSkillTree.fromSkillTreeNode({
                    ai,
                    skillTree: {
                        name: entry.subject,
                        subskills: null
                    }
                });
            });

            it(`should generate valid learning objectives in single iteration`, async () => {
                const result = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 1
                });

                // Save the learning objectives
                const objectivesContent = JSON.stringify(result.learningObjectives, null, 2);
                saveOutput(entry, objectivesContent, 'objectives-single.json');

                validateLearningObjectives(result.learningObjectives);
            }, { timeout: 60_000 });

            it(`should generate more objectives with multiple iterations`, async () => {
                const singleIterResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 1
                });

                const multiIterResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 2
                });

                // Save both results
                saveOutput(entry, JSON.stringify(singleIterResult.learningObjectives, null, 2), 'objectives-1-iteration.json');
                saveOutput(entry, JSON.stringify(multiIterResult.learningObjectives, null, 2), 'objectives-2-iterations.json');

                // Validate both results
                validateLearningObjectives(singleIterResult.learningObjectives);
                validateLearningObjectives(multiIterResult.learningObjectives);

                // Compare results
                expect(multiIterResult.learningObjectives.length)
                    .toBeGreaterThan(singleIterResult.learningObjectives.length);

                console.log('Single iteration count:', singleIterResult.learningObjectives.length);
                console.log('Multi iteration count:', multiIterResult.learningObjectives.length);
            }, { timeout: 60_000 });

            it(`should generate even more objectives with even more iterations`, async () => {
                const singleIterResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 3
                });

                const multiIterResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 6
                });

                // Save both results
                saveOutput(entry, JSON.stringify(singleIterResult.learningObjectives, null, 2), 'objectives-3-iterations.json');
                saveOutput(entry, JSON.stringify(multiIterResult.learningObjectives, null, 2), 'objectives-6-iterations.json');

                // Validate both results
                validateLearningObjectives(singleIterResult.learningObjectives);
                validateLearningObjectives(multiIterResult.learningObjectives);

                // Compare results
                expect(multiIterResult.learningObjectives.length)
                    .toBeGreaterThan(singleIterResult.learningObjectives.length);

                console.log('Three iteration count:', singleIterResult.learningObjectives.length);
                console.log('Six iteration count:', multiIterResult.learningObjectives.length);
            }, { timeout: 60_000 });

            it(`should generate more objectives with parallel threads`, async () => {
                const singleThreadResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 2,
                    numThreads: 1,
                    temperature: 1
                });

                const multiThreadResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 2,
                    numThreads: 3,
                    temperature: 1
                });

                // Save both results
                saveOutput(entry, JSON.stringify(singleThreadResult.learningObjectives, null, 2), 'objectives-1-thread-2-iter.json');
                saveOutput(entry, JSON.stringify(multiThreadResult.learningObjectives, null, 2), 'objectives-3-thread-2-iter.json');

                // Validate both results
                validateLearningObjectives(singleThreadResult.learningObjectives);
                validateLearningObjectives(multiThreadResult.learningObjectives);

                // Compare results - multi-thread should generate more objectives in the same number of iterations
                expect(multiThreadResult.learningObjectives.length)
                    .toBeGreaterThan(singleThreadResult.learningObjectives.length);

                console.log('Single thread count:', singleThreadResult.learningObjectives.length);
                console.log('Multi thread count:', multiThreadResult.learningObjectives.length);
            }, { timeout: 60_000 });


            it(`should generate even more objectives with even more parallel threads`, async () => {
                const singleThreadResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 2,
                    numThreads: 3,
                    temperature: 1
                });

                const multiThreadResult = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 2,
                    numThreads: 6,
                    temperature: 1
                });

                // Save both results
                saveOutput(entry, JSON.stringify(singleThreadResult.learningObjectives, null, 2), 'objectives-3-thread-2-iter.json');
                saveOutput(entry, JSON.stringify(multiThreadResult.learningObjectives, null, 2), 'objectives-6-thread-2-iter.json');

                // Validate both results
                validateLearningObjectives(singleThreadResult.learningObjectives);
                validateLearningObjectives(multiThreadResult.learningObjectives);

                // Compare results - multi-thread should generate more objectives in the same number of iterations
                expect(multiThreadResult.learningObjectives.length)
                    .toBeGreaterThan(singleThreadResult.learningObjectives.length);

                console.log('Three thread count:', singleThreadResult.learningObjectives.length);
                console.log('Six thread count:', multiThreadResult.learningObjectives.length);
            }, { timeout: 60_000 });

            it(`should respect target number of objectives`, async () => {
                const targetNumber = 20;
                const result = await skillTree.getLearningObjectives({
                    extraContext: entry.extraContext,
                    maxIterations: 10,
                    numThreads: 2,
                    temperature: 1,
                    targetNumberObjectives: targetNumber
                });

                // Save results
                saveOutput(entry, JSON.stringify(result.learningObjectives, null, 2), 'objectives-target-number.json');

                // Validate results
                validateLearningObjectives(result.learningObjectives);

                // Verify we got at least the target number (might be slightly more due to parallel threads)
                expect(result.learningObjectives.length).toBeGreaterThanOrEqual(targetNumber);
                // Shouldn't vastly exceed the target
                expect(result.learningObjectives.length).toBeLessThan(targetNumber * 3);

                console.log('Target number:', targetNumber);
                console.log('Actual count:', result.learningObjectives.length);
            }, { timeout: 120_000 });
        });
    });

    // Helper function for common validations
    function validateLearningObjectives(objectives: string[]) {
        // Basic validation
        expect(objectives).toBeDefined();
        expect(Array.isArray(objectives)).toBe(true);
        expect(objectives.length).toBeGreaterThan(0);

        // Validate each learning objective starts with "Can"
        objectives.forEach(objective => {
            expect(objective.startsWith('Can ')).toBe(true);
        });

        // Validate objectives are unique
        const uniqueObjectives = new Set(objectives);
        expect(uniqueObjectives.size).toBe(objectives.length);
    }
}); 