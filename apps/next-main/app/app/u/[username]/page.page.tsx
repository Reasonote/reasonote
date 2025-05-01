"use client";

import {Suspense} from "react";

import {
  Container,
  Paper,
  Stack,
} from "@mui/material";

import {UserProfileHeader} from "./UserProfileHeader";

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return (
      <Container maxWidth="lg" sx={{ width: '100%' }}>
        <Stack spacing={4} py={4} width="100%">
          <Paper elevation={0} sx={{ p: 3, width: '100%' }}>
            <Suspense fallback={<div>Loading profile...</div>}>
              <UserProfileHeader username={params.username} />
            </Suspense>
          </Paper>

          {/* <Paper elevation={0} sx={{ p: 3 }}>
            <Suspense fallback={<div>Loading pinned items...</div>}>
              <UserProfilePinnedItems username={params.username} />
            </Suspense>
          </Paper> */}

          {/* <Paper elevation={0} sx={{ p: 3 }}>
            <Suspense fallback={<div>Loading activity...</div>}>
              <UserProfileActivityGraph username={params.username} />
            </Suspense>
          </Paper> */}
        </Stack>
      </Container>
  );
} 