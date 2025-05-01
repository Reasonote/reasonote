"use client";
import {useRouter} from "next/navigation";

import {useMutation} from "@apollo/client";
import {
  Chat,
  Gamepad,
} from "@mui/icons-material";
import {
  Avatar,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import {createChatFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

import FullCenter from "../../../components/positioning/FullCenter";
import {vFYPIntent} from "../foryou/FYPState";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export default function Page() {
  const router = useRouter();
  const [createChat] = useMutation(createChatFlatMutDoc);

  const isSmallDevice = useIsSmallDevice()

  const onCreateRandomChat = async () => {
    const resp = await createChat({
      variables: {
        objects: [
          {
            id: null,
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

  const onCreateChat = () => {
    router.push("/app/chat/new");
  };

  const onForyouPage = () => {
    vFYPIntent(null);
    router.push("/app/foryou");
  }

  return (
    <FullCenter>
      <Grid
        container
        spacing={2}
        width="100%"
        height="100%"
        justifyContent="center"
        justifyItems="center"
        alignContent={"center"}
        alignItems="center"
      >
        <Stack sx={{ minWidth: "275px" }} gap={1}>
          <Card elevation={20} sx={{ borderRadius: "20px" }} color="primary">
            <CardActionArea
              sx={{ borderRadius: "20px", padding: "20px" }}
              onClick={() => onCreateChat()}
            >
              <CardContent>
                <Stack direction={"column"} gap={2}>
                  <Stack direction={"row"} gap={2}>
                    <Avatar color="primary">
                      <Chat />
                    </Avatar>
                    <Typography variant={isSmallDevice ? "h6" : "h4"}>
                      New Chat
                    </Typography>
                  </Stack>
                  <Typography variant="body1">Chat with a GPT model to expand your skill library.</Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card elevation={20} sx={{ borderRadius: "20px" }} color="primary">
            <CardActionArea
              sx={{ borderRadius: "20px", padding: "20px" }}
              onClick={() => onForyouPage()}
            >
              <CardContent>
                <Stack direction={"column"} gap={2}>
                  <Stack direction={"row"} gap={2}>
                    <Avatar>
                      <Gamepad />
                    </Avatar>
                    <Typography variant={isSmallDevice ? "h6" : "h4"}>
                      For You
                    </Typography>
                  </Stack>
                  <Typography variant="body1">Activities Designed to engage you!</Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
          {/* <Card elevation={25} sx={{ borderRadius: '20px' }}>
                    <CardActionArea sx={{ borderRadius: '20px', padding: '20px' }} onClick={() => onCreateChat()}>
                        <CardContent>
                            <Stack direction={"column"} gap={2}>
                                <Stack direction={'row'} gap={2}>
                                    <Avatar><Chat /></Avatar>
                                    <Typography variant={isSmallDevice ? 'h6' : 'h4'}>New Chat</Typography>
                                </Stack>
                                <Typography variant="body1">Talk to anyone.</Typography>
                            </Stack>
                        </CardContent>
                    </CardActionArea>
                </Card>
                <Card elevation={25} sx={{ borderRadius: '20px' }}>
                    <CardActionArea sx={{ borderRadius: '20px', padding: '20px' }} onClick={() => onCreateChat()}>
                        <CardContent>
                            <Stack direction={"column"} gap={2}>
                                <Stack direction={'row'} gap={2}>
                                    <Avatar><Chat /></Avatar>
                                    <Typography variant={isSmallDevice ? 'h6' : 'h5'}>Chat From Topic</Typography>
                                </Stack>
                                <Typography variant="body1">Talk to anyone.</Typography>
                            </Stack>
                        </CardContent>
                    </CardActionArea>
                </Card> */}
        </Stack>
        {/* <Grid xs={4}>
                <Card sx={{ borderRadius: '20px' }}>
                    <CardActionArea sx={{ borderRadius: '20px', padding: '20px' }} onClick={() => onCreateChat()}>
                        <CardContent>
                            <Stack direction={"column"} gap={2}>
                                <Stack direction={'row'} gap={2}>
                                    <Avatar><Casino /></Avatar>
                                    <Typography variant="h4">Random Chat</Typography>
                                </Stack>
                                <Typography variant="body1">Talk to anyone.</Typography>
                            </Stack>

                        </CardContent>
                    </CardActionArea>
                </Card>
            </Grid> */}
        {/* <Grid xs={4} minWidth='22vw'>
                <Card sx={{ borderRadius: '20px' }}>
                    <CardActionArea>
                        <CardContent>
                            <Typography variant="h3">New Chat</Typography>
                            <Typography variant="h5" component="div">World</Typography>
                        </CardContent>
                        <CardActions>
                            <Typography variant="body2">Learn More</Typography>
                        </CardActions>
                    </CardActionArea>
                </Card>
            </Grid>
            <Grid xs={4}>
                <Card sx={{ borderRadius: '20px' }}>
                    <CardActionArea>
                        <CardContent>
                            <Typography variant="h3">New Chat</Typography>
                            <Typography variant="h5" component="div">World</Typography>
                        </CardContent>
                        <CardActions>
                            <Typography variant="body2">Learn More</Typography>
                        </CardActions>
                    </CardActionArea>
                </Card>
            </Grid>
            <Grid xs={4}>
                <Card sx={{ borderRadius: '20px' }}>
                    <CardActionArea>
                        <CardContent>
                            <Typography variant="h3">New Chat</Typography>
                            <Typography variant="h5" component="div">World</Typography>
                        </CardContent>
                        <CardActions>
                            <Typography variant="body2">Learn More</Typography>
                        </CardActions>
                    </CardActionArea>
                </Card>
            </Grid>
            <Grid xs={4}>
                <Card sx={{ borderRadius: '20px' }}>
                    <CardActionArea>
                        <CardContent>
                            <Typography variant="h3">New Chat</Typography>
                            <Typography variant="h5" component="div">World</Typography>
                        </CardContent>
                        <CardActions>
                            <Typography variant="body2">Learn More</Typography>
                        </CardActions>
                    </CardActionArea>
                </Card>
            </Grid> */}
      </Grid>
    </FullCenter>
  );
}
