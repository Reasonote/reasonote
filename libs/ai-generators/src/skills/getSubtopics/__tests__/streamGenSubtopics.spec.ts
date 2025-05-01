import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { AIExtraContext } from '../../../utils/AIExtraContext';
import { streamGenSubtopics } from '../streamGenSubtopics';

describe('streamGenSubtopics', () => {
    it('generates unique subtopics', async () => {
        const ai = createDefaultStubAI();
        const generator = streamGenSubtopics({
            ai,
            skill: { name: 'Mathematics', description: 'Basic mathematics concepts' },
            numTopics: 3
        });

        const topics = [];
        for await (const topic of generator) {
            topics.push(topic);
        }

        expect(topics.length).toBe(3);
        expect(new Set(topics.map(t => t.name)).size).toBe(3); // All names unique
        topics.forEach(topic => {
            expect(topic.name).toBeDefined();
            expect(topic.description).toBeDefined();
            expect(topic.emoji).toBeDefined();
        });
    });

    it('respects existing topics', async () => {
        const ai = createDefaultStubAI();
        const existingTopics = [{
            name: 'Addition',
            description: 'Basic addition',
            emoji: '➕'
        }];

        const generator = streamGenSubtopics({
            ai,
            skill: { name: 'Mathematics' },
            existingTopics,
            numTopics: 3
        });

        const topics = [];
        for await (const topic of generator) {
            topics.push(topic);
        }

        expect(topics.some(t => t.name === 'Addition')).toBe(false);
    });

    it('incorporates custom prompt', async () => {
        const ai = createDefaultStubAI();
        const customPrompt = 'Focus on geometry concepts';

        const generator = streamGenSubtopics({
            ai,
            skill: { name: 'Mathematics' },
            customPrompt,
            numTopics: 3
        });

        const topics = [];
        for await (const topic of generator) {
            topics.push(topic);
        }

        // At least one topic should be geometry-related
        expect(topics.some(t =>
            t.name?.toLowerCase().includes('geometry') ||
            t.description?.toLowerCase().includes('geometry') ||
            t.name?.toLowerCase().includes('geometric') ||
            t.description?.toLowerCase().includes('geometric') ||
            t.name?.toLowerCase().includes('geometrical') ||
            t.description?.toLowerCase().includes('geometrical') ||
            t.name?.toLowerCase().includes('shape') ||
            t.description?.toLowerCase().includes('shape')
        )).toBe(true);
    });

    it('incorporates extra context in generated topics', async () => {
        const ai = createDefaultStubAI();
        const resourceContext = new AIExtraContext({
            title: 'RelevantResources',
            description: 'The relevant resources for the skill',
            body: `
            We will begin learning about programming through Python.
            Python is a popular programming language that is easy to learn.
            The benefits of learning Python are numerous.
            - It is a very popular language
            - It is easy to learn
            - There are many resources available for learning Python
            - There is a lot of support for Python online
            - Python is a very versatile language
            - Python is a very powerful language
            - Python is a very flexible language
            - Python is a very easy language to read
            - Python is a very easy language to write
            - Python is a very easy language to debug

            Let's start by learning about the basics of Python.
            We will learn about the following:
            - Variables
            - Data types
            - Operators
            - Control flow
            - Functions
            - Classes

            Variables are a way to store data in a program.
            `
        });

        const generator = streamGenSubtopics({
            ai,
            skill: { name: 'Programming' },
            numTopics: 3,
            extraContext: [resourceContext]
        });

        const topics = [];
        for await (const topic of generator) {
            topics.push(topic);
        }

        // At least one topic should reference content from the resources
        expect(topics.some(t =>
            t.name?.toLowerCase().includes('python') ||
            t.description?.toLowerCase().includes('python')
        )).toBe(true);
    });

    it('incorporates user goals in generated topics', async () => {
        const ai = createDefaultStubAI();
        const userContext = new AIExtraContext({
            title: 'UserContext',
            description: 'The user\'s data for the skill',
            body: `
            User's goals for learning this skill:
            - Want to learn advanced data structures
            - Interested in algorithm optimization
            - Need to prepare for coding interviews
            
            Current skill level: intermediate
            `
        });

        const generator = streamGenSubtopics({
            ai,
            skill: { name: 'Programming', description: 'Computer programming fundamentals' },
            numTopics: 3,
            extraContext: [userContext]
        });

        const topics = [];
        for await (const topic of generator) {
            topics.push(topic);
        }

        // At least one topic should align with the user's goals
        expect(topics.some(t =>
            t.name?.toLowerCase().includes('data structure') ||
            t.description?.toLowerCase().includes('data structure') ||
            t.name?.toLowerCase().includes('algorithm') ||
            t.description?.toLowerCase().includes('algorithm') ||
            t.name?.toLowerCase().includes('interview') ||
            t.description?.toLowerCase().includes('interview')
        )).toBe(true);
    });
}); 