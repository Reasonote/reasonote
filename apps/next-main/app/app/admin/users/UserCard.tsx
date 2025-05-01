import {DateTime} from "luxon";
import {useRouter} from "next/navigation";

import {useQuery} from "@apollo/client";
import {Login} from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import {GetRsnUserSysdataFlatDocument} from "@reasonote/lib-sdk-apollo-client";
import {useRsnUserFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {JSONSafeParse} from "@reasonote/lib-utils";

export function UserCard({ userId }: { userId: string }) {
    const user = useRsnUserFlatFragLoader(userId);
    // Check if the user is already a beta user
    const userSysdataRes = useQuery(GetRsnUserSysdataFlatDocument, {
        variables: {
            filter: {
                rsnUserId: {
                    eq: userId
                }
            },
        }
    })

    const isBetaUser = JSONSafeParse(userSysdataRes.data?.rsnUserSysdataCollection?.edges[0]?.node?.extraLicenseInfo ?? "{}").data["Reasonote-Beta"] ?? false;

    const hasCompletedOnboarding = userSysdataRes.data?.rsnUserSysdataCollection?.edges[0]?.node?.hasOnboarded ?? false;


    const router = useRouter();


    return <Card sx={{
        width: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }}>
        <CardActionArea
            sx={{
                borderRadius: "20px", padding: "5px"
            }}
            onClick={() => router.push(`/app/admin/users/${userId}`)}
        >
            <CardContent>
                <Stack gap={1}>
                    <Stack direction={'row'} gap={1}>
                        <Stack>
                            <Typography variant={'h5'}>
                                {user.data?.givenName} {user.data?.familyName}
                            </Typography>
                            <Typography>
                                {user.data?.authEmail}
                            </Typography>
                            {user.data?.lastLoginDate &&
                                <Stack>
                                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                                        <Login />
                                        <Typography variant={'h6'}>
                                            Last Login
                                        </Typography>
                                    </Stack>
                                    <Typography>
                                        {DateTime.fromISO(user.data?.lastLoginDate).toRelative()}
                                    </Typography>
                                </Stack>
                            }
                            <Grid2 gap={1}>
                                {
                                    isBetaUser &&
                                    <Chip label={'Beta Access'} color={'primary'} size={'small'} />
                                }
                                {
                                    hasCompletedOnboarding &&
                                    <Chip label={'Onboarded'} color={'primary'} size={'small'} />

                                }
                            </Grid2>
                        </Stack>

                    </Stack>

                </Stack>
            </CardContent>


        </CardActionArea>
    </Card>
}