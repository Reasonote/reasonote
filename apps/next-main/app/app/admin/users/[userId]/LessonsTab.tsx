import React from "react";

import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import { Txt } from "@/components/typography/Txt";
import { Stack } from "@mui/material";
import { GetLessonFlatDocument } from "@reasonote/lib-sdk-apollo-client";

export function LessonsTab({ userId }: { userId: string }) {
  return (
    <Stack maxHeight={'60vh'}>
      <ACSBDefaultInfiniteScroll
        getCollection={(data) => data.lessonCollection}
        getNodes={(collection) => collection.edges.map(edge => edge.node)}
        queryOpts={{
          query: GetLessonFlatDocument,
          variables: {
            filter: {
              createdBy: {
                eq: userId,
              }
            },
            first: 10,
          },
          fetchPolicy: "network-only" as const,
        }}
        // @ts-ignore
        getChild={(node: any) => (
          <Stack key={node.id} direction={'row'} alignItems={'center'} justifyContent={'space-between'} padding={'5px'}>
            <Txt startIcon={node.icon}>{node.name}</Txt>
          </Stack>
        )}
        emptyListComponent={
          <Stack width={'100%'} alignItems={'center'} justifyContent={'center'} padding={'10px'}>
            <Txt startIcon={"📚"}>No Lessons.</Txt>
          </Stack>
        }
      />
    </Stack>
  );
}