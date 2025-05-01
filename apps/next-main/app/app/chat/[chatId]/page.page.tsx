"use client";
import {useEffect} from "react";

import _ from "lodash";
import {notFound} from "next/navigation";

import Skeleton from "@mui/material/Skeleton";
import {useChatFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {ChatComponent} from "../../../../components/chat/Chat";
import FullCenter from "../../../../components/positioning/FullCenter";

const NUM_AUTOGENERATES = 5;

export default function Web(props: { params: any }) {
  //////////////////////////////////
  const chatId = decodeURIComponent(props.params.chatId);

  //////////////////////////////////
  const {
    data: chat,
    loading: chatLoading,
    error: chatError,
  } = useChatFlatFragLoader(chatId as string);

  useEffect(() => {
    if (!chatLoading || chatError !== undefined) {
      console.log("chatLoading", chatLoading, chatError, chat);
      if (chatError) {
        console.error(chatError);
        notFound();
      } else if (!chat) {
        notFound();
      }
    }
  }, [chatId, chat, chatLoading, chatError]);

  return chatLoading ? (
    <FullCenter>
      <Skeleton>
        {/* TODO actual skeleton loader */}
        <div></div>
      </Skeleton>
    </FullCenter>
  ) : chatError !== undefined ? (
    <div>Error: {chatError?.message}</div>
  ) : chat ? (
    <ChatComponent chatId={chatId} />
  ) : (
    <FullCenter>
      <Skeleton width={"350px"} height={"80vw"} />
    </FullCenter>
  );
}
