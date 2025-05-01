import { ApolloLink } from '@apollo/client';

import { createReasonoteDebugApolloLink } from './ReasonoteDebugApolloLink';

export function wrapApolloLink(link: ApolloLink, name: string): ApolloLink {
    return ApolloLink.from([
        createReasonoteDebugApolloLink(`${name} Before`),
        link,
        createReasonoteDebugApolloLink(`${name} After`),
    ]);
}
