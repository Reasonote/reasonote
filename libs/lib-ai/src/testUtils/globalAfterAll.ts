import { afterAll } from 'vitest';

import { Laminar } from '@lmnr-ai/lmnr';

export function testAiBeforeAll() {
}

export function testAiAfterAll() {
    try {
        Laminar.shutdown();
    } catch (error) {
        console.error('Error shutting down Laminar:', error);
    }
}

export function testAiFixtures(){
    beforeAll(() => {
        testAiBeforeAll();
    });

    afterAll(() => {
        testAiAfterAll();
    });
}