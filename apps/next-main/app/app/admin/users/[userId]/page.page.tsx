'use client'
import React, { useState } from "react";

import { DateTime } from "luxon";
import { useRouter } from "next/navigation";

import { useRouteParams } from "@/clientOnly/hooks/useRouteParams";
import FullCenter from "@/components/positioning/FullCenter";
import {
  Box,
  Card,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  useRsnUserFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

import { ActivitiesTab } from "./ActivitiesTab";
import { AddUserToBetaButton } from "./AddUserToBetaButton";
import { LessonsTab } from "./LessonsTab";
import { PodcastsTab } from "./PodcastsTab";
import { SkillsTab } from "./SkillsTab";
import { UserHistoryTab } from "./UserHistoryTab";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function UserAdminPage({ params }: { params: { userId: string } }) {
    const userId = useRouteParams(params, 'userId');
    const userResult = useRsnUserFlatFragLoader(userId);
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <FullCenter>
            <Card sx={{ padding: '10px', width: isSmallDevice ? '100vw' : '80vw', maxHeight: '90vh', overflowY: 'auto' }}>
                <Typography variant={'h6'}>User</Typography>
                {userResult.loading ? (
                    <div>Loading...</div>
                ) : (
                    <div>
                        <div>{userResult.data?.givenName} {userResult.data?.familyName}</div>
                        <div>{userResult.data?.authEmail}</div>
                        <div>Last Seen: <b>{DateTime.fromISO(userResult.data?.lastLoginDate).toRelative()}</b></div>
                        {userId && <AddUserToBetaButton userId={userId} />}
                    </div>
                )}

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="user data tabs">
                        <Tab label="Skills" />
                        <Tab label="Lessons" />
                        <Tab label="Activities" />
                        <Tab label="User History" />
                        <Tab label="Podcasts" />
                    </Tabs>
                </Box>

                {userId && (
                    <>
                        <TabPanel value={tabValue} index={0}>
                            <SkillsTab userId={userId} />
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <LessonsTab userId={userId} />
                        </TabPanel>
                        <TabPanel value={tabValue} index={2}>
                            <ActivitiesTab userId={userId} />
                        </TabPanel>
                        <TabPanel value={tabValue} index={3}>
                            <UserHistoryTab userId={userId} />
                        </TabPanel>
                        <TabPanel value={tabValue} index={4}>
                            <PodcastsTab userId={userId} />
                        </TabPanel>
                    </>
                )}
            </Card>
        </FullCenter>
    );
}