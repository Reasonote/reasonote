import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {UserLimitsRoute} from "./routeSchema";

// Define the extended subscription type with cancellation fields
interface StripeSubscriptionWithCancellation {
  stripe_subscription_id: string;
  stripe_product_id: string;
  stripe_product_name: string;
  stripe_product_lookup_key: string;
  current_period_start: string;
  current_period_end: string;
  status?: string;
  canceled_at?: string | null;
  cancellation_reason?: string | null;
}

export const { POST } = makeServerApiHandlerV3({
  route: UserLimitsRoute,
  handler: async (ctx) => {
    const { user, rsn, supabase } = ctx;

    const { data, error } = await rsn.sb.rpc('get_user_limits');
    if (error) {
      console.error('Error getting user limits:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    console.log({data, error});

    if (!data?.[0]) {
      console.error('No data returned from get_user_limits');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Get subscription cancellation information
    let cancellationInfo = {
      isCanceled: false,
      canceledAt: null as string | null,
      cancellationReason: null as string | null
    };

    try {
      // Get the user's subscriptions
      const { data: subscriptions } = await supabase.rpc('get_user_stripe_subs_short');
      
      // Check if the user has any canceled subscriptions
      if (subscriptions && subscriptions.length > 0) {
        // Cast to our extended type
        const activeSub = subscriptions[0] as StripeSubscriptionWithCancellation;
        
        // Check if the subscription is canceled
        if (activeSub.status === 'canceled' || activeSub.canceled_at) {
          cancellationInfo = {
            isCanceled: true,
            canceledAt: activeSub.canceled_at || null,
            cancellationReason: activeSub.cancellation_reason || null
          };
        }
      }
    } catch (subError) {
      console.error('Error getting subscription cancellation info:', subError);
      // Continue without cancellation info if there's an error
    }

    // The function returns exactly what we need, plus cancellation info
    return {
      currentPlan: {
        ...data[0].currentPlan as any,
        ...cancellationInfo
      },
      features: data[0].features as any
    }
  },
}); 