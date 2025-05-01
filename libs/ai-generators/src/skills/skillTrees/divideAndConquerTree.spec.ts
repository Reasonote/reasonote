import fs from 'fs';
import path from 'path';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { AIExtraContext } from '../../utils/AIExtraContext';
import { DivideAndConquerTreeMaker } from './DivideAndConquerTree';

// Define our subjects
const SUBJECTS = [
    'Basic Algebra',
    'Programming in Python',
    'Web Development',
    'Data Structures',
    'Chemistry Basics',
    'Advanced Chemistry'
] as const;

type Subject = typeof SUBJECTS[number];

interface TestMatrixEntry {
    subject: Subject;
    description?: string;
    relevantDocuments?: { name: string; content: string }[];
    extraContext?: AIExtraContext[];
}

// Generate the test matrix
function generateTestMatrix(): TestMatrixEntry[] {
    return [
        // Basic test cases without context
        ...SUBJECTS.map(subject => ({
            subject,
            description: `Divide and conquer tree for ${subject}`
        })),
        // Test case with context
        {
            subject: 'Programming in Python',
            description: 'Divide and conquer tree for Python with specific context',
            relevantDocuments: [
                {
                    name: 'Course Requirements',
                    content: 'This course requires students to learn data types, control structures, and object-oriented programming concepts.'
                },
                {
                    name: 'Learning Goals',
                    content: 'Students should be able to write basic Python scripts and understand fundamental programming concepts.'
                }
            ],
            extraContext: [
                new AIExtraContext({
                    title: 'target_audience',
                    description: 'The content is aimed at beginners with no prior programming experience.'
                }),
                new AIExtraContext({
                    title: 'time_constraints',
                    description: 'The course should be completable within 8 weeks of part-time study.'
                })
            ]
        },
    ];
}

const TEST_MATRIX = generateTestMatrix();

describe('DivideAndConquerTreeMaker Matrix Tests', () => {
    const ai = createDefaultStubAI();

    // Helper function to save output files
    const saveOutput = (entry: TestMatrixEntry, content: string, fname: string) => {
        const dirname = `out-divide-conquer-${entry.subject.replace(/\s+/g, '-').toLowerCase()}${entry.relevantDocuments ? '-with-context' : ''}`;
        const dirpath = path.join(__dirname, 'test_output/divide-conquer', dirname);
        const filepath = path.join(dirpath, fname);
        
        fs.mkdirSync(dirpath, { recursive: true });
        fs.writeFileSync(filepath, content);
    };

    // Run tests for each subject
    TEST_MATRIX.forEach((entry) => {
        describe(`Subject: ${entry.subject}`, () => {
            it(`should generate a valid tree${entry.relevantDocuments ? ' with context' : ''}`, async () => {
                const tree = new DivideAndConquerTreeMaker({
                    ai,
                    rootSkill: entry.subject,
                    numThreads: 10,
                    maxDepth: 3,
                    relevantDocuments: entry.relevantDocuments,
                    extraContext: entry.extraContext
                });

                await tree.aiInitialize();

                // Save the Mermaid diagram
                saveOutput(entry, tree.toMermaidString(), 'tree.mermaid');

                // Save the raw tree data
                saveOutput(entry, tree.toAIString(), 'tree.json');

                // Basic validation
                expect(tree.nodes.length).toBeGreaterThan(1); // At least root + 1 node
                expect(tree.edges.length).toBeGreaterThan(0); // At least 1 edge

                // Validate root node exists
                expect(tree.nodes.some(n => n.id === entry.subject)).toBe(true);

                // Validate edge consistency
                tree.edges.forEach(edge => {
                    // Both nodes in each edge should exist
                    expect(tree.nodes.some(n => n.id === edge.prereq)).toBe(true);
                    expect(tree.nodes.some(n => n.id === edge.enables)).toBe(true);
                });

                // Validate max depth wasn't exceeded
                expect(tree.getCurrentMaxDepth()).toBeLessThanOrEqual(3);

                // Additional validation for context-aware test case
                if (entry.relevantDocuments) {
                    // Check if the generated objectives align with the provided context
                    // For Python, we expect to see basic concepts mentioned in the context
                    const allNodeNames = tree.nodes.map(n => n.id.toLowerCase());
                    const expectedConcepts = ['data types', 'control structures', 'object-oriented'];
                    
                    expectedConcepts.forEach(concept => {
                        const hasRelatedNode = allNodeNames.some(name => 
                            name.includes(concept.toLowerCase()) || 
                            name.includes(concept.replace('-', ' ').toLowerCase())
                        );
                        expect(hasRelatedNode, `Tree should include nodes related to ${concept}`).toBe(true);
                    });
                }

                // Save metrics
                const metrics = {
                    totalNodes: tree.nodes.length,
                    totalEdges: tree.edges.length,
                    maxDepth: tree.getCurrentMaxDepth(),
                    averageEdgesPerNode: tree.edges.length / tree.nodes.length,
                    leafNodes: tree.nodes.filter(n => 
                        !tree.edges.some(e => e.prereq === n.id)
                    ).length,
                    hasContext: !!entry.relevantDocuments || !!entry.extraContext
                };
                saveOutput(entry, JSON.stringify(metrics, null, 2), 'metrics.json');

            }, { timeout: 120_000 }); // 2 minute timeout
        });
    });
});

