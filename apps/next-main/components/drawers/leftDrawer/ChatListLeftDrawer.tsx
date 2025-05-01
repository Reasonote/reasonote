import {useState} from "react";

import {DateTime} from "luxon";
import {useRouter} from "next/navigation";

import {useMutation} from "@apollo/client";
import {Delete} from "@mui/icons-material";
import {
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  createChatFlatMutDoc,
  deleteChatFlatMutDoc,
  getChatFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";
import {
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client/src/codegen/codegen-generic-client/graphql";

import {useCurrentChatId} from "../../../clientOnly/hooks/useCurrentChatId";
import {useRsnUser} from "../../../clientOnly/hooks/useRsnUser";

export interface ChatListLeftDrawerParams {
  // TODO: maybe get this from the router?
  selectedChatId: string | null;
}

export function ChatListLeftDrawer(params: ChatListLeftDrawerParams) {
  // TODO get all bots from the server
  const { rsnUserId } = useRsnUser();
  const router = useRouter();

  const currentChatId = useCurrentChatId();

  const [createChat] = useMutation(createChatFlatMutDoc);
  const [deleteChat] = useMutation(deleteChatFlatMutDoc);

  const [updateCount, setUpdateCount] = useState<number>(0);

  const rootQueryOpts = {
    query: getChatFlatQueryDoc,
    variables: {
      filter: {
        createdBy: { eq: rsnUserId },
      },
      orderBy: { createdDate: OrderByDirection.DescNullsFirst },
      first: 10 + updateCount,
    },
  };

  return (
    <ApolloClientInfiniteScroll
      wrapperElId={"doc-list-container"}
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
        className: "gap-y-4",
      }}
      // TODO not sure why this is happening.
      //@ts-ignore
      queryOpts={rootQueryOpts}
      updateCount={updateCount}
      fetchMoreOptions={(qResult) => {
        const after = qResult.data?.chatCollection?.pageInfo.endCursor;

        const ret = {
          variables: {
            after,
          },
        };

        return ret;
      }}
      getChildren={(latestQueryResult) => {
        const chats = latestQueryResult.data?.chatCollection?.edges.map(
          (e) => e.node
        );

        return (
          chats?.map((c) => {
            const manualTitle =
              c.manualTitle && c.manualTitle.trim().length > 0
                ? c.manualTitle.trim()
                : undefined;
            const autoTitle =
              c.autoTitle && c.autoTitle.trim().length > 0
                ? c.autoTitle.trim()
                : undefined;
            const hadManualOrAutoTitle = !!manualTitle || !!autoTitle;
            const chatTitle = manualTitle ?? autoTitle ?? undefined;

            // If there is no `ChatTitle`, use luxon to create a friendly date string like "yesterday" or "2pm" or "last week"
            const chatTitleFriendly =
              chatTitle ??
              (c.createdDate
                ? DateTime.fromISO(c.createdDate).toRelative()
                : undefined);

            return (
              <ListItem
                key={c.id}
                disablePadding
                sx={{
                  background: c.id === currentChatId ? "#535353" : "unset",
                }}
              >
                <ListItemButton
                  onClick={() => {
                    router.push(`/app/chat/${c.id}`);
                  }}
                >
                  <ListItemText
                    primary={chatTitleFriendly}
                    primaryTypographyProps={{
                      sx: {
                        paddingLeft: "10px",
                        fontStyle: hadManualOrAutoTitle ? "unset" : "italic",
                        //ellipsis if overflow
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        wordWrap: "break-word",
                        fontSize: ".75em",
                      },
                    }}
                  />
                </ListItemButton>
                <IconButton
                  size={"small"}
                  onClick={async () => {
                    const deleteResult = await deleteChat({
                      variables: {
                        filter: {
                          id: { eq: c.id },
                        },
                        atMost: 1,
                      },
                    });

                    if (deleteResult.errors) {
                      console.error(deleteResult.errors);
                    } else {
                      latestQueryResult.refetch();
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </ListItem>
            );
          }) ?? null
        );
      }}
      hasMore={(latestQueryResult) => {
        const ret =
          latestQueryResult.loading ||
          latestQueryResult.data?.chatCollection?.pageInfo.hasNextPage;

        return !!ret;
      }}
    />
  );
}
