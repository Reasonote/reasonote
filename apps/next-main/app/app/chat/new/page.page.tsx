"use client";

import {useRouter} from "next/navigation";

import {ChooseChat} from "@/components/chat/ChooseChat/ChooseChat";
import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import MobileContent from "@/components/positioning/mobile/MobileContent";

var creating = false;

export default function NewChatSimple() {
  const router = useRouter();
  // const [createChat] = useMutation(createChatFlatMutDoc);
  // const [error, setError] = useState<Error | null>(null);

  // useAsyncEffect(async () => {
  //   if (creating) {
  //     return;
  //   }
  //   creating = true;
  //   var newChat: { id: string } | undefined = undefined;

  //   try {
  //     console.log("Creating new chatroom");
  //     // Create the new chatroom
  //     const result = await createChat({
  //       variables: {
  //         objects: [
  //           {
  //             isPublic: false,
  //           },
  //         ],
  //       },
  //     });

  //     // Get the new chatroom's ID
  //     newChat = result.data?.insertIntoChatCollection?.records[0];

  //     if (!newChat) {
  //       setError(new Error(`Failed to create new chatroom`));
  //       return;
  //     }
  //   } finally {
  //     creating = false;
  //   }

  //   // Redirect to the new chatroom
  //   if (newChat) {
  //     router.push(`/app/chat/${newChat.id}`);
  //   }
  // }, []);

  return (
    <MainMobileLayout>
      <MobileContent>
        <ChooseChat onChatChosen={(chatId: string) => {
          router.push(`/app/chat/${chatId}`);
        }}/>
      </MobileContent>
    </MainMobileLayout>
   
  );
}