describe('DivideAndConquerTreeMaker Matrix Tests with Questions and Topics', () => {
    const ai = createDefaultStubAI();

    // Helper function to save output files
    const saveOutput = (entry: TestMatrixEntry, content: string, fname: string) => {
        const dirname = `out-divide-conquer-${entry.subject.replace(/\s+/g, '-').toLowerCase()}${entry.relevantDocuments ? '-with-context' : ''}-with-questions`;
        const dirpath = path.join(__dirname, 'test_output/divide-conquer', dirname);
        const filepath = path.join(dirpath, fname);
        
        fs.mkdirSync(dirpath, { recursive: true });
        fs.writeFileSync(filepath, content);
    };

    // Run tests for each subject
    TEST_MATRIX.forEach((entry) => {
        describe(`Subject: ${entry.subject}`, () => {
            it(`should generate a valid tree with questions and topic names${entry.relevantDocuments ? ' and context' : ''}`, async () => {
                const tree = new DivideAndConquerTreeMaker({
                    ai,
                    rootSkill: entry.subject,
                    numThreads: 10,
                    maxDepth: 3,
                    relevantDocuments: entry.relevantDocuments,
                    extraContext: entry.extraContext,
                    useQuestions: true,
                    useTopicNames: true,
                });

                await tree.aiInitialize();

                // Save the Mermaid diagram
                saveOutput(entry, tree.toMermaidString(), 'tree.mermaid');

                // Save the raw tree data
                saveOutput(entry, tree.toAIString(), 'tree.json');

                // Basic validation
                expect(tree.nodes.length).toBeGreaterThan(1); // At least root + 1 node
                expect(tree.edges.length).toBeGreaterThan(0); // At least 1 edge

                // Validate root node exists
                expect(tree.nodes.some(n => n.id === entry.subject)).toBe(true);

                // Validate edge consistency
                tree.edges.forEach(edge => {
                    // Both nodes in each edge should exist
                    expect(tree.nodes.some(n => n.id === edge.prereq)).toBe(true);
                    expect(tree.nodes.some(n => n.id === edge.enables)).toBe(true);
                });

                // Validate max depth wasn't exceeded
                expect(tree.getCurrentMaxDepth()).toBeLessThanOrEqual(3);

                // Validate questions and topic names
                tree.nodes.forEach(node => {
                    if (node.id !== entry.subject) { // Skip root node
                        expect(node).toHaveProperty('topicName');
                        expect(node.topicName).toBeTruthy();
                        
                        expect(node).toHaveProperty('questions');
                        expect(Array.isArray(node.questions)).toBe(true);
                        expect(node.questions?.length).toBe(5);
                        node.questions?.forEach(question => {
                            expect(typeof question).toBe('string');
                            expect(question.length).toBeGreaterThan(0);
                        });
                    }
                });


                // Save metrics
                const metrics = {
                    totalNodes: tree.nodes.length,
                    totalEdges: tree.edges.length,
                    maxDepth: tree.getCurrentMaxDepth(),
                    averageEdgesPerNode: tree.edges.length / tree.nodes.length,
                    leafNodes: tree.nodes.filter(n => 
                        !tree.edges.some(e => e.prereq === n.id)
                    ).length,
                    hasContext: !!entry.relevantDocuments || !!entry.extraContext,
                    averageQuestionsPerNode: tree.nodes.reduce((acc, node) => acc + (node.questions?.length || 0), 0) / tree.nodes.length,
                    totalQuestions: tree.nodes.reduce((acc, node) => acc + (node.questions?.length || 0), 0)
                };
                saveOutput(entry, JSON.stringify(metrics, null, 2), 'metrics.json');

            }, { timeout: 180_000 }); // 3 minute timeout for question generation
        });
    });
}); 