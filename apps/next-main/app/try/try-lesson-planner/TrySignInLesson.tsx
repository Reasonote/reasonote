import {useCallback} from "react";

import {Lock} from "lucide-react";
import {useRouter} from "next/navigation";

import {Txt} from "@/components/typography/Txt";
import {
  Button,
  Card,
  Stack,
} from "@mui/material";

export default function TrySignInLesson() {
    const router = useRouter();
    const signIn = useCallback(() => {
        router.push("/app/login");
    }, []);

    return (
        <Stack>
            <Card elevation={3}>
                <Stack alignItems="center" justifyContent="center" gap={2}>
                    <Txt startIcon={<Lock />} variant="h6">Login or Sign Up to continue this lesson</Txt>
                    <Txt variant="body1">
                        Join the community to build, share, and learn with others.
                    </Txt>
                    <Button variant="contained" color="primary" onClick={() => {
                        signIn()
                    }}>
                        Login / Sign Up
                    </Button>
                </Stack>
            </Card>
        </Stack>
    )
}