"use client";
import {useCallback} from "react";

import posthog from "posthog-js";

import {CheckoutSessionRoute} from "@/app/api/cb/checkout_session/_route";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {asyncSleep} from "@lukebechtel/lab-ts-utils";

/**
 * 1. Create a Checkout Session.
 * 2. Navigate to Stripe Checkout Session.
 */
export function useStripeCheckoutBrowser() {
  const {sb} = useSupabase();

  const stripeCheckoutBrowser = useCallback(
    async (params: Parameters<(typeof CheckoutSessionRoute)["call"]>) => {
      posthog.capture("checkout_initiated", {
        params: params[0]
      }, {
        send_instantly: true,
      });

      var session = await sb.auth.getSession();
      if (!session.data.session?.user) {
        // Wait max of 5 seconds for the user to be loaded.
        await asyncSleep(5000);
      }
      session = await sb.auth.getSession();

      if (!session.data.session?.user) {
        throw new Error("You must be signed in to do this.");
      }

      const route = CheckoutSessionRoute;
      // Create a Checkout Session.
      const { data, error } = await route.call(params[0]);

      if (error || !data) {
        throw error || new Error("Failed to create a Checkout Session.");
      }

      // Navigate to Checkout Session.
      window.location.assign(data.redirectUrl);
    },
    [sb]
  );

  return { stripeCheckoutBrowser };
}
