import {useEffect} from "react";

import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import {
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";

import MobileContent from "../positioning/mobile/MobileContent";
import MobileContentMain from "../positioning/mobile/MobileContentMain";

export function NotFoundPage() {
    const router = useRouter();

    useEffect(() => {
        posthog.capture('view_not_found_page', {
            path: window.location.pathname
        })
    }, []);
    
    return <MobileContent>
    <MobileContentMain>
        <Stack height="100%" width="100%" alignContent={'center'} justifyContent={'center'} alignItems={'center'} justifyItems={'center'} spacing={2}>
            <Card elevation={10}>
                <Stack gap={2} alignItems={'center'}>
                <Typography variant={'h4'}>Not Found</Typography>
                <Typography>
                    The page you are looking for does not exist, or you may not have access to view it.
                </Typography>
                <Button onClick={() => router.push('/app')}>Go Home</Button>
            </Stack>
            </Card>
        </Stack>
    </MobileContentMain>
</MobileContent>
}