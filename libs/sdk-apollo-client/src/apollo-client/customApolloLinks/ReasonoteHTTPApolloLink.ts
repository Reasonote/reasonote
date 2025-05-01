import { parse } from 'graphql';
import { print } from 'graphql/language/printer';

import { createHttpLink } from '@apollo/client';

/**
 * This will remove duplicate fragments from the request body.
 * [originally written by @narthur](https://github.com/dotansimha/graphql-code-generator/issues/3063#issuecomment-771179054)
 * @param fullReqStr The request body.
 * @returns The request body with duplicate fragments removed.
 */
const removeDuplicateFragments = (fullReqStr: string): string => {
    try {
        const fullReqObject = JSON.parse(fullReqStr);

        const ast = parse(fullReqObject.query);

        const seen: string[] = [];

        const newDefinitions = ast.definitions.filter((def: any) => {
            if (def.kind !== "FragmentDefinition") {
                return true;
            }

            const id = `${def.name.value}-${def.typeCondition.name.value}`;
            const haveSeen = seen.includes(id);

            seen.push(id);

            return !haveSeen;
        });

        const newAst = {
            ...ast,
            definitions: newDefinitions,
        };

        return JSON.stringify({
            ...fullReqObject,
            query: print(newAst),
        });
    } catch (err: any) {
        console.log("err", err);
    }

    // If we somehow failed at our task, just return the original string.
    return fullReqStr;
};

export const createReasonoteHTTPApolloLink = (uri: string) => {
    return createHttpLink({
        uri,
        fetch: async (uri, options) => {
            const fixedOptions = {
                ...options,
                body: options?.body ? removeDuplicateFragments(options?.body as string) : undefined,
            };
            return fetch(uri, fixedOptions);
        },
    });
};
