import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { Database } from '@reasonote/lib-sdk';
import { SupabaseClient } from '@supabase/supabase-js';

import { createTestUser } from '../utils/testClient';

describe('reference table', () => {
    let ownerUser: { sb: SupabaseClient<Database>, rsnUserId: string };

    beforeAll(async () => {
        ownerUser = await createTestUser('referencetests@example.com', 'test123456');
    });

    async function createRsnVec(content: string) {
        // Create a new rsn_page to use as the parent of the rsn_vec
        const { data: page, error: pageError } = await ownerUser.sb
            .from('rsn_page')
            .insert({
                _name: 'Test Page',
                body: 'Test Document',
            })
            .select()
            .single();

        if (pageError || !page) {
            throw new Error('Error creating rsn_page: ' + pageError.message);
        }

        const { data: vec, error } = await ownerUser.sb
            .from('rsn_vec')
            .insert({
                raw_content: content,
                content_offset: 0,
                _ref_id: page.id
            })
            .select()
            .single();
        expect(error).toBeNull();
        return vec!;
    }

    describe('Foreign Key Constraints', () => {
        it('should enforce foreign key constraint with rsn_vec table', async () => {
            // Attempt to create a reference with non-existent rsn_vec_id
            const { error } = await ownerUser.sb
                .from('reference')
                .insert({
                    raw_content: 'Test reference content',
                    is_exact: true,
                    rsn_vec_id: 'rsnv_nonexistent',
                    _ref_id: 'test_ref'
                });

            expect(error).not.toBeNull();
            expect(error!.message).toContain('foreign key constraint');

            // Create a valid rsn_vec first
            const vec = await createRsnVec('Test vector content');

            // Now create a reference with valid rsn_vec_id
            const { data: reference, error: refError } = await ownerUser.sb
                .from('reference')
                .insert({
                    raw_content: 'Test reference content',
                    is_exact: true,
                    rsn_vec_id: vec.id,
                    _ref_id: 'test_ref'
                })
                .select()
                .single();

            expect(refError).toBeNull();
            expect(reference).not.toBeNull();
            expect(reference!.rsn_vec_id).toBe(vec.id);
        });
    });
});
