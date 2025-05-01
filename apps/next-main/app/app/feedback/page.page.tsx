"use client";
import {useEffect} from "react";

import {useRouter} from "next/navigation";

import {
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";

export default function FeedbackPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('https://forms.gle/7CyC6E2Df2DQE17r7');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">
          Redirecting you to our feedback form...
        </Typography>
      </Paper>
    </Container>
  );
}