import * as Priompt from '@anysphere/priompt';
import { asyncSleep } from '@lukebechtel/lab-ts-utils';

import { Block } from '../../prompt/AIPromptObj/PromptComponents';

/**
 * EXPERIMENTAL: PriomptSync
 * 
 * This file represents an experiment to determine if we could implement
 * an async hydration strategy that works with Priompt.
 * 
 * The goal was to explore how Priompt components could be enhanced with
 * asynchronous data loading capabilities through a hydration pattern,
 * allowing for dynamic content generation that depends on async operations.
 * 
 * This is not intended for production use and serves as a proof-of-concept.
 */

export interface PriomptSyncArgs {
    firstName?: string;
    lastName?: string;
}


export function PriomptSync({firstName, lastName}: PriomptSyncArgs) {
    const fullName = `${firstName} ${lastName}`;

    return <Block name="TEST" attributes={{
        //@ts-ignore
        hydrate: async () => {
            await asyncSleep(1000);

            return {
                firstName: 'John',
                lastName: 'Doe'
            }
        }
    }}>
        <Block name="TEST2">
            <Block name="TEST3">{fullName}</Block>
        </Block>
    </Block>
}


export function PriomptSync2() {
    return <Block name="OUTER">
        <PriomptSync />
    </Block>
}