"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";

import CancelIcon from "@mui/icons-material/Cancel";
import FeedbackIcon from "@mui/icons-material/Feedback";
import HomeIcon from "@mui/icons-material/Home";
import TwitterIcon from "@mui/icons-material/Twitter";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import FullCenter from "../../../../components/positioning/FullCenter";

export default function CheckoutCancel() {
  const router = useRouter();

  const handleFeedback = () => {
    window.open('https://forms.gle/7CyC6E2Df2DQE17r7', '_blank');
  };

  return (
    <FullCenter>
      <Paper elevation={15}>
        <Stack padding={"24px"} spacing={2} alignItems="center">
          <CancelIcon color="error" sx={{ fontSize: 64 }} />
          <Typography variant="h4" align="center">{`Checkout Cancelled`}</Typography>
          <Typography variant="body1" align="center">{`We're sad to see you go.`}</Typography>
          <Typography variant="body1" align="center">
            {`Please let us know how we can improve:`}
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FeedbackIcon />}
              onClick={handleFeedback}
            >
              Send Feedback
            </Button>
            <Button
              variant="outlined"
              startIcon={<TwitterIcon />}
              component={Link}
              href="https://twitter.com/reasonote"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/app')}
          >
            Back to Home
          </Button>
        </Stack>
      </Paper>
    </FullCenter>
  );
}
