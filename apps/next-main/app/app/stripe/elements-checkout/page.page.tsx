"use client";
import {useEffect} from "react";

import {useCheckoutModal} from "hooks/useCheckoutModal";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {ShimmerLoadingTxt} from "@/components/typography/ShimmerLoadingTxt";
import {
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function StripeElementsCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCheckout, CheckoutModalComponent } = useCheckoutModal();

  useEffect(() => {
    if (!searchParams) {
      router.push('/app/upgrade');
      return;
    }

    const lookupKey = searchParams.get('lookupKey');
    const couponCode = searchParams.get('couponCode');

    if (!lookupKey) {
      router.push('/app/upgrade');
      return;
    }

    openCheckout({
      lookupKey,
      couponCode: couponCode ?? undefined,
    });
  }, [searchParams, openCheckout, router]);

  return (
    <>
      <Container 
        maxWidth="sm" 
        sx={{ 
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'transparent'
          }}
        >
          <Stack spacing={3} alignItems="center">
            <ShimmerLoadingTxt variant="h5" fontWeight="bold">
              Opening Checkout...
            </ShimmerLoadingTxt>
            <Typography variant="body1" color="text.secondary">
              The checkout window should open automatically.
              If it doesn't appear, please try refreshing the page.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/app')}
              sx={{ mt: 2 }}
            >
              Go Home
            </Button>
          </Stack>
        </Paper>
      </Container>
      <CheckoutModalComponent />
    </>
  );
} 