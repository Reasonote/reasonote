import {NextResponse} from "next/server";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {CreateShareRoute} from "./routeSchema";

export const {POST} = makeServerApiHandlerV3({
  route: CreateShareRoute,
  handler: async (ctx) => {
    const {parsedReq, user, SUPERUSER_supabase, supabase, apiEnv, req, logger} = ctx;
    const {entityId, emails, role, redirectTo} = parsedReq;

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Check if this user has share access to this entity type.
    const {data: entityPermissions, error: entityPermissionsError} = await supabase
      .from('vw_entity_permissions')
      .select('*')
      .eq('principal_id', user.rsnUserId  )
      .eq('entity_id', entityId);

    if (!entityPermissions || entityPermissions.length === 0) {
      return NextResponse.json({error: 'Unauthorized -- no entity permissions found for this user on this entity'}, {status: 401});
    }

    if (!entityPermissions.some(p => p.permissions?.some(perm => perm.includes('SHARE')))) {
      return NextResponse.json({error: 'Unauthorized -- this user has no share access to this entity'}, {status: 401});
    }
  
    // Get base URL from request headers
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || '';
    const baseUrl = `${protocol}://${host}`;

    // Find existing users by email
    const {data: users, error: userError} = await SUPERUSER_supabase
      .from('rsn_user')
      .select('id, auth_email')
      .in('auth_email', emails);

    if (userError) {
      return NextResponse.json({error: userError.message}, {status: 500});
    }

    const existingUserEmails = new Set(users?.map(u => u.auth_email) || []);
    const newUserEmails = emails.filter(email => !existingUserEmails.has(email));

    // Invite new users using admin client
    if (newUserEmails.length > 0) {
      // Invite each new user
      const resps = await Promise.all(newUserEmails.map(async (email) => {
        return await SUPERUSER_supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${baseUrl}/app/auth/accept-invite?redirectTo=${redirectTo ? encodeURIComponent(redirectTo) : encodeURIComponent(`${baseUrl}/app/classroom?entityId=${entityId}&role=${role}`)}`,
        });
      }));

      if (resps.some(resp => resp.error)) {
        const message = `Failed to invite Some Users: ${resps.map(resp => `${resp.data.user?.email}: "${resp.error?.message}"`).join(', ')}`;
        return NextResponse.json({error: message}, {status: 500});
      }

      logger.debug("Invited users", newUserEmails);

      // Fetch the newly created users
      const {data: newUsers, error: newUserError} = await SUPERUSER_supabase
        .from('rsn_user')
        .select('id, auth_email')
        .in('auth_email', newUserEmails);

      logger.log("newUsers", newUsers);

      if (newUserError) {
        return NextResponse.json({error: newUserError.message}, {status: 500});
      }

      // Combine existing and new users
      users?.push(...(newUsers || []));
    }

    // Create memauth entries for each user
    const memauthEntries = users?.map(u => ({
      principal_user_id: u.id,
      resource_entity_id: entityId,
      access_level: role.toLowerCase(),
    }));

    const {error: memauthError} = await supabase
      .from('memauth')
      .insert(memauthEntries || []);

    if (memauthError) {
      return NextResponse.json({error: memauthError.message}, {status: 500});
    }

    return {
      success: true,
      sharedWith: users?.map(u => ({
        email: u.auth_email ?? '',
        userId: u.id ?? '',
      })) || [],
    };
  }
}); 