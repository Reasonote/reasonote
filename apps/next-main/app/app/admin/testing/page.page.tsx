
'use client'
import React from "react";

import {useRouter} from "next/navigation";

import FullCenter from "@/components/positioning/FullCenter";

import {
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";

export default function TestingPage() {
    const router = useRouter();
    const isSmallDevice = useIsSmallDevice();

    return <FullCenter>
        <Card sx={{padding: '10px'}}>
            <Stack gap={2} width={isSmallDevice ? '100vw' : '66vw'}>
                <Typography variant={'h4'}>
                    Testing 
                </Typography>
                <Button onClick={() => {
                    router.push('/app/admin/testing/wikipedia')
                }}> 
                    Wikipedia
                </Button>
                <Button onClick={() => {
                    router.push('/app/admin/testing/lesson-creator')
                }}>
                    Lesson Creator
                </Button>
            </Stack>
        </Card>
    </FullCenter>
}