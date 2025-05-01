
'use client'
import React, {useState} from "react";

import {useRouter} from "next/navigation";

import FullCenter from "@/components/positioning/FullCenter";

import {useApolloClient} from "@apollo/client";
import {
  Button,
  Card,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  getRsnUserFlatQueryDoc,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

import {UserCard} from "./UserCard";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export default function AddBetaUserPage() {
    const [email, setEmail] = useState<string>('')
    const [issue, setIssue] = useState<{severity: 'warning' | 'error' | 'info', message: string | React.ReactNode} | null>(null);
    const ac = useApolloClient();
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();

    return <FullCenter>
        <Card sx={{padding: '10px'}}>
            <Stack gap={2} width={isSmallDevice ? '100vw' : '66vw'}>
                <Typography variant={'h4'}>
                    Users
                </Typography>
                <Button onClick={() => {
                    router.push('/app/admin/users/add-beta-user')
                }}> 
                    Add Beta User
                </Button>
                <Typography variant={'h4'}>
                    Users List
                </Typography>
                <ApolloClientInfiniteScroll
                    wrapperElId="notification-infinite-scroll-component-id"
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
                        query: getRsnUserFlatQueryDoc,
                        variables: {
                            filter: {},
                            first: 6,
                            orderBy: {
                                lastLoginDate: OrderByDirection.DescNullsLast,
                            }
                        },
                    }}
                    fetchMoreOptions={(qResult) => {
                        return {
                            variables: {
                            after:
                                qResult.data?.rsnUserCollection?.pageInfo.endCursor ||
                                undefined,
                            },
                        };
                    }}
                    getChildren={(latestQueryResult) => {
                        const users = latestQueryResult.data?.rsnUserCollection?.edges.map(
                            (edge) => edge.node
                        );

                        return <Stack gap={1}>
                            {users
                                ? users.map((user) => 
                                    <UserCard userId={user.id ?? ''}/>
                                )
                                : null
                            }
                        </Stack>
                    }}
                    hasMore={(latestQueryResult) => {
                    const ret =
                        latestQueryResult.loading ||
                        latestQueryResult.data?.rsnUserCollection?.pageInfo.hasNextPage;
                    return !!ret;
                    }}
                />
            </Stack>
        </Card>
    </FullCenter>
}