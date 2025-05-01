"use client";
import React from "react";

import {useRouter} from "next/navigation";

import {
  ACSBDefaultInfiniteScroll,
} from "@/components/lists/ACSBDefaultInfiniteScroll";
import {
  Button,
  Stack,
  Typography,
} from "@mui/material";
import {getRsnPageFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client";

import {JournalListItem} from "./JournalListItem";

// const GET_JOURNAL_ENTRIES = gql`
//   query GetJournalEntries($after: Cursor) {
//     rsnPageCollection(
//       filter: { type: { eq: "journal" } }
//       orderBy: [{ createdAt: DESC }]
//       first: 10
//       after: $after
//     ) {
//       edges {
//         node {
//           id
//           name
//           createdAt
//         }
//       }
//       pageInfo {
//         hasNextPage
//         endCursor
//       }
//     }
//   }
// `;

export default function JournalPage() {
  const router = useRouter();

  const handleNewJournal = () => {
    router.push("/app/journal/new");
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Journal</Typography>
      <Button variant="contained" onClick={handleNewJournal}>
        New Journal Entry
      </Button>
      <ACSBDefaultInfiniteScroll
        queryOpts={{
          query: getRsnPageFlatQueryDoc,
        }}
        getCollection={(data) => data?.rsnPageCollection}
        //@ts-ignore
        getNodes={(collection) => collection.edges.map((edge) => edge.node)}
        //@ts-ignore
        getChild={(node) => <JournalListItem key={node.id} journal={node} />}
        emptyListComponent={<Typography>No journal entries yet.</Typography>}
      />
    </Stack>
  );
}
