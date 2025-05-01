"use client";
import {
  Mail,
  Snail,
} from "lucide-react";

import {
  Button,
  Card,
  Container,
  Stack,
} from "@mui/material";

import {Txt} from "../typography/Txt";

export function DowntimeFullPage() {
    return (
        <Container>
            <Stack
                height="100dvh"
                alignItems="center"
                justifyContent="center"
                spacing={3}
                sx={{ textAlign: "center" }}
            >
                <Card sx={{padding: 4}}>
                    <Stack spacing={2}>
                        <Stack spacing={2} alignItems="center">
                            <Snail size={24} color="#f44336" />
                            <Txt variant="h4">Reasonote Is Under Maintenance</Txt>
                            <Txt variant="body1" color="text.secondary">
                                We're currently performing some maintenance on our systems.
                            </Txt>
                            <Txt variant="body1" color="text.secondary">
                                We'll be back shortly!
                            </Txt>
                            <Button 
                                startIcon={<Mail size={16} />}
                                variant="contained" 
                                color="gray"
                                href="mailto:support@reasonote.com"
                            >Contact Support</Button>
                        </Stack>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}
