"use client";
import {useState} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {useStripeCheckoutBrowser} from "@/utils/stripe/checkoutBrowser";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import FeedbackIcon from "@mui/icons-material/Feedback";
import LoginIcon from "@mui/icons-material/Login";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Typography,
} from "@mui/material";
import {
  useAsyncEffect,
  useStateWithRef,
} from "@reasonote/lib-utils-frontend";

export default function StripeCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rsnUserId, userStatus } = useRsnUser();
  const { stripeCheckoutBrowser } = useStripeCheckoutBrowser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSentUserToStripe, setHasSentUserToStripe, hasSentUserToStripeRef] = useStateWithRef(false);
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);

  useAsyncEffect(async () => {
    if (searchParams && userStatus === 'logged_in' && rsnUserId && !hasSentUserToStripeRef.current) {
      setHasSentUserToStripe(true);
      const params = Object.fromEntries(searchParams.entries());
      try {
        await stripeCheckoutBrowser([params as any]);
        setCheckoutInitiated(true);
      } catch (error) {
        console.error("Error creating checkout session:", error);
        if (error instanceof Error && error.message.includes("[ZOD]: Failed to parse request body")) {
          setError("Your checkout session was malformatted. Please send us feedback or contact us, and we'll get back to you as soon as possible.");
        } else {
          setError("Failed to create checkout session. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    } else if (userStatus === 'anonymous' || userStatus === 'unknown') {
      setIsLoading(false);
    }
  }, [userStatus, rsnUserId, searchParams, stripeCheckoutBrowser]);

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your checkout...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FeedbackIcon />}
            sx={{ mr: 2, mb: 2 }}
            component={Link}
            href="/app/feedback"
          >
            Send Feedback
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EmailIcon />}
            sx={{ mb: 2 }}
            component={Link}
            href="mailto:support@reasonote.com"
          >
            Contact Us
          </Button>
          <Typography variant="body2" sx={{ mt: 2 }}>
            You can also email us at: <a href="mailto:support@reasonote.com">support@reasonote.com</a>
          </Typography>
        </Paper>
      </Container>
    );
  }


  if (checkoutInitiated) {
    return (
      <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Checkout Initiated
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            The checkout process has been opened in a new window. If you don't see it, please check your browser's pop-up settings.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<OpenInNewIcon />}
            size="large"
            onClick={() => {
              // Re-initiate the checkout process
              const params = Object.fromEntries(searchParams?.entries() ?? []);
              stripeCheckoutBrowser([params as any]);
            }}
          >
            Open Checkout Again
          </Button>
        </Paper>
      </Container>
    );
  }
  else if (hasSentUserToStripe) {
    return (
      <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your checkout...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (userStatus === 'anonymous' || userStatus === 'unknown') {
    return (
      <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Please log in to complete your purchase
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You need to be logged in to access the checkout process.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<LoginIcon />}
            size="large"
            onClick={() => {
              const currentUrl = window.location.href;
              router.push(`/app/login?redirectTo=${encodeURIComponent(currentUrl)}`);
            }}
          >
            Log In
          </Button>
        </Paper>
      </Container>
    );
  }

  return <Container maxWidth="sm" sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Preparing your checkout...
      </Typography>
    </Paper>
  </Container>;
}