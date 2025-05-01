"use client"
import _ from "lodash";

import {ArrowForwardIos} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

export interface InterestsTabContentProps {
    onNext?: () => void;
}

export function WelcomeTabContent({onNext}: InterestsTabContentProps){
    return <Stack height={'80vh'} padding={'10px'} gap={2} justifyContent={'center'} width={'100%'} alignItems={'center'}>
        <Card elevation={20} sx={{width: 'fit-content'}}>
            <CardContent>
                <Typography variant={'h5'}>👋 Welcome to Reasonote!</Typography>
                <br/>
                <Typography variant={'body1'}>We're excited to have you here. 😊 </Typography>
                <br/>
                <Typography variant="body1">Let's get started by selecting some interests.</Typography>
            </CardContent>
        </Card>

        {/* The bottom confirm button should never shrink */}
        <Stack flex={'0 0 auto'} alignItems={'end'} justifyContent={'center'} gap={2}>
            <Button
                size="large"
                onClick={() => {
                    onNext?.();
                }}
                variant={'contained'}
                endIcon={<ArrowForwardIos fontSize="small"/>}
            >
                Next
            </Button>
        </Stack>
    </Stack>
}