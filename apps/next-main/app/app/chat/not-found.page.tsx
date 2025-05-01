"use client";
import {
  useEffect,
  useState,
} from "react";

import {useMutation} from "@apollo/client";
import {
  Button,
  Card,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client/src";

const Component = () => {
  const [createChat] = useMutation(createChatFlatMutDoc);

  const onCreateChat = async () => {
    const resp = await createChat({
      variables: {
        objects: [
          {
            isPublic: false,
          },
        ],
      },
    });

    const { data, errors } = resp;

    if (errors && errors.length > 0) {
      console.error(`Error creating chat`, errors);
    }

    if (data && data.insertIntoChatCollection) {
      const newId = data.insertIntoChatCollection.records[0].id;

      if (newId) {
        window.location.href = `/app/chat/${newId}`;
      }
    }
  };

  return (
    <Stack
      sx={{ height: "100%", width: "100%" }}
      justifyItems={"center"}
      justifyContent={"center"}
      alignItems={"center"}
      alignContent={"center"}
    >
      <Card sx={{ padding: "10px" }}>
        <Stack
          justifyItems={"center"}
          justifyContent={"center"}
          alignItems={"center"}
          alignContent={"center"}
          gap={1}
        >
          <Typography variant={'caption'}>We went looking but...</Typography>
          <Typography variant={"h3"}>Chat Not Found</Typography>

          <Divider/>
          <Typography variant={"h5"}>Create a new one?</Typography>
          <Button onClick={() => onCreateChat()} variant={"contained"}>
            New Chat
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
};

//////////////////////////////////////////////
// The actual exported page.
export default function Web() {
  // This is my way of doing NoSSR.
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  return <>{domLoaded && <Component />}</>;
}
