import {CheckoutSessionRoute} from "@/app/api/cb/checkout_session/_route";
import {Button} from "@mui/material";

import FullCenter from "../positioning/FullCenter";

export function CheckoutButton({
  productLookupKey,
  priceLookupKey,
  quantity,
  onSuccess,
  onError,
}: {
  productLookupKey: string;
  priceLookupKey: string;
  quantity: number;
  onSuccess: () => void;
  onError: (error: any) => void;
}) {
  const handleSubmit = async () => {
    const route = CheckoutSessionRoute;

    // Create a Checkout Session.
    const { data, error } = await route.call({
      lookupKey: productLookupKey,
    });

    if (error || !data) {
      onError(error ? error : new Error("No data returned from server"));
      return;
    }

    // Navigate to Checkout Session.
    window.location.assign(data.redirectUrl);
  };

  return (
    <FullCenter>
      <div>
        <Button onClick={handleSubmit}>Checkout</Button>
      </div>
    </FullCenter>
  );
}
