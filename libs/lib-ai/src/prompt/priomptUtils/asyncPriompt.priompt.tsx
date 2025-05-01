import * as Priompt from '@anysphere/priompt';
import { asyncSleep } from '@lukebechtel/lab-ts-utils';

import { Block } from '../AIPromptObj/PromptComponents';

export async function TestAsyncPriompt() {
    await asyncSleep(1000);
    
    return <Block name="TEST">
        <Block name="TEST2">
            <Block name="TEST3">
                TEST
            </Block>
            {/* Ignoring this because hopefully priompt is smart enough to figure this out? */}
            {await TestAsyncPriompt2()}
        </Block>
    </Block>
}

export async function TestAsyncPriompt2() {
    await asyncSleep(1000);
    
    return <Block name="TEST">TEST</Block>
}