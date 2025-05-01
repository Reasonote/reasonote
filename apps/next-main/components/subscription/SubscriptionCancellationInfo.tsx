'use client';

import React from "react";

import {
  formatCancellationDate,
  getCancellationReasonDescription,
  useSubscriptionCancellationStatus,
} from "@/clientOnly/hooks/useSubscriptionCancellationStatus";
import {
  Alert,
  Box,
  Typography,
} from "@mui/material";

/**
 * Component to display subscription cancellation information
 */
export function SubscriptionCancellationInfo() {
  const { isCanceled, canceledAt, cancellationReason, loading, error } = useSubscriptionCancellationStatus();
  
  if (loading) {
    return <Typography>Loading subscription information...</Typography>;
  }
  
  if (error) {
    return <Alert severity="error">Error loading subscription information</Alert>;
  }
  
  if (!isCanceled) {
    return null; // Don't show anything if subscription is not canceled
  }
  
  const formattedDate = formatCancellationDate(canceledAt);
  const reasonDescription = getCancellationReasonDescription(cancellationReason);
  
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Alert severity="warning">
        <Typography variant="subtitle1" fontWeight="bold">
          Your subscription has been canceled
        </Typography>
        {formattedDate && (
          <Typography variant="body2">
            Canceled on: {formattedDate}
          </Typography>
        )}
        <Typography variant="body2">
          Reason: {reasonDescription}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          You will continue to have access until the end of your current billing period.
        </Typography>
      </Alert>
    </Box>
  );
}

export default SubscriptionCancellationInfo; 