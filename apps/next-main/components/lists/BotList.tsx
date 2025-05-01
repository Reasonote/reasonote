"use client";

import React from "react";

import {
  AddCircle,
  Chat,
} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import List from "@mui/material/List";
import {
  ApolloClientInfiniteScroll,
  useBotFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";
import {getBotFlatQueryDoc} from "@reasonote/lib-sdk-apollo-client/src";

import {useRsnUser} from "../../clientOnly/hooks/useRsnUser";

type Bot = {
  id: string;
  name?: string | null | undefined;
  avatarEmoji?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
};

type BotsListProps = {
  onBotClicked?: (botId: string) => void;
  onChatClicked?: (botId: string) => void;
};

function BotListEntry({ botId, onClick, onChatClicked}: { botId: string, onClick?: () => void, onChatClicked?: () => void }) {
  const bot = useBotFlatFragLoader(botId);
  return bot.data ? <BotListEntryStub bot={bot.data} onClick={onClick} onChatClicked={onChatClicked}/> : null;
}

function BotListEntryStub({ bot, onClick, onChatClicked }: { bot: Bot, onClick?: () => void, onChatClicked?: () => void }) {
  return (
    <ListItem key={bot.id}  secondaryAction={
      <IconButton edge="end" aria-label="comments" onClick={onChatClicked}>
        <Badge badgeContent={<AddCircle fontSize="small"/>}>
          <Chat />
        </Badge>
      </IconButton>
    }>
      <ListItemButton onClick={onClick}>
        <ListItemAvatar>
          {/* <AutoAvatar
            name={bot.name ?? ""}
            avatarProps={{
              alt: bot.name ?? "",
              // src: bot.avatarUrl ?? undefined,
              sx: { width: 40, height: 40 },
            }}
          /> */}
          <Avatar sx={{ width: 40, height: 40 }}>
            {bot.avatarEmoji ?? ""}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={<Typography noWrap>{bot.name ?? ""}</Typography>}
          secondary={<Typography noWrap>{bot.description ?? ""}</Typography>}
        />
      </ListItemButton>
    </ListItem>
  );
}

export const BotsList: React.FC<BotsListProps> = ({onBotClicked, onChatClicked}) => {
  // TODO get all bots from the server
  const { rsnUserId } = useRsnUser();

  const sortOrder = "newest";

  const queryOpts = {
    query: getBotFlatQueryDoc,
    variables: {
      filter: {
        createdBy: { eq: rsnUserId },
      },
      first: 12,
    },
  };

  return (
    <List style={{ width: "100%" }}>
      <ApolloClientInfiniteScroll
        wrapperElId={"bot-list-container"}
        inverse={false}
        overrideWrapperElProps={{
          style: {
            display: "flex",
            flexDirection: "column",
            overflowY: "scroll",
            flexGrow: 1,
            height: "100%",
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
        queryOpts={queryOpts}
        fetchMoreOptions={(qResult) => {
          const after = qResult.data?.botCollection?.pageInfo.endCursor;

          const ret = {
            variables: {
              after,
            },
          };

          return ret;
        }}
        getChildren={(latestQueryResult) => {
          const botIds = latestQueryResult.data?.botCollection?.edges.map(
            (e) => e.node.id
          );

          console.log("botIds", botIds?.length);

          const ret = botIds ? (
            botIds.length === 0 ? (
              <Typography variant="caption">No Characters</Typography>
            ) : (
              botIds
                // Filter out spaceAssetIds which are currently converting,
                // As they are shown at the top of the list.
                .map((botId) => {
                  return <BotListEntry key={botId} botId={botId}
                    onClick={() => {
                      onBotClicked?.(botId);
                    }}
                    onChatClicked={() => onChatClicked?.(botId)}
                  />;
                })
            )
          ) : (
            <div>Loading</div>
          );

          return ret;
        }}
        hasMore={(latestQueryResult) => {
          const ret =
            latestQueryResult.loading ||
            latestQueryResult.data?.botCollection?.pageInfo.hasNextPage;

          return !!ret;
        }}
      />
      {/* {bots.map((bot) => (
                
            ))} */}
    </List>
  );
};
