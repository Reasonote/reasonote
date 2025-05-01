import {
  useCallback,
  useState,
} from "react";

import {CheckoutModal} from "@/components/checkout/CheckoutModal";

interface OpenCheckoutOptions {
  lookupKey: string;
  couponCode?: string;
}

export function useCheckoutModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenCheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: OpenCheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    // Reset options after a short delay to allow for exit animations
    setTimeout(() => setOptions(null), 300);
  }, []);

  const CheckoutModalComponent = useCallback(() => {
    if (!options) return null;

    return (
      <CheckoutModal
        open={isOpen}
        onClose={closeCheckout}
        lookupKey={options.lookupKey}
        couponCode={options.couponCode}
      />
    );
  }, [isOpen, options, closeCheckout]);

  return {
    openCheckout,
    closeCheckout,
    CheckoutModalComponent,
  };
} 