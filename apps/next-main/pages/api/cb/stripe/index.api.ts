import {fromUnixTime} from "date-fns";
import _ from "lodash";
import {buffer} from "micro";
import {
  NextApiRequest,
  NextApiResponse,
} from "next";
import {Stripe} from "stripe";

import {getPosthogBackend} from "@/utils/posthog/getPosthogBackend";
import {
  getRsnUserIdFromStripeCustomer,
} from "@/utils/stripe/getStripeCustomerRsnUserId";
import {Database} from "@reasonote/lib-sdk/src";
import {createClient} from "@supabase/supabase-js";

import {API_ENV} from "../../_helpers/API_ENV";

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = API_ENV.STRIPE_WEBHOOK_SECRET;

const posthog = getPosthogBackend();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({
      error: {
        message: "Only POST requests are accepted.",
      },
    });
    return;
  }

  // Create the supbase client for the server, and set its session based on the access / refresh tokens provided in the headers.
  // TODO: this should be abstracted into our BaseContext layer.
  const sb = createClient<Database>(
    API_ENV.NEXT_PUBLIC_SUPABASE_URL,
    API_ENV.SUPABASE_SERVICE_KEY
  );

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event;

  const stripe = new Stripe(API_ENV.STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.log("err.message: ", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // console.log('event.type: ', event.type);
  // console.log('event.data.object: ', event.data.object);

  /**
 * 
    ----CREATE TABLES
    CREATE TABLE public.stripe_products (
        id text NOT NULL PRIMARY KEY,
        name text,
        active bool,
        default_price text,
        description text,
        created timestamp,
        updated timestamp,
        attrs jsonb
    );
    CREATE TABLE public.stripe_subscriptions (
        id text NOT NULL PRIMARY KEY,
        customer text,
        currency text,
        current_period_start timestamp,
        current_period_end timestamp,
        attrs jsonb
    );

    CREATE TABLE public.stripe_customers (
        id text NOT NULL PRIMARY KEY,
        email text,
        name text,
        description text,
        created timestamp,
        attrs jsonb
    );
    * 
    * 
    * 
    * 
    */

  if (event.type === "customer.created") {
    const customer = event.data.object as Stripe.Customer;
    console.log("customer created", customer);
    await sb.from("stripe_customers").upsert([
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        description: customer.description,
        created: fromUnixTime(customer.created).toISOString(),
        attrs: customer.metadata,
      },
    ]);
  } else if (event.type === "customer.updated") {
    const customer = event.data.object as Stripe.Customer;
    await sb.from("stripe_customers").upsert({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      description: customer.description,
      created: fromUnixTime(customer.created).toISOString(),
      attrs: customer.metadata,
    });
    console.log("customer updated", customer);
  } else if (event.type === "customer.deleted") {
    const customer = event.data.object as Stripe.Customer;
    console.log("customer deleted", customer);
    await sb.from("stripe_customers").delete().eq("id", customer.id);
  } else if (event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;

    const customerId = _.isString(subscription.customer)  
      ? subscription.customer
      : subscription.customer.id;

    const rsnUserId = await getRsnUserIdFromStripeCustomer(sb, customerId);

    if (!rsnUserId) {
      console.error("rsn_user not found for customer: ", customerId);
      return;
    }

    posthog?.capture({
      distinctId: rsnUserId,
      event: "subscription_created",
      properties: {
        subscription_id: subscription.id,
        customer_id: customerId,
        currency: subscription.currency,
        current_period_start: fromUnixTime(
          subscription.current_period_start
        ).toISOString(),
        current_period_end: fromUnixTime(
          subscription.current_period_end
        ).toISOString(),
        items: subscription.items as any,
        attrs: subscription.metadata,
        status: subscription.status
      },
    })

    console.log("subscription created", JSON.stringify(subscription, null, 2));
    await sb.from("stripe_subscriptions").upsert([
      {
        id: subscription.id,
        customer: _.isString(subscription.customer)
          ? subscription.customer
          : subscription.customer.id,
        currency: subscription.currency,
        current_period_start: fromUnixTime(
          subscription.current_period_start
        ).toISOString(),
        current_period_end: fromUnixTime(
          subscription.current_period_end
        ).toISOString(),
        items: subscription.items as any,
        attrs: subscription.metadata,
        status: subscription.status
      },
    ]);
  } else if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    console.log("subscription updated", subscription);


    const customerId = _.isString(subscription.customer)  
      ? subscription.customer
      : subscription.customer.id;

    const rsnUserId = await getRsnUserIdFromStripeCustomer(sb, customerId);

    if (!rsnUserId) {
      console.error("rsn_user not found for customer: ", customerId);
      return;
    }

    posthog?.capture({
      distinctId: rsnUserId,
      event: "subscription_updated",
      properties: {
        subscription_id: subscription.id,
        customer_id: customerId,
        currency: subscription.currency,
        current_period_start: fromUnixTime(
          subscription.current_period_start
        ).toISOString(),
        current_period_end: fromUnixTime(
          subscription.current_period_end
        ).toISOString(),
        items: subscription.items as any,
        attrs: subscription.metadata,
        status: subscription.status,
        canceled_at: subscription.canceled_at ? fromUnixTime(subscription.canceled_at).toISOString() : null,
        cancellation_reason: subscription.cancellation_details?.reason || null,
      },
    })

    await sb.from("stripe_subscriptions").upsert([
      {
        id: subscription.id,
        customer: _.isString(subscription.customer)
          ? subscription.customer
          : subscription.customer.id,
        currency: subscription.currency,
        current_period_start: fromUnixTime(
          subscription.current_period_start
        ).toISOString(),
        current_period_end: fromUnixTime(
          subscription.current_period_end
        ).toISOString(),
        items: subscription.items as any,
        attrs: subscription.metadata,
        status: subscription.status,
        canceled_at: subscription.canceled_at ? fromUnixTime(subscription.canceled_at).toISOString() : null,
        cancellation_reason: subscription.cancellation_details?.reason || null,
      },
    ]);
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    console.log("subscription deleted", subscription);

    const customerId = _.isString(subscription.customer)  
      ? subscription.customer
      : subscription.customer.id;

    const rsnUserId = await getRsnUserIdFromStripeCustomer(sb, customerId);

    if (!rsnUserId) {
      console.error("rsn_user not found for customer: ", customerId);
      return;
    }

    // Capture detailed cancellation information
    const canceledAt = subscription.canceled_at ? fromUnixTime(subscription.canceled_at).toISOString() : fromUnixTime(Math.floor(Date.now() / 1000)).toISOString();
    const cancellationReason = subscription.cancellation_details?.reason || 'unknown';
    const cancellationComment = subscription.cancellation_details?.comment || '';
    const cancellationFeedback = subscription.cancellation_details?.feedback || '';

    posthog?.capture({
      distinctId: rsnUserId,
      event: "subscription_deleted",
      properties: {
        subscription_id: subscription.id,
        customer_id: customerId,
        currency: subscription.currency,
        current_period_start: fromUnixTime(
          subscription.current_period_start
        ).toISOString(),
        current_period_end: fromUnixTime(
          subscription.current_period_end
        ).toISOString(),
        items: subscription.items as any,
        attrs: subscription.metadata,
        status: 'canceled',
        canceled_at: canceledAt,
        cancellation_reason: cancellationReason,
        cancellation_comment: cancellationComment,
        cancellation_feedback: cancellationFeedback
      },
    });

    // Instead of deleting the subscription record, update it with cancellation details
    await sb.from("stripe_subscriptions").upsert([
      {
        id: subscription.id,
        customer: customerId,
        currency: subscription.currency,
        current_period_start: fromUnixTime(
          subscription.current_period_start
        ).toISOString(),
        current_period_end: fromUnixTime(
          subscription.current_period_end
        ).toISOString(),
        items: subscription.items as any,
        attrs: {
          ...subscription.metadata,
          cancellation_comment: cancellationComment,
          cancellation_feedback: cancellationFeedback
        },
        status: 'canceled',
        canceled_at: canceledAt,
        cancellation_reason: cancellationReason
      },
    ]);
  } else if (event.type === "product.created") {
    const product = event.data.object as Stripe.Product;
    console.log("product created", product);
    await sb.from("stripe_products").upsert([
      {
        id: product.id,
        name: product.name,
        active: product.active,
        default_price: _.isString(product.default_price)
          ? product.default_price
          : product.default_price?.id,
        description: product.description,
        created: fromUnixTime(product.created).toISOString(),
        updated: fromUnixTime(product.updated).toISOString(),
        attrs: product.metadata,
      },
    ]);
  } else if (event.type === "product.updated") {
    const product = event.data.object as Stripe.Product;
    console.log("product updated", product);
    await sb.from("stripe_products").upsert([
      {
        id: product.id,
        name: product.name,
        active: product.active,
        default_price: _.isString(product.default_price)
          ? product.default_price
          : product.default_price?.id,
        description: product.description,
        created: fromUnixTime(product.created).toISOString(),
        updated: fromUnixTime(product.updated).toISOString(),
        attrs: product.metadata,
      },
    ]);
  } else if (event.type === "product.deleted") {
    const product = event.data.object as Stripe.Product;
    console.log("product deleted", product);
    await sb.from("stripe_products").delete().eq("id", product.id);
  }

  // Handle the event
  // switch (event.type) {
  //     // When a customer has been created, updated, or deleted, update our database.
  //     case 'customer.created':
  //         const cust = event.data.object;
  //         console.log("customer deleted", customer)
  //         break;

  //     case 'customer.updated':
  //         const customer = event.data.object;
  //         console.log("customer deleted", customer)
  //         break;

  //     case 'customer.deleted':
  //         const customer = event.data.object;
  //         console.log("customer deleted", customer)
  //         break;

  //     // When a subscription has been created, updated, or deleted, update our database.

  //     case 'payment_intent.succeeded':
  //         const paymentIntentSucceeded = event.data.object;
  //         // Then define and call a function to handle the event payment_intent.succeeded
  //         break;
  //     // ... handle other event types
  //     default:
  //         console.log(`Unhandled event type ${event.type}`);
  // }

  res.status(200).send({ received: true });
}
