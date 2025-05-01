import _ from "lodash";
import {headers} from "next/headers";
import {NextResponse} from "next/server";
import Stripe from "stripe";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CheckoutSessionRoute} from "./_route";

export const { POST } = makeServerApiHandlerV3({
  route: CheckoutSessionRoute,
  handler: async ({req, parsedReq, user, supabase}) => {
    if (!user) {
      return NextResponse.json({
        error: "sbToken & sbRefreshToken must be set in headers.",
      }, {status: 400});
    }

    const origin = headers().get("origin");

    if (!origin) {
      return NextResponse.json({
        error: "Origin is not set in headers.",
      }, {status: 400});
    }

    //////////////////////////////////////////////////////////
    // Get the basic user information from the database.
    const userId = user.rsnUserId;
    const sbUserEmail = user.supabaseUser?.email;

    ///////////////////////////////////////////////////////////
    // We don't want anyone to check out who doesn't have an account
    // (b/c who are they?!) so we'll just return an error.


    console.log("CHECKOUT for userId:", userId);
    console.log("CHECKOUT for email: ", sbUserEmail);

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    });

    ////////////////////////////////////////////////////////////////
    // Get or create our stripe customer id for this user.
    var curUsrStripeId: string | null = null;

    // Ask the database (using foreign table wrappers) if this user already has a stripe customer id.
    const curUsrStripeIdResp = await supabase.rpc("cur_user_stripe_customer_id");

    if (curUsrStripeIdResp.error) {
      return NextResponse.json({
        error: `cur_user_stripe_customer_id endpoint returned error message: "${curUsrStripeIdResp.error.message}"`,
      }, {status: 400});
    }

    curUsrStripeId = curUsrStripeIdResp.data;

    // If we do not, this is a new customer. We need to create a new customer in stripe and save the mapping.
    if (!curUsrStripeId) {
      console.log("Creating new customer in stripe for user: ", userId);
      const custCreateResult = await stripe.customers.create({
        email: sbUserEmail,
        metadata: {
          rsnUserId: userId,
        },
      });

      console.log("Created stripe customer: ", custCreateResult);

      if (!custCreateResult?.id) {
        throw new Error("Stripe customer creation failed.");
      }
      curUsrStripeId = custCreateResult.id;
    }

    // FUTURE TODO: Check to make sure this person doesn't already have a subscription to this product.
    // If they do, fail out.

    // FUTURE TODO: If this customer has a subscription to a product in the same class
    // (i.e. Reasonote-Basic -> Reasonote-Pro) then we want to update their sub, not make a new one.

    /////////////////////////////////////////////////////////////
    // Get the price for this product.
    const prices = await stripe.prices.search({
      query: `lookup_key:"${parsedReq.lookupKey}"`,
    });

    if (prices.data.length === 0) {
      return NextResponse.json({
        error: `No price found for lookup key: '${parsedReq.lookupKey}'`,
      }, {status: 400});
    }

    console.log("prices: ", prices);

    const thePrice = prices.data.filter((p) => p.active === true)[0];

    if (!thePrice) {
      return NextResponse.json({
        error: `No active price found for lookup key: '${parsedReq.lookupKey}'`,
      }, {status: 400});
    }

    console.log("thePrice: ", thePrice);

    ////////////////////////////////////////////////////////////
    // Create a checkout session.
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: curUsrStripeId,
      client_reference_id: userId,
      metadata: {
        // Just in case
        rsnUserId: userId,
      },
      // Collect billing info automatically.
      billing_address_collection: "auto",
      line_items: [
        {
          price: thePrice.id,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/app/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/checkout/cancel`,
      subscription_data: {
        trial_period_days: 7,
      },
    };

    // Add coupon to the session if provided
    if (parsedReq.couponCode) {
      sessionParams.discounts = [
        {
          coupon: parsedReq.couponCode,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    //////////////////////////////////////////////////////////////
    // Finally, we return the url that the client should redirect to.
    // This URL should point to a stripe domain, and is managed by them.
    const { url } = session;

    if (url) {
      return NextResponse.json({ redirectUrl: url }, {status: 200});
    }

    throw new Error("Stripe session did not create correctly.");
  }
});
