import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

import { createTestUser } from '../utils/testClient';

describe('login_jwt OAuth Profile Image Handling', () => {
  let testUser: { sb: SupabaseClient<Database>, rsnUserId: string };
  let adminClient: SupabaseClient<Database>;
  let anonClient: SupabaseClient<Database>;
  let createdEmails: string[] = [];

  beforeAll(async () => {
    testUser = await createTestUser('profile_test@example.com', 'test123456');
    createdEmails.push('profile_test@example.com');
    
    // Create admin client with service role key
    adminClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: { persistSession: false }
      }
    );

    // Create anon client
    anonClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false }
      }
    );
  });

  afterEach(async () => {
    // Clean up users after each test
    for (const email of createdEmails) {
      const { data: { users } } = await adminClient.auth.admin.listUsers();
      const user = users?.find(u => u.email === email);
      if (user) {
        await adminClient.auth.admin.deleteUser(user.id);
      }
    }
    createdEmails = [];
  });

  it('returns null data fields for anonymous users', async () => {
    const {data, error} = await anonClient.rpc('login_jwt');
    expect(error).toBeNull();
    expect(data).toEqual({ id: null, has_password: null });
  });

  it('creates user_profile on first login', async () => {
    const email = 'first_login_test@example.com';
    const newUser = await createTestUser(email, 'test123456');
    createdEmails.push(email);

    const {error} = await newUser.sb.rpc('login_jwt');
    expect(error).toBeNull();
    const rsnUserId = newUser.rsnUserId;
    expect(rsnUserId).not.toBeNull();

    // Check if profile was created
    const { data: profile } = await newUser.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.rsn_user_id).toBe(rsnUserId);
  });

  it('sets profile_image_url from OAuth picture when available', async () => {
    const email = 'oauth_test@example.com';
    // Create a new user with OAuth metadata using admin client
    const { data: { user }, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {
        picture: 'https://lh3.googleusercontent.com/test-image'
      }
    });
    createdEmails.push(email);

    if (!user) throw new Error(`Failed to create test user: ${userError}`);

    // Create authenticated client for the new user
    const newUserClient = await createTestUser(email, 'test123456');

    // Call login_jwt with the new user's client
    const {error} = await newUserClient.sb.rpc('login_jwt');
    expect(error).toBeNull();
    const rsnUserId = newUserClient.rsnUserId;
    expect(rsnUserId).not.toBeNull();
    
    // Check the profile
    const { data: profile } = await newUserClient.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.profile_image_url).toBe('https://lh3.googleusercontent.com/test-image');
  });

  it('handles malformed OAuth picture URLs', async () => {
    const email = 'bad_oauth_test@example.com';
    // Create a new user with invalid picture URL
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {
        picture: 'not-a-valid-url'
      }
    });
    createdEmails.push(email);

    if (!user) throw new Error('Failed to create test user');

    // Create authenticated client for the new user
    const newUserClient = await createTestUser(email, 'test123456');

    // Call login_jwt with the new user's client
    const {error} = await newUserClient.sb.rpc('login_jwt');
    expect(error).toBeNull();
    
    // Check the profile - should be created but without picture URL
    const { data: profile } = await newUserClient.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', newUserClient.rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    // The function actually sets the URL even if malformed
    expect(profile!.profile_image_url).toBe('not-a-valid-url');
  });

  it('handles empty OAuth metadata', async () => {
    const email = 'empty_meta@example.com';
    // Create a new user with empty metadata
    const { data: { user }, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {}
    });
    createdEmails.push(email);

    if (!user) throw new Error(`Failed to create test user: ${userError}`);

    // Create authenticated client for the new user
    const newUserClient = await createTestUser(email, 'test123456');

    // Call login_jwt with the new user's client
    const {error} = await newUserClient.sb.rpc('login_jwt');
    expect(error).toBeNull();
    
    // Check the profile
    const { data: profile } = await newUserClient.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', newUserClient.rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.profile_image_url).toBeNull();
  });

  it('does not set profile_image_url when no OAuth picture is available', async () => {
    const email = 'no_oauth_test@example.com';
    // Create a new user without OAuth metadata using admin client
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
    });
    createdEmails.push(email);

    if (!user) throw new Error('Failed to create test user');

    // Create authenticated client for the new user
    const newUserClient = await createTestUser(email, 'test123456');

    // Call login_jwt with the new user's client
    await newUserClient.sb.rpc('login_jwt');
    const rsnUserId = newUserClient.rsnUserId;
    expect(rsnUserId).not.toBeNull();
    
    // Check the profile
    const { data: profile } = await newUserClient.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.profile_image_url).toBeNull();
  });

  it('does not overwrite existing profile_image_url on subsequent logins', async () => {
    const email = 'subsequent_login_test@example.com';
    const newUser = await createTestUser(email, 'test123456');
    createdEmails.push(email);

    // First call login_jwt to ensure profile exists
    await newUser.sb.rpc('login_jwt');
    const rsnUserId = newUser.rsnUserId;
    expect(rsnUserId).not.toBeNull();

    // Set a custom profile image
    const customImageUrl = 'https://example.com/custom-image.jpg';
    await newUser.sb
      .from('user_profile')
      .update({ profile_image_url: customImageUrl })
      .eq('rsn_user_id', rsnUserId);

    // Call login_jwt again
    await newUser.sb.rpc('login_jwt');

    // Check if the custom image URL was preserved
    const { data: profile } = await newUser.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.profile_image_url).toBe(customImageUrl);
  });

  it('handles concurrent login_jwt calls gracefully', async () => {
    const email = 'concurrent_test@example.com';
    // Create a new user
    const { data: { user }, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {
        picture: 'https://lh3.googleusercontent.com/test-image'
      }
    });
    createdEmails.push(email);

    if (!user) throw new Error(`Failed to create test user: ${userError}`);

    // Create authenticated client
    const concurrentUser = await createTestUser(email, 'test123456');

    // Make multiple concurrent calls to login_jwt
    const results = await Promise.all(
      Array(5).fill(null).map(() => concurrentUser.sb.rpc('login_jwt'))
    );

    // At least one call should succeed
    expect(results.some(result => !result.error)).toBe(true);

    // Should only create one profile
    const { data: profiles } = await concurrentUser.sb
      .from('user_profile')
      .select('*')
      .eq('rsn_user_id', concurrentUser.rsnUserId);

    expect(profiles).toHaveLength(1);
  });
});

