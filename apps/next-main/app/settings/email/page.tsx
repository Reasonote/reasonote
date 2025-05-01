'use client';

import React from "react";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {
  Container,
  Typography,
} from "@mui/material";

import EmailSubscriptionForm from "../../components/EmailSubscriptionForm";

export default function EmailSettingsPage() {
  const { rsnUserId } = useRsnUser();

  if (!rsnUserId) {
    return (
      <Container maxWidth="sm">
        <Typography variant="body1">
          Please sign in to manage your email settings.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Email Settings
      </Typography>
      <EmailSubscriptionForm />
    </Container>
  );
}