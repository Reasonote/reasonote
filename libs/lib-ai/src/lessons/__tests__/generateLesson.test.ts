import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '../../DefaultStubAI';
import {
  LearningObjectiveWithPrerequisites,
  LessonGroupWithPrerequisites,
} from '../../DocumentToDag/DocumentToDag';
import { generateLessonParts } from '../generateLesson';

describe('generateLessonParts', () => {
    const ai = createDefaultStubAI();
    
    const createObjective = (name: string, referenceSentences: string[] = []): LearningObjectiveWithPrerequisites => ({
        learningObjective: name,
        referenceSentences: referenceSentences.map(sentence => ({
            sentence,
            isExactMatch: true,
            sourceChunkId: 'test-chunk',
            sourceDocumentId: 'test-doc'
        })),
        prerequisites: [],
        chunkIds: ['test-chunk'],
        ids: ['test-id'],
        allSubObjectives: []
    });

    const createLessonInfo = (
        name: string,
        duration: number,
        objectives: LearningObjectiveWithPrerequisites[]
    ): LessonGroupWithPrerequisites => ({
        lessonName: name,
        expectedDurationMinutes: duration,
        cluster: objectives,
        chunkIds: objectives.flatMap(o => o.chunkIds),
        prerequisites: []
    });

    it.concurrent('should generate a valid lesson structure with single learning objective', { timeout: 15000 }, async () => {
        const objective = createObjective(
            'Define musical scales and their structure',
            ['A musical scale is a sequence of notes arranged in ascending or descending order according to specific intervals']
        );

        const lessonInfo = createLessonInfo('Introduction to Musical Scales', 30, [objective]);

        const result = await generateLessonParts(ai, lessonInfo);

        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('partOutlines');
        expect(result.partOutlines).toBeInstanceOf(Array);
        expect(result.partOutlines.length).toBeGreaterThan(0);

        const part = result.partOutlines[0];
        expect(part.learningObjectives).toContain(objective.learningObjective);
        expect(part.keyPoints).toBeInstanceOf(Array);
        expect(part.examples).toBeInstanceOf(Array);
        expect(part.expertQuestions).toBeInstanceOf(Array);
    });

    it.concurrent('should properly scaffold multiple learning objectives', { timeout: 15000 }, async () => {
        const objectives = [
            createObjective('Define musical notation basics', ['Musical notation uses symbols on a staff to represent pitch and duration']),
            createObjective('Read rhythm patterns', ['Rhythm patterns combine different note durations to create musical time']),
            createObjective('Apply time signatures', ['Time signatures indicate how many beats are in each measure'])
        ];

        const lessonInfo = createLessonInfo('Music Notation Fundamentals', 45, objectives);

        const result = await generateLessonParts(ai, lessonInfo);

        // Each learning objective should appear exactly once across all parts
        const allObjectives = result.partOutlines.flatMap(part => part.learningObjectives);
        objectives.forEach(obj => {
            expect(allObjectives.filter(o => o === obj.learningObjective).length).toBe(1);
        });

        // Parts should be in a logical order (basic -> advanced)
        const partOrder = result.partOutlines.map(part => part.learningObjectives[0]);
        expect(partOrder.indexOf('Define musical notation basics'))
            .toBeLessThan(partOrder.indexOf('Read rhythm patterns'));
    });

    it.concurrent('should handle empty or minimal input appropriately', { timeout: 15000 }, async () => {
        const lessonInfo = createLessonInfo('Empty Lesson', 30, []);

        await expect(generateLessonParts(ai, lessonInfo))
            .rejects
            .toThrow();
    });

    it.concurrent('should generate appropriate expert questions', { timeout: 15000 }, async () => {
        const objective = createObjective(
            'Master supply and demand equilibrium',
            [
                'Market equilibrium occurs when supply equals demand at a specific price point',
                'Changes in supply or demand factors cause shifts in the equilibrium price and quantity'
            ]
        );

        const lessonInfo = createLessonInfo('Market Equilibrium', 30, [objective]);

        const result = await generateLessonParts(ai, lessonInfo);

        const expertQuestions = result.partOutlines[0].expertQuestions;

        // Expert questions should be challenging and test understanding
        expertQuestions.forEach(question => {
            // Questions should not be simple recall
            expect(question.toLowerCase()).not.toContain('what is market equilibrium');
            // Questions should test deeper understanding
            expect(question).toMatch(/why|how|explain|analyze|compare|evaluate|justify|prove/i);
        });
    });

    it.concurrent('should respect time constraints in part generation', { timeout: 15000 }, async () => {
        const objectives = Array(10).fill(null).map((_, i) => {
            const topics = [
                'Define phonemes and their role in language',
                'Analyze morphological structures',
                'Explain syntax patterns',
                'Compare different writing systems',
                'Evaluate dialectal variations',
                'Describe semantic relationships',
                'Analyze pragmatic context',
                'Identify phonological rules',
                'Compare grammatical structures',
                'Explain language acquisition stages'
            ];
            return createObjective(topics[i], [`Reference sentence for ${topics[i]}`]);
        });

        const lessonInfo = createLessonInfo('Introduction to Linguistics', 90, objectives);

        const result = await generateLessonParts(ai, lessonInfo);

        // Should split into multiple parts to manage cognitive load
        expect(result.partOutlines.length).toBeGreaterThan(1);

        // Each part should have a reasonable number of objectives
        result.partOutlines.forEach(part => {
            expect(part.learningObjectives.length).toBeLessThanOrEqual(5);
        });
    });

    it.concurrent('should handle duplicate reference sentences', { timeout: 15000 }, async () => {
        const sharedReference = 'Language acquisition follows predictable developmental stages';
        const objectives = [
            createObjective('Analyze first language acquisition', [sharedReference]),
            createObjective('Compare second language learning', [sharedReference])
        ];

        const lessonInfo = createLessonInfo('Language Development', 30, objectives);

        const result = await generateLessonParts(ai, lessonInfo);

        // Should still generate unique content for each objective
        const allExamples = result.partOutlines.flatMap(part => part.examples);
        const uniqueExamples = new Set(allExamples);
        expect(uniqueExamples.size).toBe(allExamples.length);
    });

    it.concurrent('should group closely related objectives into the same part', { timeout: 30000 }, async () => {
        const lessonInfo: LessonGroupWithPrerequisites = {
            lessonName: "Renaissance Art History",
            expectedDurationMinutes: 45,
            cluster: [
                {
                    learningObjective: "Define perspective in Renaissance art",
                    referenceSentences: [{
                        sentence: "Linear perspective was a revolutionary technique that created the illusion of depth on a flat surface.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk1',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk1'],
                    ids: ['1'],
                    allSubObjectives: []
                },
                {
                    learningObjective: "Explain techniques of linear perspective",
                    referenceSentences: [{
                        sentence: "Artists used vanishing points and horizon lines to create realistic spatial relationships.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk1',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk1'],
                    ids: ['2'],
                    allSubObjectives: []
                },
                {
                    learningObjective: "Analyze Renaissance color theory",
                    referenceSentences: [{
                        sentence: "Renaissance artists developed sophisticated color harmonies and contrasts.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk2',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk2'],
                    ids: ['3'],
                    allSubObjectives: []
                }
            ],
            chunkIds: ['chunk1', 'chunk2'],
            prerequisites: []
        };

        const result = await generateLessonParts(ai, lessonInfo);

        // Find the part containing perspective objectives
        const perspectivePart = result.partOutlines.find(part =>
            part.learningObjectives.some(obj => obj.includes("perspective"))
        );

        // Verify that closely related perspective objectives are in the same part
        expect(perspectivePart?.learningObjectives).toContain("Define perspective in Renaissance art");
        expect(perspectivePart?.learningObjectives).toContain("Explain techniques of linear perspective");

        // Verify that color theory is in a different part due to different concept
        const colorPart = result.partOutlines.find(part =>
            part.learningObjectives.some(obj => obj.includes("color"))
        );
        expect(colorPart).not.toBe(perspectivePart);
    });

    it.concurrent('should handle cognitive load appropriately for complex topics', { timeout: 30000 }, async () => {
        const lessonInfo: LessonGroupWithPrerequisites = {
            lessonName: "Art Composition Principles",
            expectedDurationMinutes: 60,
            cluster: [
                {
                    learningObjective: "Define compositional balance",
                    referenceSentences: [{
                        sentence: "Compositional balance is the distribution of visual weight in an artwork.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk1',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk1'],
                    ids: ['1'],
                    allSubObjectives: []
                },
                {
                    learningObjective: "Explain symmetrical and asymmetrical balance",
                    referenceSentences: [{
                        sentence: "Balance can be achieved through symmetrical or asymmetrical arrangements of elements.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk1',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk1'],
                    ids: ['2'],
                    allSubObjectives: []
                },
                {
                    learningObjective: "Apply advanced composition techniques",
                    referenceSentences: [{
                        sentence: "Advanced composition involves combining multiple principles to create dynamic visual harmony.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk2',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk2'],
                    ids: ['3'],
                    allSubObjectives: []
                }
            ],
            chunkIds: ['chunk1', 'chunk2'],
            prerequisites: []
        };

        const result = await generateLessonParts(ai, lessonInfo);

        console.dir(result, { depth: null });

        // Verify that foundational concepts are grouped together
        const foundationalPart = result.partOutlines.find(part =>
            part.learningObjectives.includes("Define compositional balance")
        );
        expect(foundationalPart?.learningObjectives).toContain("Define compositional balance");
        expect(foundationalPart?.learningObjectives).toContain("Explain symmetrical and asymmetrical balance");

        // Verify that complex application is in a separate part
        const applicationPart = result.partOutlines.find(part =>
            part.learningObjectives.includes("Apply advanced composition techniques")
        );
        expect(applicationPart).not.toBe(foundationalPart);
        expect(applicationPart?.learningObjectives).toContain("Apply advanced composition techniques");

        // Verify that each part has appropriate supporting content
        result.partOutlines.forEach(part => {
            expect(part.keyPoints.length).toBeGreaterThan(0);
            expect(part.examples.length).toBeGreaterThan(0);
            expect(part.expertQuestions.length).toBeGreaterThan(0);
        });
    });

    it.concurrent('should not split objectives that build directly on each other', { timeout: 30000 }, async () => {
        const lessonInfo: LessonGroupWithPrerequisites = {
            lessonName: "Introduction to Functions",
            expectedDurationMinutes: 45,
            cluster: [
                {
                    learningObjective: "Define what a function is",
                    referenceSentences: [{
                        sentence: "A function is a relation that assigns exactly one output to each input.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk1',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk1'],
                    ids: ['1'],
                    allSubObjectives: []
                },
                {
                    learningObjective: "Identify function inputs and outputs",
                    referenceSentences: [{
                        sentence: "Functions take inputs (domain) and produce outputs (range).",
                        isExactMatch: true,
                        sourceChunkId: 'chunk1',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk1'],
                    ids: ['2'],
                    allSubObjectives: []
                },
                {
                    learningObjective: "Graph quadratic functions",
                    referenceSentences: [{
                        sentence: "Quadratic functions create parabolic curves when graphed.",
                        isExactMatch: true,
                        sourceChunkId: 'chunk2',
                        sourceDocumentId: 'doc1'
                    }],
                    chunkIds: ['chunk2'],
                    ids: ['3'],
                    allSubObjectives: []
                }
            ],
            chunkIds: ['chunk1', 'chunk2'],
            prerequisites: []
        };

        const result = await generateLessonParts(ai, lessonInfo);

        // Find the part containing basic function concepts
        const basicFunctionPart = result.partOutlines.find(part =>
            part.learningObjectives.includes("Define what a function is")
        );

        // Verify that directly related objectives stay together
        expect(basicFunctionPart?.learningObjectives).toContain("Define what a function is");
        expect(basicFunctionPart?.learningObjectives).toContain("Identify function inputs and outputs");

        // Verify that graphing, which requires different cognitive skills, is separate
        expect(basicFunctionPart?.learningObjectives).not.toContain("Graph quadratic functions");
    });
});