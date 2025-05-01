"use client";
import {
  useEffect,
  useState,
} from "react";

import useThrottledCallback from "beautiful-react-hooks/useThrottledCallback";
import {motion} from "framer-motion";
import Link from "next/link";

import {useAcUpdateHelper} from "@/clientOnly/hooks/useAcUpdateHelper";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {ActivityHeatmap} from "@/components/activity/ActivityHeatmap";
import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {CurUserAvatar} from "@/components/users/profile/CurUserAvatar";
import {useMutation} from "@apollo/client";
import {
  Card,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  createUserSettingFlatMutDoc,
  getUserSettingFlatQueryDoc,
  updateRsnUserFlatMutDoc,
  updateUserSettingFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client/src";

import {useRsnUser} from "../../../clientOnly/hooks/useRsnUser";
import {UserFeelingsList} from "./UserFeelingsList";

export default function AccountPage() {
  const theme = useTheme();
  const { rsnUser, sbSession, sbUser } = useRsnUser();
  const isSmallDevice = useIsSmallDevice();

  const [rsnUserUpdate] = useMutation(updateRsnUserFlatMutDoc);
  const [userSettingInsert] = useMutation(createUserSettingFlatMutDoc);
  const [userSettingUpdate] = useMutation(updateUserSettingFlatMutDoc);
  const [firstNameState, setFirstNameState] = useState(
    rsnUser.data?.givenName ?? ""
  );
  const [lastNameState, setLastNameState] = useState(
    rsnUser.data?.familyName ?? ""
  );
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (firstNameState === "") {
      setFirstNameState(rsnUser.data?.givenName ?? "");
    }
  }, [rsnUser.data?.givenName, rsnUser.data?.familyName]);

  useEffect(() => {
    if (lastNameState === "") {
      setLastNameState(rsnUser.data?.familyName ?? "");
    }
  }, [rsnUser.data?.givenName, rsnUser.data?.familyName]);

  const updateFirstName = async (name: string) => {
    setFirstNameState(name);
    await updateFirstNameThrottled(name);
  };

  const updateLastName = async (name: string) => {
    setLastNameState(name);
    await updateLastNameThrottled(name);
  };

  const updateLastNameThrottled = useThrottledCallback(
    async (name: string) => {
      const { data, errors } = await rsnUserUpdate({
        variables: {
          set: {
            familyName: name,
          },
          filter: {
            id: { eq: rsnUser.data?.id },
          },
          atMost: 1,
        },
      });

      if (errors && errors.length > 0) {
        console.error(errors);
      }
    },
    [rsnUser.data?.familyName, rsnUser.data?.id],
    1000
  );

  const updateFirstNameThrottled = useThrottledCallback(
    async (name: string) => {
      const { data, errors } = await rsnUserUpdate({
        variables: {
          set: {
            givenName: name,
          },
          filter: {
            id: { eq: rsnUser.data?.id },
          },
          atMost: 1,
        },
      });

      if (errors && errors.length > 0) {
        console.error(errors);
      }
    },
    [rsnUser.data?.givenName, rsnUser.data?.id],
    1000
  );

  const {
    data: aiAboutMe,
    updater: setAiAboutMe,
    queryResult,
  } = useAcUpdateHelper({
    queryOpts: {
      query: getUserSettingFlatQueryDoc,
      variables: {
        filter: {
          rsnUser: { eq: rsnUser.data?.id },
        },
      },
    },
    updateFn: async (value: string, obj) => {
      const refetched = await queryResult.refetch();

      if (refetched.data.userSettingCollection?.edges?.length === 0) {
        await userSettingInsert({
          variables: {
            objects: [
              {
                aiAboutMe: value,
                rsnUser: rsnUser.data?.id,
              },
            ],
          },
        });
      } else {
        const itemId =
          refetched.data.userSettingCollection?.edges?.[0]?.node?.id;

        if (!itemId) {
          console.error(`No item id found for user setting`);
          return;
        }

        await userSettingUpdate({
          variables: {
            set: {
              aiAboutMe: value,
            },
            filter: {
              id: { eq: itemId },
            },
            atMost: 1,
          },
        });
      }
    },
    statePopulator: (obj) =>
      obj?.userSettingCollection?.edges?.[0]?.node?.aiAboutMe ?? "",
    resetDeps: [rsnUser.data?.id],
    throttleWait: 1000,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <MainMobileLayout>
      <MobileContentMain>
        <Stack
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            height: '100%',
            overflowY: 'auto',
            pb: 4,
          }}
        >
          {sbSession === null ? (
            <Typography variant="h5">
              You are not logged in. <Link href="/app/login">Log In?</Link>
            </Typography>
          ) : rsnUser.loading ? (
            <Skeleton>
              <Card sx={{ minWidth: "350px", width: "80%" }} />
            </Skeleton>
          ) : (
            <Stack
              component={motion.div}
              layout
              direction="column"
              gap={3}
              sx={{ maxWidth: '800px', mx: 'auto', width: '100%', px: 2 }}
            >
              <Typography
                component={motion.h4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                variant="h4"
              >
                Your Profile
              </Typography>

              <Stack gap={2}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <ActivityHeatmap maxDays={isSmallDevice ? 130 : 300} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card elevation={10}>
                    <Stack direction="row" padding={2} gap={2}>
                      <CurUserAvatar />
                      <Stack>
                        <Typography variant="h6">
                          {firstNameState} {lastNameState}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sbSession?.session?.user?.email}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      variant="fullWidth"
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                          py: 2
                        }
                      }}
                    >
                      <Tab label="Basic Information" />
                      <Tab label="AI Information" />
                    </Tabs>

                    <Stack
                      component={motion.div}
                      layout
                      padding={3}
                      gap={3}
                      minHeight="300px"
                    >
                      {activeTab === 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Stack gap={2}>
                            <Typography variant="h5">Basic Information</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Tell us about yourself.
                            </Typography>
                            <TextField
                              label="First Name"
                              value={firstNameState}
                              onChange={(ev) => updateFirstName(ev.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Last Name"
                              value={lastNameState}
                              onChange={(ev) => updateLastName(ev.target.value)}
                              fullWidth
                            />
                          </Stack>
                        </motion.div>
                      )}

                      {activeTab === 1 && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Stack gap={2}>
                            <Typography variant="h5">AI Information</Typography>
                            <Typography variant="caption" color="text.secondary">
                              This information is passed on to our AI systems to help them serve you better.
                            </Typography>
                            <TextField
                              label="AI About Me"
                              value={aiAboutMe}
                              multiline
                              rows={4}
                              onChange={(ev) => setAiAboutMe(ev.target.value)}
                              fullWidth
                            />
                            <Typography variant="h6">
                              Your Interests
                            </Typography>
                            <UserFeelingsList />
                          </Stack>
                        </motion.div>
                      )}
                    </Stack>
                  </Card>
                </motion.div>
              </Stack>
            </Stack>
          )}
        </Stack>
      </MobileContentMain>
    </MainMobileLayout>
  );
}
