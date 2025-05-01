import React from "react";

import {SkillIcon} from "@/components/icons/SkillIcon";
import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import {Txt} from "@/components/typography/Txt";
import {
  Chip,
  Stack,
} from "@mui/material";
import {GetSkillSetWithSkillsDocument} from "@reasonote/lib-sdk-apollo-client";

export function SkillsTab({ userId }: { userId: string }) {
  return (
    <Stack maxHeight={'60vh'}>
      <ACSBDefaultInfiniteScroll
        getCollection={(data) => data.skillSetCollection?.edges[0]?.node?.skillSetSkillCollection}
        getNodes={(collection) => collection.edges.map(edge => edge.node)}
        queryOpts={{
          query: GetSkillSetWithSkillsDocument,
          variables: {
            filter: {
              forUser: {
                eq: userId
              }
            },
            first: 10,
          },
          fetchPolicy: "network-only" as const,
        }}
        getChild={(node: any) => (
          <Stack key={node.skill?.id} direction={'row'} alignItems={'center'} justifyContent={'space-between'} padding={'5px'}>
            <Chip icon={<SkillIcon fontSize="small"/>} label={node.skill?.name} />
          </Stack>
        )}
        emptyListComponent={
          <Stack width={'100%'} alignItems={'center'} justifyContent={'center'} padding={'10px'}>
            <Txt startIcon={"🤔"}>No Skills.</Txt>
          </Stack>
        }
      />
    </Stack>
  );
}