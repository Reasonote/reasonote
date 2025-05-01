import { setContext } from '@apollo/client/link/context';
import { jwtBearerify } from '@reasonote/lib-utils';

import {
    CreateReasonoteApolloClientConfig,
} from '../createReasonoteApolloClient';

export const createReasonoteAuthApolloLink = (config: CreateReasonoteApolloClientConfig) => {
    const { uri, getToken, getApiKey, getExtraHeaders } = config;

    return setContext(async (_, { headers }) => {
        // get the authentication token from local storage if it exists
        const token = await getToken();
        const apikey = await getApiKey();
        const extraheaders = getExtraHeaders ? await getExtraHeaders() : {};

        const ret = {
            headers: {
                ...headers,
                apikey,
                authorization: token ? jwtBearerify(token) : undefined, // however you get your token
                ...extraheaders,
            },
        };

        return ret;
    });
};
