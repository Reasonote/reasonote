import {
  useEffect,
  useState,
} from "react";

import _ from "lodash";
import posthog from "posthog-js";

import {CreateSubscriptionRoute} from "@/app/api/cb/create_subscription/_route";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUser} from "@/clientOnly/hooks/useRsnUser";
import {LocalOffer} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {Appearance} from "@stripe/stripe-js";
import {loadStripe} from "@stripe/stripe-js";

// Initialize Stripe with error handling
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
console.log('Stripe Key Status:', stripeKey ? 'Present' : 'Missing');

let stripePromise;
try {
  if (!stripeKey) {
    throw new Error('Stripe publishable key is missing');
  }
  stripePromise = loadStripe(stripeKey);
  console.log('Stripe initialization successful');
} catch (error) {
  console.error('Stripe initialization failed:', error);
  stripePromise = Promise.reject(error);
}

function PaymentFormSkeleton() {
  return (
    <Stack spacing={2} width="100%" sx={{ minHeight: 285, opacity: 0.5 }}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={45}
        sx={{
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={45}
        sx={{
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={45}
        sx={{
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}
      />
    </Stack>
  );
}

function LoadingState() {
  return (
    <Stack spacing={3} alignItems="center" sx={{ opacity: 0.5 }}>
      <Stack spacing={2} alignItems="center">
        {/* <Skeleton variant="text" width={280} height={40} /> */}
        {/* <Skeleton variant="text" width={180} height={32} /> */}
      </Stack>
      <PaymentFormSkeleton />
      {/* <Skeleton variant="rectangular" width="100%" height={72} sx={{ borderRadius: 2 }} /> */}
    </Stack>
  );
}

function CheckoutForm({ formattedPrice, interval, priceInfo }: { 
  formattedPrice: string, 
  interval: string, 
  priceInfo: { priceId: string } 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { refresh: refreshUser } = useRsnUser();
  const { refetch: refreshLicense } = useReasonoteLicense();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elementStatus, setElementStatus] = useState<'initializing' | 'loading' | 'ready' | 'error'>('initializing');

  useEffect(() => {
    if (stripe && elements) {
      console.log('Stripe and Elements are ready');
      setElementStatus('loading');
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Submit handler started');

    if (!stripe || !elements || elementStatus !== 'ready') {
      console.log('Submit blocked:', { 
        stripeAvailable: !!stripe, 
        elementsAvailable: !!elements, 
        elementStatus,
        stripe,
        elements 
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting setup confirmation...');
      // First confirm the setup intent
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const resp = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/app/checkout/success`,
        },
        redirect: 'if_required',
      });

      console.log('Setup intent response:', resp);

      if (resp.error) {
        console.error('Setup intent error:', resp.error);
        throw resp.error;
      }

      // Create the subscription with the confirmed payment method
      const setupIntent = resp.setupIntent;
      if (!setupIntent) {
        throw new Error('Setup intent is missing');
      }

      console.log('Creating subscription...');
      const response = await CreateSubscriptionRoute.call({
        paymentMethodId: _.isString(setupIntent.payment_method) ? setupIntent.payment_method : setupIntent.payment_method?.id ?? '',
        priceId: priceInfo.priceId,
      });

      console.log('Create subscription response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create subscription');
      }

      const data = response.data;
      console.log('Create subscription data:', data);

      // Refresh user and license data
      console.log('Refreshing user and license data...');
      await Promise.all([
        refreshUser(),
        refreshLicense(),
      ]);

      console.log('Redirecting to success page...');
      window.location.href = `${window.location.origin}/app/checkout/success?subscription_id=${data?.subscriptionId}`;
    } catch (err) {
      console.error('Payment error:', err);
      const msg = _.get(err, 'message', 'An unexpected error occurred');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <Stack spacing={3}>
        <PaymentFormSkeleton />
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* 
          IMPORTANT NOTE: ph-no-capture class is needed to prevent Posthog from screen recording the PaymentElement which is sensitive information
          
          See: https://posthog.com/docs/product-analytics/privacy
        */}
        <div className="ph-no-capture" style={{ minHeight: 285 }}>
          <PaymentElement
            onReady={() => {
              console.log('PaymentElement is ready');
              setElementStatus('ready');
            }}
            onLoaderStart={() => {
              console.log('PaymentElement is loading');
              setElementStatus('loading');
            }}
            onChange={(event) => {
              console.log('PaymentElement changed:', event);
              if ('error' in event && event.error) {
                setElementStatus('error');
                //@ts-ignore
                setError(event.error.message);
              } else {
                setElementStatus('ready');
              }
            }}
            onLoadError={(event) => {
              console.error('PaymentElement load error:', event);
              setElementStatus('error');
              if ('error' in event && event.error) {
                setError(event.error.message ?? 'An unexpected error occurred.');
              }
            }}
          />
        </div>

        {error && (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {elementStatus === 'loading' && <PaymentFormSkeleton />}


        <Stack direction="column" spacing={1} alignItems="center">
          <Button
            variant="contained"
            type="submit"
            disabled={elementStatus !== 'ready' || loading}
            sx={{ mt: 2, textTransform: 'none', py: 2 }}
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Stack alignItems="center" spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', width: '100%' }}>
                  Start Free Trial
                </Typography>

              </Stack>
            )}
          </Button>
          <Typography variant="caption" align="center">
            7 days free, then {formattedPrice}/{interval}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" align="center">
          You won't be charged during the trial period. <br />You can cancel anytime.
        </Typography>
      </Stack>
    </form>
  );
}

interface StripeElementsCheckoutProps {
  clientSecret: string;
  priceInfo: {
    unitAmount: number;
    currency: string;
    interval: string;
    originalAmount?: number;
    discountAmount?: number;
    discountName?: string;
    productName?: string;
    priceId: string;
  };
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export default function StripeElementsCheckout({ clientSecret, priceInfo }: StripeElementsCheckoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const options = {
    clientSecret,
    appearance: {
      theme: theme.stripeTheme,
      variables: {
        colorPrimary: '#1A6F5F',
        fontSizeBase: isMobile ? '14px' : '16px',
        spacingUnit: isMobile ? '3px' : '4px',
        borderRadius: '8px',
      },
    } satisfies Appearance,
  };

  useEffect(() => {
    posthog.capture('checkout_started', {
      price_id: priceInfo.priceId,
      product_name: priceInfo.productName,
      currency: priceInfo.currency,
      interval: priceInfo.interval,
      original_amount: priceInfo.originalAmount,
      discount_amount: priceInfo.discountAmount,
      discount_name: priceInfo.discountName,
    });
  }, []);
  

  // Calculate the discounted price if both originalAmount and discountAmount are present
  const displayPrice = priceInfo.originalAmount && priceInfo.discountAmount
    ? priceInfo.originalAmount - priceInfo.discountAmount
    : priceInfo.unitAmount;

  const formattedPrice = formatPrice(displayPrice, priceInfo.currency);
  const formattedOriginalPrice = priceInfo.originalAmount
    ? formatPrice(priceInfo.originalAmount, priceInfo.currency)
    : null;

  if (!clientSecret) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingState />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Stack spacing={isMobile ? 2 : 3} alignItems="center" width="100%">
        <Stack direction="column" spacing={1} alignItems="center" width="100%">
        <Typography
          variant={isMobile ? "h6" : "h4"}
          align="center"
          sx={{
            mb: isMobile ? 0 : 1,
            fontWeight: 'bold'
          }}
        >
          Start Learning.
        </Typography>

        <Paper 
          elevation={0} 
          sx={{ 
            p: isMobile ? 1 : 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            width: '100%'
          }}
        >
          <Stack spacing={isMobile ? 1.5 : 2} alignItems="center" width="100%">
            {priceInfo.productName && (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" width="100%">
                <Typography
                  variant={isMobile ? "h6" : "h4"}
                  align="center"
                  sx={{
                    fontSize: isMobile ? '1.4rem' : undefined
                  }}
                >
                  Reasonote
                </Typography>
                {priceInfo.productName.includes('Basic') && (
                  <Chip
                    label="Basic"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      '& .MuiChip-label': {
                        fontSize: isMobile ? '0.75rem' : undefined,
                        fontWeight: 'bold'
                      }
                    }}
                  />
                )}
              </Stack>
            )}

            {formattedOriginalPrice && !isMobile && (
              <Typography
                variant={isMobile ? "caption" : "body2"}
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formattedOriginalPrice}/{priceInfo.interval}
              </Typography>
            )}

            {priceInfo.discountName && (
              <Chip
                icon={<LocalOffer sx={{ fontSize: isMobile ? '0.9rem' : undefined }} />}
                color="secondary"
                label={priceInfo.discountName}
                size={isMobile ? "small" : "medium"}
                sx={{
                  zoom: isMobile ? 0.8 : 1,
                  borderRadius: '8px',
                  backgroundColor: '#8B5CF6',
                  '& .MuiChip-icon': {
                    color: 'white'
                  },
                  '& .MuiChip-label': {
                    fontSize: isMobile ? '0.7rem' : '1rem',
                    fontWeight: 'bold'
                  },
                  color: 'white'
                }}
              />
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: isMobile ? '1rem' : '1.4rem'
                }}
                fontWeight="bold"
              >
                {formattedPrice}
              </Typography>
              <Typography
                variant={isMobile ? "body2" : "body1"}
                color="text.secondary"
              >
                / {priceInfo.interval}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
        </Stack>

        <Elements key={clientSecret} stripe={stripePromise} options={options}>
          <CheckoutForm
            formattedPrice={formattedPrice}
            interval={priceInfo.interval}
            priceInfo={{ priceId: priceInfo.priceId }}
          />
        </Elements>
      </Stack>
    </div>
  );
} 