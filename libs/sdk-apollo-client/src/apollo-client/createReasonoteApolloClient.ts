import _ from 'lodash';

import {
  ApolloClient,
  ApolloClientOptions,
  ApolloLink,
  InMemoryCache,
  makeVar,
  NormalizedCacheObject,
  ReactiveVar,
} from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

import { CurrentUser } from '../codegen/codegen-generic-client/graphql';
import {
  ApolloEntitySynch,
  IApolloEntitySynchListener,
} from './ApolloEntitySynch';
import {
  createReasonoteAuthApolloLink,
} from './customApolloLinks/ReasonoteAuthApolloLink';
import {
  createReasonoteHTTPApolloLink,
} from './customApolloLinks/ReasonoteHTTPApolloLink';

export interface ApolloClientEntitySynchConfig {
    enableEntitySynch?: boolean;
    entities: {
        [entityName: string]: {
            listeners: IApolloEntitySynchListener<any, any, any, any>[];
        };
    };
}

export interface CreateReasonoteApolloClientConfig {
    uri: string;
    getToken: () => Promise<string | undefined>;
    getApiKey: () => Promise<string | undefined>;
    /**
     * Other headers which will be added to the fetch request AFTER all other headers.
     */
    getExtraHeaders?: () => Promise<Record<string, string | undefined>>;
    entitySynchConfig?: ApolloClientEntitySynchConfig;
    /** Options which will be deep merged at the very end of the config construction process.
     *
     * Use this to override any options that are automatically set by this function.
     */
    finalApolloClientOptionOverrides?: Partial<ApolloClientOptions<NormalizedCacheObject>>;
}

/**
 * A Very thin wrapper around Apollo client, with helpers.
 *
 * @class ReasonoteApolloClient
 * @extends {ApolloClient<NormalizedCacheObject>}
 */
export class ReasonoteApolloClient extends ApolloClient<NormalizedCacheObject> {
    /**
     * All reactive vars should go here.
     *
     */
    vars: {
        /** A reactive var for the currently logged in user's id, if any */
        currentUserId: ReactiveVar<string | undefined>;
    };

    constructor(options: ApolloClientOptions<NormalizedCacheObject>) {
        super(options);
        this.vars = {
            currentUserId: makeVar<string | undefined>(undefined),
        };
    }
}

export function createReasonoteApolloClient(config: CreateReasonoteApolloClientConfig): ReasonoteApolloClient {
    const { uri, getToken, getApiKey, getExtraHeaders } = config;

    const authLink = createReasonoteAuthApolloLink(config);
    const httpLink = createReasonoteHTTPApolloLink(uri);
    // const scalarLink = await createReasonoteScalarApolloLink();

    const reasonoteSupabaseCollections = [
        "chatCollection",
        "botCollection",
        "userProfileCollection",
        "goalCollection",
        "chatMessageCollection",
        "skillCollection",
        "userSkillCollection",
        "userActivityResultCollection",
        "userActivityFeedbackCollection",
        "userSettingCollection",
        "activityCollection",
        "activitySkillCollection",
        "skillSetCollection",
        "skillSetSkillCollection",
        "skillLinkCollection",
        "entityCollection",
        "rsnUserCollection",
        "rsnUserSysdataCollection",
        "rsnPageCollection",
        "rsnPageVectorCollection",
        "rsnVecCollection",
        "rsnVecConfigCollection",
        "rsnVecQueueCollection",
        "rsncoreTableAbbreviationsCollection",
        "memberAuthorizationCollection",
        "journalCollection",
        "integrationCollection",
        "integrationTokenCollection",
        "operationLogCollection",
        "stripeCustomersCollection",
        "stripeProductsCollection",
        "stripeSubscriptionsCollection",
        "snipCollection",
        "snipResourceCollection",
        "lessonCollection",
        "memauthCollection",
    ];

    const link = ApolloLink.from([
        //TODO:CustomCodegen
        //scalarLink, 
        authLink,
        httpLink
    ]);

    // Create initial options.
    const clientOptions: ApolloClientOptions<NormalizedCacheObject> = {
        link,
        cache: new InMemoryCache({
            typePolicies: {
                Query: {
                    fields: {
                        // This sets up the 'currentUser' query to be treated as a reactive var.
                        getCurrentUser: {
                            read(data?: CurrentUser) {
                                return { id: client.vars.currentUserId() };
                            },
                        },
                        // This configures all relay-type queries to be treated as paginated.
                        ..._.fromPairs(
                            reasonoteSupabaseCollections.map((collectionName) => [
                                collectionName,
                                // This ensures that the queries with this name will be treated as paginated..
                                // For more info, see: https://www.apollographql.com/docs/react/pagination/cursor-based#relay-style-cursor-pagination
                                relayStylePagination(
                                    // These are the keys that relay will use to determine if a query is part of the same pagination, or not.
                                    // For instance, if two queries are passed two different 'filter' fields, then they will each be treated as a different pagination.
                                    ["filter", "where", "orderBy"],
                                ),
                            ]),
                        ),
                    },
                },
            },
        }),
    };

    // Merge options with overrides.
    _.merge(clientOptions, config.finalApolloClientOptionOverrides);

    /**
     * Initializes the `ApolloClient` with the URL of our GraphQL server and an
     * instance of the `InMemoryCache`, which Apollo Client uses to cache query
     * results after fetching them.
     */
    const client = new ReasonoteApolloClient(clientOptions);

    // If entity synch is enabled, then create the entity synch and start it.
    if (config.entitySynchConfig?.enableEntitySynch) {
        const entitySynch = new ApolloEntitySynch({ getClient: () => client });

        _.entries(config.entitySynchConfig.entities).forEach(([entityName, { listeners }]) => {
            listeners.forEach((l) => entitySynch.addEntityToSynch(entityName, l));
        });

        entitySynch.start();
    }

    // console.debug("Apollo client created with config: ", config);

    return client;
}
