"use client"
import {useRouter} from "next/navigation";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import CenterPaperStack from "@/components/positioning/FullCenterPaperStack";
import {
  Chip,
  Typography,
} from "@mui/material";
import {
  GetSnipFlatDocument,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {
  useIntegrationFlatFragLoader,
  useSnipFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

import {ActionCard} from "../activities/new/page.page";

export function SnipListEntry({snipId, onSnipSelect}: {snipId: string, onSnipSelect?: (snipId: string) => void}) {
    const {data: snip} = useSnipFlatFragLoader(snipId);

    const {data: integration} = useIntegrationFlatFragLoader(snip?.sourceIntegration);

    return snip ? (
        <ActionCard onClick={() => onSnipSelect?.(snipId)} cardProps={{elevation: 5}}>
            <Typography>{snip.name}</Typography>
            {
              integration?.type === 'readwise' ? (
                <div>
                  
                  <Chip icon={<img src="/static/images/Readwise-Icon-Dark.svg" width={15} height={15} alt="Readwise logo"/>} label="Readwise" color="primary" size="small"/>
                </div>
              ) : null
            }
        </ActionCard>
    ) : null;
}


export default function Snips(){
    const router = useRouter();
    const rsnUserId = useRsnUserId();

    return (
        <CenterPaperStack>
            <Typography variant="h4">Your Snips</Typography>
            <ACSBDefaultInfiniteScroll
              getCollection={(data) => data.snipCollection}
              getNodes={(collection) => collection.edges.map(edge => edge.node)}
              queryOpts={{
                query: GetSnipFlatDocument,
                variables: {
                  filter: {
                    owner: {
                      eq: rsnUserId ?? 'FAKE',
                    }
                  },
                  orderBy: {
                    createdDate: OrderByDirection.DescNullsFirst,
                  },
                  first: 5,
                },
                fetchPolicy: "network-only" as const, // Used for first execution
                // nextFetchPolicy: "cache-first" as const, // Used for subsequent executions
              }}
              // TODO: build fails here without any, but should be inferrable fine?
              getChild={(node: any) => {
                return <SnipListEntry snipId={node.id} onSnipSelect={() => {
                  router.push(`/app/snips/${node.id}`)
                }}/>
              }}
              infScrollStyle={{
                  gap: '10px'
              }}
            />
        </CenterPaperStack>
    )
}