import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

import {
  createAnonymousUser,
  createTestUser,
} from '../utils/testClient';

// Test data helpers
const createTestData = (modifier: string) => {
    const timestamp = Date.now();
    return {
        title: `Test blog post ${modifier}`,
        short_description: `Test description ${modifier}`,
        slug: `test-blog-post-${modifier.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`,
        tags: ['test', 'blog'],
        content: `Test content ${modifier}`,
        is_published: false,
    }
}

const updateTestData = (modifier: string) => {
    return {
        title: `Updated blog post ${modifier}`,
        short_description: `Updated description ${modifier}`,
        content: `Updated content ${modifier}`,
    }
}

describe('Blog Post Permissions', () => {
    let adminClient: SupabaseClient<Database>;
    let regularUser: { sb: SupabaseClient<Database>, rsnUserId: string };
    let publicUser: { sb: SupabaseClient<Database>, rsnUserId: string };

    beforeAll(async () => {
        // Create admin client with service role key
        adminClient = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        regularUser = await createTestUser('regularUser@example.com', 'test123456');
        publicUser = await createAnonymousUser();
    });

    afterAll(async () => {
        // Clean up all test blog posts
        await adminClient
            .from('blog_post')
            .delete()
            .like('slug', 'test-blog-post-%');
    });

    describe('Admin Permissions', () => {
        let blogPostId: string;

        beforeEach(async () => {
            const { data: item } = await adminClient
                .from('blog_post')
                .insert(createTestData('Admin Test'))
                .select()
                .single();

            if (!item) throw new Error('Failed to create test blog post');
            blogPostId = item.id;
        });

        // Blog Post CRUD
        it('admin can create blog posts', async () => {
            const { data, error } = await adminClient
                .from('blog_post')
                .insert(createTestData('New Post'))
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.title).toContain('New Post');
        });

        it('admin can read all blog posts', async () => {
            const { data, error } = await adminClient
                .from('blog_post')
                .select('*')
                .eq('id', blogPostId);

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].id).toBe(blogPostId);
        });

        it('admin can update blog posts', async () => {
            const { error } = await adminClient
                .from('blog_post')
                .update(updateTestData('by Admin'))
                .eq('id', blogPostId)
                .single();

            expect(error).toBeNull();

            // Verify update
            const { data } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();
            expect(data?.title).toBe(`Updated blog post by Admin`);
        });

        it('admin can delete blog posts', async () => {
            const { error } = await adminClient
                .from('blog_post')
                .delete()
                .eq('id', blogPostId)
                .single();

            expect(error).toBeNull();

            // Verify deletion
            const { data } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId);
            expect(data).toHaveLength(0);
        });

        it('admin can toggle publish status', async () => {
            // First verify it's unpublished
            const { data: initialData } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();
            expect(initialData?.is_published).toBe(false);

            // Publish the post
            const { error: publishError } = await adminClient
                .from('blog_post')
                .update({ is_published: true })
                .eq('id', blogPostId)
                .single();
            expect(publishError).toBeNull();

            // Verify it's published
            const { data: publishedData } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();
            expect(publishedData?.is_published).toBe(true);

            // Unpublish the post
            const { error: unpublishError } = await adminClient
                .from('blog_post')
                .update({ is_published: false })
                .eq('id', blogPostId)
                .single();
            expect(unpublishError).toBeNull();

            // Verify it's unpublished
            const { data: unpublishedData } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();
            expect(unpublishedData?.is_published).toBe(false);
        });
    });

    describe('Regular User Permissions', () => {
        let blogPostId: string;

        beforeEach(async () => {
            const { data: item } = await adminClient
                .from('blog_post')
                .insert(createTestData('Regular User Test'))
                .select()
                .single();

            if (!item) throw new Error('Failed to create test blog post');
            blogPostId = item.id;
        });

        it('regular user cannot create blog posts', async () => {
            const { error } = await regularUser.sb
                .from('blog_post')
                .insert(createTestData('by Regular User'))
                .single();

            expect(error).not.toBeNull();
        });

        it('regular user cannot read unpublished blog posts', async () => {
            const { data, error } = await regularUser.sb
                .from('blog_post')
                .select('*')
                .eq('id', blogPostId);

            expect(error).toBeNull();
            expect(data).toHaveLength(0);
        });

        it('regular user can read published blog posts', async () => {
            // First publish the post
            await adminClient
                .from('blog_post')
                .update({ is_published: true })
                .eq('id', blogPostId)
                .single();

            const { data, error } = await regularUser.sb
                .from('blog_post')
                .select('*')
                .eq('id', blogPostId);

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].id).toBe(blogPostId);
        });

        it('regular user cannot update blog posts', async () => {
            const { error } = await regularUser.sb
                .from('blog_post')
                .update(updateTestData('by Regular User'))
                .eq('id', blogPostId)
                .single();

            expect(error).not.toBeNull();
        });

        it('regular user cannot delete blog posts', async () => {
            const { error } = await regularUser.sb
                .from('blog_post')
                .delete()
                .eq('id', blogPostId)
                .single();

            expect(error).not.toBeNull();
        });

        it('regular user cannot toggle publish status', async () => {
            const { error } = await regularUser.sb
                .from('blog_post')
                .update({ is_published: true })
                .eq('id', blogPostId)
                .single();

            expect(error).not.toBeNull();
        });
    });

    describe('Audit Fields', () => {
        let blogPostId: string;

        beforeEach(async () => {
            const { data: item } = await adminClient
                .from('blog_post')
                .insert(createTestData('Audit Test'))
                .select()
                .single();

            if (!item) throw new Error('Failed to create test blog post');
            blogPostId = item.id;
        });

        it('created_by and created_date are set on creation', async () => {
            const { data } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();

            expect(data?.created_by).toBeDefined();
            expect(data?.created_date).toBeDefined();
        });

        it('updated_by and updated_date are set on update', async () => {
            // Get initial values
            const { data: initialData } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();

            const initialUpdatedDate = initialData?.updated_date;

            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update the post
            await adminClient
                .from('blog_post')
                .update(updateTestData('Audit'))
                .eq('id', blogPostId)
                .single();

            // Get updated values
            const { data: updatedData } = await adminClient
                .from('blog_post')
                .select()
                .eq('id', blogPostId)
                .single();

            expect(updatedData?.updated_date).toBeDefined();
            expect(updatedData?.updated_date).not.toBe(initialUpdatedDate);
        });
    });

    describe('Public Access', () => {
        let blogPostId: string;

        beforeEach(async () => {
            const { data: item } = await adminClient
                .from('blog_post')
                .insert(createTestData('Public Test'))
                .select()
                .single();

            if (!item) throw new Error('Failed to create test blog post');
            blogPostId = item.id;
        });

        it('public user can read published blog posts', async () => {
            // First publish the post
            await adminClient
                .from('blog_post')
                .update({ is_published: true })
                .eq('id', blogPostId)
                .single();

            const { data, error } = await publicUser.sb
                .from('blog_post')
                .select('*')
                .eq('id', blogPostId);

            expect(error).toBeNull();
            expect(data).toHaveLength(1);
            expect(data?.[0].id).toBe(blogPostId);
        });

        it('public user cannot read unpublished blog posts', async () => {
            const { data, error } = await publicUser.sb
                .from('blog_post')
                .select('*')
                .eq('id', blogPostId);

            expect(error).toBeNull();
            expect(data).toHaveLength(0);
        });

        it('public user cannot create blog posts', async () => {
            const { error } = await publicUser.sb
                .from('blog_post')
                .insert(createTestData('by Public'))
                .single();

            expect(error).not.toBeNull();
        });

        it('public user cannot update blog posts', async () => {
            const { error } = await publicUser.sb
                .from('blog_post')
                .update(updateTestData('by Public'))
                .eq('id', blogPostId)
                .single();

            expect(error).not.toBeNull();
        });

        it('public user cannot delete blog posts', async () => {
            const { error } = await publicUser.sb
                .from('blog_post')
                .delete()
                .eq('id', blogPostId)
                .single();

            expect(error).not.toBeNull();
        });
    });
});
