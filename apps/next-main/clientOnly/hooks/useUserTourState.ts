import {
  useCallback,
  useState,
} from "react";

import {useApolloClient} from "@apollo/client";
import {
  createUserTourFlatMutDoc,
  getUserTourFlatQueryDoc,
  updateUserTourFlatMutDoc,
  UserTourFlatFragFragment,
} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {useRsnUserId} from "./useRsnUser";

export function useUserTour(tourName: string) {
    const [userTour, setUserTour] = useState<{state: 'loading' | 'loaded' | 'not-found' | 'error', value?: UserTourFlatFragFragment}>({state: 'loading'});
    const ac = useApolloClient();
    const rsnUserId = useRsnUserId();

    const refetch = useCallback(async () => {

        if (!rsnUserId){
            console.error('No rsnUserId');
            return;
        }

        const res = await ac.query({
            query: getUserTourFlatQueryDoc,
            variables: {
                filter: {
                    tourName: {
                        eq: tourName
                    },
                    user: {
                        eq: rsnUserId
                    }
                }
            },
            fetchPolicy: 'network-only'
        })

        const firstResult = res.data?.userTourCollection?.edges?.[0]?.node;

        if (firstResult){
            setUserTour({state: 'loaded', value: firstResult});
        }
        else {
            if (res.error){
                setUserTour({state: 'error', value: undefined});
            }
            else {
                setUserTour({state: 'not-found', value: undefined});
            }
        }
    }, [tourName, rsnUserId])

    const update = useCallback(async (setters: Partial<UserTourFlatFragFragment>) => {
        // 1. check if this actually exists.
        const existingRes = await ac.query({
            query: getUserTourFlatQueryDoc,
            variables: {
                filter: {
                    tourName: {
                        eq: tourName
                    },
                    user: {
                        eq: rsnUserId
                    }
                }
            }
        });

        const existing = existingRes.data?.userTourCollection?.edges?.[0]?.node;

        if (existing){
            // 2. If it does, update
            const res = await ac.mutate({
                mutation: updateUserTourFlatMutDoc,
                variables: {
                    set: setters,
                    filter: {
                        id: {
                            eq: existing.id
                        }
                    },
                    atMost: 1
                }
            })
        }
        else {
            // 3. If it doesn't, create
            const res = await ac.mutate({
                mutation: createUserTourFlatMutDoc,
                variables: {
                    objects: [
                        {
                            ...setters,
                            user: rsnUserId,
                            tourName: tourName
                        }
                    ]
                }
            })
        }

        refetch();  
    }, [userTour, ac, refetch, tourName, rsnUserId]);

    useAsyncEffect(async () => {
        await refetch();
    }, [tourName, rsnUserId, refetch]);


    return {
        data: userTour.value,
        refetch,
        update,
        notFound: userTour.state === 'not-found',
        loading: userTour.state === 'loading',
        error: userTour.state === 'error' ? new Error('User tour not found') : undefined,
    }

}