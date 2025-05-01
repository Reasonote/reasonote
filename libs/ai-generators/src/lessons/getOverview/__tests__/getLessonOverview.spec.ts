import { getLessonOverview } from '../getLessonOverview';
import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';
import { runSharedTests, TEST_CASES, TestCase } from './shared';

runSharedTests('getLessonOverview', async (testCase: TestCase) => {
    const ai = createDefaultStubAI();
    const result = await getLessonOverview({
        ai,
        ...TEST_CASES[testCase]
    });

    const items = [
        ...(result?.slides ?? []),
        ...(result?.practice?.activities ?? [])
    ];

    return items;
}); 