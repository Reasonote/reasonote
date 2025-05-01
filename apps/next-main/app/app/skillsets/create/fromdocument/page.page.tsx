'use client'
import {useState} from "react";

import {useRouter} from "next/navigation";

import FullCenter from "@/components/positioning/FullCenter";
import {
  useApolloClient,
  useMutation,
} from "@apollo/client";
import {
  Card,
  Stack,
  Typography,
} from "@mui/material";
import {createRsnPageFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

export default function Page(){
    const router = useRouter();
    const ac = useApolloClient();
    const [loadingState, setLoadingState] = useState<{state: 'loading' | 'success' | 'error'}>({state: 'loading'});
    
    // Page should just create a new document and then redirect to that document's subpage here.
    const createDocument = useMutation(createRsnPageFlatMutDoc, {
        variables: {
            objects: [{
                name: 'New Document'
            }]
        }
    })

    useAsyncEffect(async () => {
        const result = await ac.mutate({
            mutation: createRsnPageFlatMutDoc,
            variables: {
                objects: [{
                    name: 'New Document'
                }]
            }
        })

        if (result.errors) {
            setLoadingState({state: 'error'})
            return;
        }

        setLoadingState({state: 'success'})

        const docId = result.data?.insertIntoRsnPageCollection?.records?.[0]?.id;

        return router.push(`/app/skillsets/create/fromdocument/${docId}`)
    }, [])

    return <FullCenter>
        <Card>
            <Stack gap={1}>
                <Typography>Creating Document...</Typography>
                
            </Stack>
        </Card>
    </FullCenter>
}