"use client";
import {useCheckoutModal} from "hooks/useCheckoutModal";

import {
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function ElementsCheckoutTestingPage() {
  const { openCheckout, CheckoutModalComponent } = useCheckoutModal();

  const testScenarios = [
    {
      name: "Basic Monthly Plan",
      lookupKey: process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!,
      description: "Regular monthly subscription with 7-day trial"
    },
    {
      name: "Basic Monthly Plan with Bad Coupon",
      lookupKey: process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!,
      couponCode: "FakeCoupon",
      description: "Monthly subscription with Bad Coupon"
    },
    {
      name: "Basic Monthly Plan with Valid Test Coupon",
      lookupKey: process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!,
      couponCode: process.env.NEXT_PUBLIC_STRIPE_20_OFF_COUPON_CODE,
      description: "Monthly subscription with Valid Test Coupon"
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout Testing Page
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Click the buttons below to test different checkout scenarios.
      </Typography>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {testScenarios.map((scenario, index) => (
          <Paper key={index} sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">
                {scenario.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {scenario.description}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                lookupKey: {scenario.lookupKey}
                {scenario.couponCode && <><br />couponCode: {scenario.couponCode}</>}
              </Typography>

              <Button
                variant="contained"
                onClick={() => openCheckout({
                  lookupKey: scenario.lookupKey,
                  couponCode: scenario.couponCode
                })}
              >
                Test This Scenario
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <CheckoutModalComponent />
    </Container>
  );
} 