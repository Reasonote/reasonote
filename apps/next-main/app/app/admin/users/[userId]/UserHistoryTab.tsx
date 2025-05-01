import React from "react";

import { DateTime } from "luxon";

import {
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { getUserHistoryDeepQueryDoc } from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

export function UserHistoryTab({ userId }: { userId: string }) {
  return (
    <ApolloClientInfiniteScroll
      wrapperElId="user-history-infinite-scroll-component-id"
      overrideWrapperElProps={{
        className: "overflow-scroll scroll firefox-scroll",
      }}
      overrideInfiniteScrollProps={{
        loader: <Stack width={'fit-content'} alignSelf={'center'}>
          <Typography color={'white'}>Loading</Typography>
          <LinearProgress/>
        </Stack>,
        style: {
          display: "flex",
          flexDirection: "column",
          maxHeight: "60vh",
          overflow: "auto",
          paddingBottom: '10px'
        },
      }}
      queryOpts={{
        query: getUserHistoryDeepQueryDoc,
        variables: {
          filter: {
            rsnUserId: {
              eq: userId,
            },
          },
          first: 10,
        },
      }}
      fetchMoreOptions={(qResult) => ({
        variables: {
          after: qResult.data?.userHistoryCollection?.pageInfo.endCursor || undefined,
        },
      })}
      getChildren={(latestQueryResult) => {
        const userHistory = latestQueryResult.data?.userHistoryCollection?.edges.map(
          (edge) => edge.node
        );

        return (
          <Stack gap={1}>
            {userHistory?.map((history) => (
              <Stack key={history.id} direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={history.skill?.name || 'Unknown Skill'} />
                <Typography variant="caption">
                  {DateTime.fromISO(history.createdDate).toRelative()}
                </Typography>
              </Stack>
            ))}
          </Stack>
        );
      }}
      hasMore={(latestQueryResult) => (
        latestQueryResult.loading ||
        !!latestQueryResult.data?.userHistoryCollection?.pageInfo.hasNextPage
      )}
    />
  );
}