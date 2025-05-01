import React from "react";

import {DateTime} from "luxon";

import {Score0To100Chip} from "@/app/app/badges/Score0To100Badge";
import {ActivityTypeIcon} from "@/components/activity/ActivityTypeIndicator";
import {
  Card,
  CardActionArea,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  GetActivityResultsDeepDocument,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

export function ActivitiesTab({ userId }: { userId: string }) {
  return (
    <ApolloClientInfiniteScroll
      wrapperElId="activity-infinite-scroll-component-id"
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
        query: GetActivityResultsDeepDocument,
        variables: {
          filter: {
            user: {
              eq: userId
            }
          },
          first: 10,
          orderBy: {
            createdDate: OrderByDirection.DescNullsLast
          }
        },
      }}
      fetchMoreOptions={(qResult) => ({
        variables: {
          after: qResult.data?.userActivityResultCollection?.pageInfo.endCursor || undefined,
        },
      })}
      getChildren={(latestQueryResult) => {
        const activityResults = latestQueryResult.data?.userActivityResultCollection?.edges.map(
          (edge) => edge.node
        );

        return (
          <Stack gap={1}>
            {activityResults?.map((activityResult) => (
              <Card key={activityResult.id} elevation={3} sx={{padding: '0px'}}>
                <CardActionArea sx={{padding: '2px'}}>
                  <Grid container alignItems={'center'} padding={'2px'}>
                    <Grid item xs={1}><ActivityTypeIcon activityType={activityResult.activity?.type as any} /></Grid>
                    <Grid item xs={1}>
                      <Score0To100Chip short size={'small'} score={activityResult.score ?? 0} />
                    </Grid>
                    <Grid item xs={7}>
                      <Typography>
                        {activityResult.activity?.activitySkillCollection?.edges.map((edge) => (
                          <Chip key={edge.node.skill?.id} size="small" label={edge.node.skill?.name} />
                        )).slice(0, 3)}
                        {activityResult.activity?.activitySkillCollection?.edges && activityResult.activity?.activitySkillCollection?.edges?.length > 3 && (
                          <Chip size="small" label={`+${activityResult.activity?.activitySkillCollection?.edges.length - 3} more`} />
                        )}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption">
                        {DateTime.fromISO(activityResult.createdDate).toRelative()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        );
      }}
      hasMore={(latestQueryResult) => (
        latestQueryResult.loading ||
        !!latestQueryResult.data?.userActivityResultCollection?.pageInfo.hasNextPage
      )}
    />
  );
}