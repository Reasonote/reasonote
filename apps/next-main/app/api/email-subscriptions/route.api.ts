import {NextResponse} from "next/server";

import {notEmpty} from "@lukebechtel/lab-ts-utils";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {EmailSubscriptionsRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: EmailSubscriptionsRoute,
  handler: async (ctx) => {
    const { parsedReq, user, supabase } = ctx;
    const { product_updates, edtech_updates, newsletter, email } = parsedReq;

    try {
      // If user is logged in, update their subscription directly
      if (user && email === user.supabaseUser?.email) {
        // Create or update the subscription record directly
        const upsertData: Record<string, any> = {
          rsn_user_id: user.rsnUserId
        };
        
        // Only include fields that were explicitly provided
        if (notEmpty(product_updates)) upsertData.product_updates = product_updates;
        if (notEmpty(edtech_updates)) upsertData.edtech_updates = edtech_updates;
        if (notEmpty(newsletter)) upsertData.newsletter = newsletter;

        const { data, error } = await supabase
          .from('email_subscription')
          .upsert(upsertData, {
            onConflict: 'rsn_user_id'
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
      } 
      // Handle non-logged in users - create account and subscription in one go
      else if (email) {
        // Send OTP for authentication
        const emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/blog`;
        
        const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: emailRedirectTo
          }
        });

        if (authError) {
          console.error("Error sending OTP email:", authError);
          return NextResponse.json(
            { success: false, message: "Failed to send verification email" },
            { status: 500 }
          );
        }

        // Find or create the user ID directly
        const { data: users, error: userError } = await ctx.SUPERUSER_supabase
          .from('rsn_user')
          .select('id')
          .eq('auth_email', email)
          .limit(1);

        if (userError) {
          console.error("Error finding user:", userError);
          return NextResponse.json(
            { success: false, message: "User account created but couldn't find user ID" },
            { status: 500 }
          );
        }

        // Check if we found a user
        if (!users || users.length === 0) {
          return NextResponse.json(
            { success: false, message: "User account created but couldn't find user record" },
            { status: 500 }
          );
        }

        const userId = users[0].id;

        // Create the subscription record with service role
        const subscriptionData: Record<string, any> = {
          rsn_user_id: userId
        };
        
        if (notEmpty(newsletter)) subscriptionData.newsletter = newsletter;
        if (notEmpty(product_updates)) subscriptionData.product_updates = product_updates;
        if (notEmpty(edtech_updates)) subscriptionData.edtech_updates = edtech_updates;

        // Default newsletter to true if not specified
        if (!notEmpty(newsletter)) subscriptionData.newsletter = true;

        const { error: subscriptionError } = await ctx.SUPERUSER_supabase
          .from('email_subscription')
          .upsert(subscriptionData, { onConflict: 'rsn_user_id' });

        if (subscriptionError) {
          console.error("Error creating subscription:", subscriptionError);
          return NextResponse.json(
            { success: false, message: "User account created but couldn't set subscription preferences" },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: "Please check your email to verify your account. Your subscription has been set up." 
        });
      }
      else {
        return NextResponse.json({ 
          success: false, 
          message: "Unauthorized. Please provide an email or log in." 
        }, { status: 401 });
      }
    } catch (err: any) {
      console.error("Error in email subscription handler:", err);
      return NextResponse.json(
        { success: false, message: err.message || "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
});