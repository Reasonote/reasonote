import {useReasonoteLicense} from "./useReasonoteLicense";

/**
 * Hook to check if the user's subscription is canceled
 * @returns Object containing cancellation status information
 */
export function useSubscriptionCancellationStatus() {
  const { data, loading, error } = useReasonoteLicense();
  
  if (loading || error || !data) {
    return {
      isCanceled: false,
      canceledAt: null,
      cancellationReason: null,
      loading,
      error
    };
  }

  return {
    isCanceled: data.currentPlan.isCanceled || false,
    canceledAt: data.currentPlan.canceledAt || null,
    cancellationReason: data.currentPlan.cancellationReason || null,
    loading: false,
    error: null
  };
}

/**
 * Utility function to format a cancellation date
 * @param dateString ISO date string
 * @returns Formatted date string or null if no date provided
 */
export function formatCancellationDate(dateString: string | null): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    console.error('Error formatting cancellation date:', e);
    return dateString;
  }
}

/**
 * Get a user-friendly description of the cancellation reason
 * @param reason The raw cancellation reason from Stripe
 * @returns User-friendly description
 */
export function getCancellationReasonDescription(reason: string | null): string {
  if (!reason) return 'No reason provided';
  
  switch (reason) {
    case 'customer_requested':
      return 'Canceled by customer';
    case 'delinquent':
      return 'Payment failed';
    case 'fraud':
      return 'Canceled due to suspected fraud';
    case 'duplicate':
      return 'Duplicate subscription';
    case 'product_unsatisfactory':
      return 'Product was unsatisfactory';
    case 'other':
    default:
      return 'Other reason';
  }
} 