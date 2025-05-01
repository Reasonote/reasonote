import {headers} from "next/headers";
import {NextResponse} from "next/server";
import Stripe from "stripe";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CreatePaymentIntentRoute} from "./_route";

export const { POST } = makeServerApiHandlerV3({
  route: CreatePaymentIntentRoute,
  handler: async ({req, parsedReq, user, supabase}) => {
    if (!user) {
      return NextResponse.json({
        error: "User must be authenticated.",
      }, {status: 401});
    }

    const origin = headers().get("origin");
    if (!origin) {
      return NextResponse.json({
        error: "Origin is not set in headers.",
      }, {status: 400});
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
    });

    try {
      // Get or create Stripe customer
      let curUsrStripeId: string | null = null;
      const curUsrStripeIdResp = await supabase.rpc("cur_user_stripe_customer_id");

      if (curUsrStripeIdResp.error) {
        return NextResponse.json({
          error: `cur_user_stripe_customer_id endpoint returned error message: "${curUsrStripeIdResp.error.message}"`,
        }, {status: 400});
      }

      curUsrStripeId = curUsrStripeIdResp.data;

      if (!curUsrStripeId) {
        const custCreateResult = await stripe.customers.create({
          email: user.supabaseUser?.email,
          metadata: {
            rsnUserId: user.rsnUserId,
          },
        });

        if (!custCreateResult?.id) {
          throw new Error("Stripe customer creation failed.");
        }
        curUsrStripeId = custCreateResult.id;
      }

      // Get the price for this product
      const prices = await stripe.prices.search({
        query: `lookup_key:"${parsedReq.lookupKey}"`,
        expand: ['data.currency_options', 'data.product'],
      });

      if (prices.data.length === 0) {
        return NextResponse.json({
          error: `No price found for lookup key: '${parsedReq.lookupKey}'`,
        }, {status: 400});
      }

      const thePrice = prices.data.filter((p) => p.active === true)[0];

      if (!thePrice) {
        return NextResponse.json({
          error: `No active price found for lookup key: '${parsedReq.lookupKey}'`,
        }, {status: 400});
      }

      // Get the product name
      const product = thePrice.product as Stripe.Product;
      const productName = product.name;

      // If there's a coupon code, validate it and calculate the discounted amount
      let discountAmount: number | undefined;
      let discountName: string | undefined;
      let originalAmount: number | undefined;

      if (parsedReq.couponCode) {
        try {
          const coupon = await stripe.coupons.retrieve(parsedReq.couponCode);
          if (coupon.valid) {
            originalAmount = thePrice.unit_amount!;
            if (coupon.amount_off) {
              discountAmount = coupon.amount_off;
            } else if (coupon.percent_off) {
              discountAmount = Math.round((thePrice.unit_amount! * coupon.percent_off) / 100);
            }
            discountName = coupon.name || `${coupon.percent_off}% off`;
          }
        } catch (error) {
          console.log('Invalid coupon code:', parsedReq.couponCode);
        }
      }

      // For free trials, we use setup intents to collect the payment method for future use
      const setupIntent = await stripe.setupIntents.create({
        customer: curUsrStripeId,
        payment_method_types: ['card'],
        metadata: {
          rsnUserId: user.rsnUserId,
          lookupKey: parsedReq.lookupKey,
          priceId: thePrice.id,
          ...(parsedReq.couponCode ? { couponCode: parsedReq.couponCode } : {}),
        },
        usage: 'off_session', // This setup intent will be used for future payments
      });

      console.log('Setup intent created:', {
        id: setupIntent.id,
        clientSecret: !!setupIntent.client_secret,
      });

      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        isSetupIntent: true,
        priceInfo: {
          unitAmount: thePrice.unit_amount!,
          currency: thePrice.currency,
          interval: thePrice.recurring?.interval || 'month',
          productName: productName,
          priceId: thePrice.id,
          ...(originalAmount ? { originalAmount } : {}),
          ...(discountAmount ? { discountAmount } : {}),
          ...(discountName ? { discountName } : {}),
        },
      });
    } catch (error) {
      console.error('Subscription creation error:', error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }, {status: 500});
    }
  },
}); 