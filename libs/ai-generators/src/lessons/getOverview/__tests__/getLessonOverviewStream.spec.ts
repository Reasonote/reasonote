import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { getLessonOverviewStream } from '../getLessonOverviewStream';
import {
  runSharedTests,
  TEST_CASES,
  TestCase,
} from './shared';

runSharedTests('getLessonOverviewStream', async (testCase: TestCase) => {
    const ai = createDefaultStubAI();
    const items = [];

    const generator = getLessonOverviewStream({
        ai,
        ...TEST_CASES[testCase]
    });

    for await (const item of generator) {
        items.push(item);
    }

    console.log(`test ${testCase}`, JSON.stringify(items, null, 2));

    return items;
}); 