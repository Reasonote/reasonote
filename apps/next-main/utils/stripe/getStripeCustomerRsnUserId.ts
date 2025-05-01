import * as _ from "lodash";

import {Database} from "@reasonote/lib-sdk";
import {SupabaseClient} from "@supabase/supabase-js";

export async function getRsnUserIdFromStripeCustomer(sb: SupabaseClient<Database>, customerId: string) {
  // Get the corresponding rsn_user from the customer.
  const stripeCustomer = await sb.from("stripe_customers").select("*").eq("id", customerId).single();

  const stripeCustomerEmail = stripeCustomer?.data?.email;

  if (!stripeCustomerEmail) {
    console.error("stripe customer not found for id: ", customerId);
    return;
  }

  // Try to get the rsnUserId from the stripe customer metadata.
  // If that fails, use the email to fetch the rsn_user with that email, and use that id.
  //@ts-ignore
  var rsnUserId: string | null | undefined = stripeCustomer?.data?.attrs?.rsnUserId;
  if (!rsnUserId) {
    const rsnUser = await sb.from("rsn_user").select("id").eq("auth_email", stripeCustomerEmail).single();

    if (!rsnUser?.data?.id) {
      console.error("rsn_user not found for email: ", stripeCustomerEmail);
      return;
    }

    rsnUserId = rsnUser?.data?.id;
  }

  return rsnUserId;
}

