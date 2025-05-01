import {NextResponse} from "next/server";
import Stripe from "stripe";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CreateSubscriptionRoute} from "./_route";

export const { POST } = makeServerApiHandlerV3({
  route: CreateSubscriptionRoute,
  handler: async ({req, parsedReq, user, supabase}) => {
    if (!user) {
      return NextResponse.json({
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
      // Get the customer ID
      const curUsrStripeIdResp = await supabase.rpc("cur_user_stripe_customer_id");
      if (curUsrStripeIdResp.error || !curUsrStripeIdResp.data) {
        return NextResponse.json({
          error: "Failed to get Stripe customer ID",
        }, {status: 400});
      }

      // Create the subscription using the setup payment method
      const subscription = await stripe.subscriptions.create({
        customer: curUsrStripeIdResp.data,
        items: [{ price: parsedReq.priceId }],
        default_payment_method: parsedReq.paymentMethodId,
        trial_period_days: 7,
        metadata: {
          rsnUserId: user.rsnUserId,
        },
        expand: ['latest_invoice'],
      });

      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } catch (error) {
      console.error('Subscription creation error:', error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }, {status: 500});
    }
  },
}); 