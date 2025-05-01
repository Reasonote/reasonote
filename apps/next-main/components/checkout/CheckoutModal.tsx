import {
  useEffect,
  useState,
} from "react";

import posthog from "posthog-js";

import {
  CreatePaymentIntentRoute,
} from "@/app/api/cb/create_payment_intent/_route";
import RsnDialog from "@/components/dialogs/RsnDialog";
import {
  DialogContent,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import StripeElementsCheckout from "./StripeElementsCheckout";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  lookupKey: string;
  couponCode?: string;
}

function CheckoutSkeleton() {
  const theme = useTheme();

  return (
    <Stack spacing={3} alignItems="center" sx={{ opacity: 0.5 }}>
      <Typography 
        variant="h5" 
        sx={{
          pb: 2,
          background: `linear-gradient(
              90deg, 
              ${theme.palette.grey[500]} 0%, 
              ${theme.palette.grey[500]} 45%, 
              ${theme.palette.common.white} 50%, 
              ${theme.palette.grey[500]} 55%, 
              ${theme.palette.grey[500]} 100%
          )`,
          backgroundSize: '200% auto',
          animation: 'flow 2s linear infinite',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          '@keyframes flow': {
              '0%': {
                  backgroundPosition: '100% center',
              },
              '100%': {
                  backgroundPosition: '-100% center',
              },
          },
        }}
      >
        Preparing your checkout...
      </Typography>

      <Stack spacing={2} alignItems="center">
        <Skeleton variant="text" width={280} height={40} />
        <Skeleton variant="text" width={180} height={32} />
      </Stack>

      <Stack spacing={2} width="100%" sx={{ minHeight: 285 }}>
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

      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height={72} 
        sx={{ 
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }} 
      />
    </Stack>
  );
}

export function CheckoutModal({ open, onClose, lookupKey, couponCode }: CheckoutModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [priceInfo, setPriceInfo] = useState<any>(null);
  const isMobile = useMediaQuery('(max-width: 600px)');

  useEffect(() => {
    posthog.capture('checkout_modal_opened', {
      lookup_key: lookupKey,
      coupon_code: couponCode,
    }, { send_instantly: true });
  }, [lookupKey, couponCode]);
  
  useEffect(() => {
    async function createPaymentIntent() {
      if (!open) return;
      
      try {
        const { data, error } = await CreatePaymentIntentRoute.call({
          lookupKey,
          ...(couponCode ? { couponCode } : {}),
        });
        
        if (error || !data?.clientSecret) {
          throw error || new Error("No client secret returned from server");
        }
        
        setClientSecret(data.clientSecret);
        setPriceInfo(data.priceInfo);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        setError(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    }

    createPaymentIntent();
  }, [open, lookupKey, couponCode]);

  return (
    <RsnDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      sx={{
        width: '100vw'
      }}
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          position: 'relative',
          width: '100vw',
          margin: '0',
          maxHeight: 'calc(100dvh - 40px)'
        }
      }}
    >
      <DialogContent sx={{ p: isMobile ? 2 : 4, overflow: 'scroll'}}>
        {clientSecret && priceInfo ? (
          <StripeElementsCheckout 
            clientSecret={clientSecret} 
            priceInfo={priceInfo}
          />
        ) : (
          <CheckoutSkeleton />
        )}
      </DialogContent>
    </RsnDialog>
  );
} 