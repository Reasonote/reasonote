import {NextResponse} from "next/server";
import Stripe from "stripe";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CancelSubscriptionRoute} from "./_route";

export const { POST } = makeServerApiHandlerV3({
  route: CancelSubscriptionRoute,
  handler: async ({req, parsedReq, user, supabase}) => {
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User must be authenticated.",
      }, {status: 401});
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    });

    try {
      // Cancel the subscription in Stripe
      await stripe.subscriptions.update(parsedReq.subscriptionId, {
        cancel_at_period_end: true,
      });

      // First get the current subscription to access its attrs
      const { data: subscriptionData, error: fetchError } = await supabase
        .from("stripe_subscriptions")
        .select("attrs")
        .eq("id", parsedReq.subscriptionId)
        .single();

      if (fetchError) {
        console.error("Error fetching subscription:", fetchError);
        return NextResponse.json({
          success: false,
          error: "Failed to fetch subscription from database",
        }, {status: 500});
      }

      // Update the attrs JSONB field to include cancel_at_period_end
      const currentAttrs = subscriptionData?.attrs as Record<string, unknown> || {};
      const updatedAttrs = {
        ...currentAttrs,
        cancel_at_period_end: true
      };

      const { error } = await supabase
        .from("stripe_subscriptions")
        .update({
          attrs: updatedAttrs
        })
        .eq("id", parsedReq.subscriptionId);

      if (error) {
        console.error("Error updating subscription in database:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to update subscription status in database",
        }, {status: 500});
      }

      return NextResponse.json({
        success: true,
        message: "Subscription has been scheduled for cancellation at the end of the current billing period",
      });
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }, {status: 500});
    }
  },
}); 