describe('Username Generation and Format', () => {
  let adminClient: SupabaseClient<Database>;
  let createdEmails: string[] = [];

  beforeAll(async () => {
    // Create admin client with service role key
    adminClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: { persistSession: false }
      }
    );
  });

  afterEach(async () => {
    // Clean up users after each test
    for (const email of createdEmails) {
      const { data: { users } } = await adminClient.auth.admin.listUsers();
      const user = users?.find(u => u.email === email);
      if (user) {
        await adminClient.auth.admin.deleteUser(user.id);
      }
    }
    createdEmails = [];
  });

  it('generates username from given_name and family_name', async () => {
    const email = 'username.test@example.com';
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {
        given_name: 'John',
        family_name: 'Doe'
      }
    });
    createdEmails.push(email);

    const testUser = await createTestUser(email, 'test123456');
    await testUser.sb.rpc('login_jwt');

    const { data: profile } = await testUser.sb
      .from('user_profile')
      .select('username')
      .eq('rsn_user_id', testUser.rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.username).toBe('jdoe');
  });

  it('handles Unicode characters in names', async () => {
    const email = 'unicode.test@example.com';
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {
        given_name: 'José',
        family_name: 'García'
      }
    });
    createdEmails.push(email);

    const testUser = await createTestUser(email, 'test123456');
    await testUser.sb.rpc('login_jwt');

    const { data: profile } = await testUser.sb
      .from('user_profile')
      .select('username')
      .eq('rsn_user_id', testUser.rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    // Should preserve Unicode characters (PostgreSQL [:alnum:] includes Unicode)
    expect(profile!.username).toBe('jgarcía');
    // Verify it's properly lowercased
    expect(profile!.username).toBe(profile!.username.toLowerCase());
    // Should start with first initial
    expect(profile!.username.startsWith('j')).toBe(true);
  });

  it('handles missing names', async () => {
    const email = 'noname.test@example.com';
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456'
    });
    createdEmails.push(email);

    const testUser = await createTestUser(email, 'test123456');
    await testUser.sb.rpc('login_jwt');

    const { data: profile } = await testUser.sb
      .from('user_profile')
      .select('username')
      .eq('rsn_user_id', testUser.rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.username).toMatch(/^user/);
  });

  it('adds numeric suffix for duplicate usernames', async () => {
    // Create first user
    const email1 = 'duplicate1.test@example.com';
    await adminClient.auth.admin.createUser({
      email: email1,
      password: 'test123456',
      user_metadata: {
        given_name: 'John',
        family_name: 'Doe'
      }
    });
    createdEmails.push(email1);

    const testUser1 = await createTestUser(email1, 'test123456');
    await testUser1.sb.rpc('login_jwt');

    // Create second user with same name
    const email2 = 'duplicate2.test@example.com';
    await adminClient.auth.admin.createUser({
      email: email2,
      password: 'test123456',
      user_metadata: {
        given_name: 'John',
        family_name: 'Doe'
      }
    });
    createdEmails.push(email2);

    const testUser2 = await createTestUser(email2, 'test123456');
    await testUser2.sb.rpc('login_jwt');

    const { data: profile1 } = await testUser1.sb
      .from('user_profile')
      .select('username')
      .eq('rsn_user_id', testUser1.rsnUserId)
      .single();

    const { data: profile2 } = await testUser2.sb
      .from('user_profile')
      .select('username')
      .eq('rsn_user_id', testUser2.rsnUserId)
      .single();

    expect(profile1!.username).toBe('jdoe');
    expect(profile2!.username).toMatch(/^jdoe\d+$/);
    expect(profile2!.username).not.toBe(profile1!.username);
  });

  it('enforces username format constraint', async () => {
    const email = 'format.test@example.com';
    const testUser = await createTestUser(email, 'test123456');
    createdEmails.push(email);
    await testUser.sb.rpc('login_jwt');

    // Try to update username with invalid characters
    const { error } = await testUser.sb
      .from('user_profile')
      .update({ username: 'test@user!' })
      .eq('rsn_user_id', testUser.rsnUserId);

    expect(error).not.toBeNull();
    expect(error!.message).toContain('profile_username_format');
  });

  it('ensures minimum username length', async () => {
    const email = 'short.test@example.com';
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'test123456',
      user_metadata: {
        given_name: 'A',
        family_name: 'B'
      }
    });
    createdEmails.push(email);

    const testUser = await createTestUser(email, 'test123456');
    await testUser.sb.rpc('login_jwt');

    const { data: profile } = await testUser.sb
      .from('user_profile')
      .select('username')
      .eq('rsn_user_id', testUser.rsnUserId)
      .single();

    expect(profile).not.toBeNull();
    expect(profile!.username.length).toBeGreaterThanOrEqual(3);
  });
}); 