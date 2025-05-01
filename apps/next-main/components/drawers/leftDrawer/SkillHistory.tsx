import {useState} from "react";

import {DateTime} from "luxon";
import {useRouter} from "next/navigation";

import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material"; // You may need to create this query
import {getUserHistoryDeepQueryDoc} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";
import {
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client/src/codegen/codegen-generic-client/graphql";

import {SkillEmojiAvatar} from "../../skill/SkillEmojiAvatar";

export function SkillHistory() {
  const router = useRouter();
  const [updateCount, setUpdateCount] = useState<number>(0);
  const rsnUserId = useRsnUserId();

  const rootQueryOpts = {
    query: getUserHistoryDeepQueryDoc,
    variables: {
      orderBy: { updatedDate: OrderByDirection.DescNullsFirst },
      first: 10 + updateCount,
      filter: {
        rsnUserId: {
          eq: rsnUserId
        }
      }
    },
  };

  return (
    <ApolloClientInfiniteScroll
      wrapperElId="skill-history-container"
      inverse={false}
      overrideWrapperElProps={{
        style: {
          display: "flex",
          flexDirection: "column",
          overflowY: "scroll",
          flexGrow: 1,
          height: "400px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        },
      }}
      overrideInfiniteScrollProps={{
        loader: <div>Loading</div>,
        style: {
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
        },
        className: "gap-y-1",
      }}
      queryOpts={rootQueryOpts}
      updateCount={updateCount}
      fetchMoreOptions={(qResult) => {
        const after = qResult.data?.userHistoryCollection?.pageInfo.endCursor;
        if (after && after.trim().length > 0) {
          return { variables: { after } };
        }
        return { variables: { after: undefined } };
      }}
      getChildren={(latestQueryResult) => {
        const visitations = latestQueryResult.data?.userHistoryCollection?.edges.map(
          (e) => e.node
        ).filter(notEmpty)

        return (
          visitations?.map((visitation) => {
            if (!visitation.skill) return null;
            return (
              <ListItem key={visitation.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push(`/app/skills/${visitation.skill?.id}`);
                  }}
                  sx={{
                    p: .5,
                    pl: 1
                  }}
                >
                  <SkillEmojiAvatar 
                    skillId={visitation.skill.id} 
                    size={24} 
                    sx={{ marginRight: 1 }} 
                  />
                  <ListItemText
                    primary={visitation.skill.name.length > 25 ? `${visitation.skill.name.substring(0, 20)}...` : visitation.skill.name}
                    secondary={DateTime.fromISO(visitation.createdDate).toRelative()}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: ".75em",
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        fontSize: ".6em",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          }).filter(Boolean) ?? null
        );
      }}
      hasMore={(latestQueryResult) => {
        return !!(
          latestQueryResult.loading ||
          latestQueryResult.data?.userHistoryCollection?.pageInfo.hasNextPage
        );
      }}
    />
  );
}