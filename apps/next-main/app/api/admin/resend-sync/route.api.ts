import {NextResponse} from "next/server";
import {
  ListAudiencesResponse,
  Resend,
} from "resend";

import {tryUntilAsync} from "@lukebechtel/lab-ts-utils";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ResendSyncRoute} from "./routeSchema";

// Add this configuration object
export const maxDuration = 300;

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function resendRetry<T extends {error: any | null}>(func: () => Promise<T>, maxTimeMS: number = 10000) {
  return tryUntilAsync<T>({
    func,
    stopCondition: (result) => !result.error,
    tryLimits: {
      maxTimeMS,
    },
  })
}

export const { POST } = makeServerApiHandlerV3({
  route: ResendSyncRoute,
  handler: async (ctx) => {
    const { supabase, SUPERUSER_supabase } = ctx;


    const isAdminResult = await supabase.rpc('is_admin');

    if (!isAdminResult) {
      return NextResponse.json({ error: 'Could not verify admin status' }, { status: 500 });
    }

    if (!isAdminResult.data) {
      return NextResponse.json({ error: 'You are not an admin' }, { status: 403 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }

    const resend = new Resend(RESEND_API_KEY);

    // Fetch all users with their email subscriptions, including resend_synced status
    const { data: initialUsers, error } = await SUPERUSER_supabase
      .from('rsn_user')
      .select(`
        id,
        auth_email,
        given_name,
        family_name,
        email_subscription:email_subscription!email_subscription_rsn_user_id_fkey (
          product_updates,
          edtech_updates,
          newsletter,
          account_updates,
          resend_synced
        )
      `);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Initialize subscription status for users without it
    const usersWithoutSubscriptions = initialUsers.filter(user => !user.email_subscription);
    if (usersWithoutSubscriptions.length > 0) {
      const { error: batchInsertError, count } = await SUPERUSER_supabase
        .from('email_subscription')
        .upsert(
          usersWithoutSubscriptions.map(user => ({
            rsn_user_id: user.id,
            product_updates: true,
            edtech_updates: true,
            newsletter: true,
            resend_synced: false
          })),
          { onConflict: 'rsn_user_id' }
        ).select('id');

      console.log(`Initialized subscription status for ${count} users`);

      if (batchInsertError) {
        console.error('Failed to initialize subscription status for some users:', batchInsertError);
        throw new Error('Failed to initialize subscription status for some users');
      }
    }

    // Refetch users with their email subscriptions
    const { data: users, error: usersError } = await SUPERUSER_supabase
      .from('rsn_user')
      .select(`
        id,
        auth_email,
        given_name,
        family_name,
        email_subscription:email_subscription!email_subscription_rsn_user_id_fkey (
          product_updates,
          edtech_updates,
          newsletter,
          account_updates,
          resend_synced
        )
      `);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Fetch all existing audiences
    var existingAudiences: NonNullable<ListAudiencesResponse['data']>['data'] = [];
    const { data: existingAudiencesData } = await resend.audiences.list();

    if (existingAudiencesData) {
      existingAudiences = existingAudiencesData.data;
    }

    // Create or get audiences
    const audienceTypes = ['product_updates', 'edtech_updates', 'newsletter', 'account_updates'] as const;
    await Promise.all(
      audienceTypes.map(async (type) => {
        const existingAudience = existingAudiences?.find(a => a.name === type);
        if (existingAudience) {
          return existingAudience;
        }
        
        const newAudience = await resendRetry(() => resend.audiences.create({ name: type }), 10000)

        if (!newAudience.data) {
          throw new Error('Failed to create new audience');
        }

        console.log(`Created new audience: "${type}"`);
        return newAudience.data;
      })
    );

    const { data: audiencesAfterCreate } = await resendRetry(
      () => resend.audiences.list(),
      10000,
    );

    if (!audiencesAfterCreate) {
      throw new Error('Failed to fetch audiences after creation');
    }

    type AudienceWithContacts = NonNullable<ListAudiencesResponse['data']>['data'][number] & {
      contacts?: {id: string, email: string, first_name?: string, last_name?: string, unsubscribed: boolean}[];
    }

    const audiences: AudienceWithContacts[] = audiencesAfterCreate.data;

    for (const audience of audiences) {
      const { data: contactsData } = await resendRetry(
        () => resend.contacts.list({ audienceId: audience.id }),
        10000
      );

      if (contactsData) {
        if (!audience.contacts) {
          audience.contacts = contactsData.data;
        } else {
          audience.contacts = audience.contacts.concat(contactsData.data);
        }
      }
    }

    // Sync users to Resend
    const results: { user: string | null; results: string[] }[] = [];
    for (const user of users) {
      try {
        if (!user.id) {
          console.error('[SKIPPED] user has no id', user);
          continue;
        }
 
        const subscriptions = user.email_subscription;

        if (!subscriptions) {
          console.error('[SKIPPED] user has no subscriptions', user);
          continue;
        }

        // Skip if already synced
        if (subscriptions.resend_synced) {
          console.log(`[SKIPPED] user "${user.auth_email}" already synced`);
          results.push({
            user: user.auth_email,
            results: ['Already synced'],
          });
          continue;
        }

        console.log(`user ${user.auth_email}`, user);
        console.log(`user ${user.auth_email} Subscriptions`, subscriptions);
        
        // Create or update contact in each relevant audience
        const audienceResults: string[] = [];
        for (const type of audienceTypes) {
          // They are subscribed.
          if (subscriptions[type]) {
            const audience = audiences.find(a => a.name === type);

            if (!audience) {
              audienceResults.push(`Audience ${type} not found`);
              continue;
            }

            console.log(`user ${user.auth_email} audience ${type}`);

            // Check if contact already exists
            const contact = audience?.contacts?.find(c => c.email === user.auth_email);

            function eqNullAgnostic(a: string | null | undefined, b: string | null | undefined) {
              if (a === null && b === null) {
                return true;
              }

              if (a === undefined && b === undefined) {
                return true;
              }

              if (a === null && b === undefined) {
                return true;
              }

              if (a === undefined && b === null) {
                return true;
              }

              return a === b;
            }

            if (contact) {
              // If the contact has all the same information already, don't update it
              if (eqNullAgnostic(contact.first_name, user.given_name) && eqNullAgnostic(contact.last_name, user.family_name)) {
                console.log(`[SKIPPED] user "${user.auth_email}" audience "${type}" contact already exists and is up to date`);
                audienceResults.push(`Skipped ${type}`);
                continue;
              }
              else {
                console.log(`[UPDATED] user "${user.auth_email}" audience "${type}" contact found -- updating`);

                const result = await resendRetry(
                  () => resend.contacts.update({
                    id: contact.id,
                    audienceId: audience.id,
                    firstName: user.given_name ?? '',
                    lastName: user.family_name ?? '',
                    unsubscribed: false,
                  }),
                  10000,
                );

                console.log('updated', result);

                audienceResults.push(`Updated ${type}`);
              }
            }
            else {
              console.log(`[CREATED] user "${user.auth_email}" audience "${type}" contact not found -- creating`);
              if (audience && user.auth_email) {
                const email = user.auth_email;
                const firstName = user.given_name;
                const lastName = user.family_name;
  
                const result = await resendRetry(
                  () => resend.contacts.create({
                    email,
                    firstName: firstName ?? '',
                    lastName: lastName ?? '',
                    unsubscribed: false,
                    audienceId: audience.id,
                  }),
                  10000,
                )

                console.log('created', result);

                audienceResults.push(`Added to ${type}`);
              }
            }
          }
          // They are NOT subscribed.
          else {
            const audience = audiences.find(a => a.name === type);

            if (!audience) {
              audienceResults.push(`Audience ${type} not found`);
              continue;
            }

            const contact = audience?.contacts?.find(c => c.email === user.auth_email);

            if (contact) {
              console.log(`[UNSUBSCRIBED] user "${user.auth_email}" audience "${type}" contact found -- unsubscribing`);

              const result = await resendRetry(
                () => resend.contacts.update({
                  id: contact.id,
                  audienceId: audience.id,
                  unsubscribed: true,
                }),
                10000,
              );

              audienceResults.push(`Unsubscribed from ${type}`);
            }
          }
        }

        // After successful sync, update resend_synced status for this user
        const { data: updateData, error: updateError } = await SUPERUSER_supabase
          .from('email_subscription')
          .update({ resend_synced: true })
          .eq('rsn_user_id', user.id as string)
          .select('*');

        console.log('updateData', updateData);

        if (updateError) {
          console.error(`Failed to update resend_synced status for user ${user.auth_email}:`, updateError);
          audienceResults.push(`Failed to update resend_synced status`);
        } else {
          audienceResults.push(`Updated resend_synced status`);
        }

        results.push({
          user: user.auth_email,
          results: audienceResults,
        });
      } catch (error) {
        console.error(`[ERROR] Failed to process user ${user.id}:`, error);
        // Optionally, you can add more detailed error handling here
      }
    }

    return NextResponse.json({ message: 'Sync completed', results });
  }
});