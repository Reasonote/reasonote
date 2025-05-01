import { ApolloLink } from '@apollo/client';

export function createReasonoteDebugApolloLink(logTag: string) {
    return new ApolloLink((operation, forward) => {
        console.log(`[ReasonoteDebugApolloLink${logTag ? ": " + logTag : ""}]`, operation);

        return forward(operation);
    });
}
