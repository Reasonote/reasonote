import {
  expect,
  test,
} from '@playwright/test';

import { createTestUser } from '../../vitest/utils/testClient';

test.describe('ShareModal', () => {
  let ownerUser: Awaited<ReturnType<typeof createTestUser>>;
  let viewerUser: Awaited<ReturnType<typeof createTestUser>>;
  let lessonId: string;

  test.beforeAll(async () => {
    ownerUser = await createTestUser('owner@test.com', 'password123');
    viewerUser = await createTestUser('viewer@test.com', 'password123');

    // Create a test lesson
    const { data: lesson } = await ownerUser.sb
      .from('lesson')
      .insert({ _name: 'Test Lesson' })
      .select()
      .single();

    if (!lesson) throw new Error('Failed to create test lesson');
    lessonId = lesson.id;
  });

  test.beforeEach(async ({ page, context }) => {
    // Get the session
    const signinresult = await ownerUser.sb.auth.signInWithPassword({
      email: 'owner@test.com',
      password: 'password123'
    });

    const session = signinresult.data.session;
    if (!session?.access_token) throw new Error('No session token found');


    await context.addCookies([{
        name: 'supabase-auth-token',
        value: JSON.stringify([
            session.access_token,
            session.refresh_token,
            null,
            null,
            null
        ]),
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
    }]);

    // Navigate to the lesson page
    await page.goto(`/app/lessons/${lessonId}/edit`);

 
    // Open share modal
    await page.click('[data-testid="lesson-share-button"]');
 
    // Wait for modal to be visible
    await expect(page.locator('[data-testid="share-email-section"]')).toBeVisible();
  });

  test.afterEach(async () => {
    // Clean up any added memauth entries
    await ownerUser.sb.from('memauth')
      .delete()
      .eq('resource_entity_id', lessonId)
      .neq('access_level', 'owner');
  });

  test('basic sharing functionality', async ({ page }) => {
    console.log('Starting test');
    // Test email input
    await page.fill('[data-testid="share-email-input"]', 'test@example.com');
    await page.keyboard.press('Enter');
    
    // Verify email chip appears
    await expect(page.locator('[data-testid="share-email-chip-test@example.com"]')).toBeVisible();
    
    // Test share button
    await page.click('[data-testid="share-submit-button"]');
    
    // Verify success toast
    await expect(page.getByText('Successfully shared with 1 recipient')).toBeVisible();
  });

  test('managing existing users', async ({ page }) => {
    // Add a viewer first
    await ownerUser.sb.from('memauth').insert({
      resource_entity_id: lessonId,
      access_level: 'viewer',
      principal_user_id: viewerUser.rsnUserId
    });

    // Refresh page to see new user
    await page.reload();
    await page.click('[data-testid="lesson-share-button"]');

    // Check if viewer is listed
    const viewerItem = page.locator(`[data-testid="share-user-item-${viewerUser.rsnUserId}"]`);
    await expect(viewerItem).toBeVisible();

    // Change role to editor
    const roleSelect = page.locator(`[data-testid="share-role-select-${viewerUser.rsnUserId}"]`);
    await roleSelect.click();
    await page.getByRole('option', { name: 'Editor' }).click();

    // Verify success toast
    await expect(page.getByText('Successfully updated access level')).toBeVisible();

    // Remove access
    await page.click(`[data-testid="share-remove-user-${viewerUser.rsnUserId}"]`);
    
    // Verify success toast
    await expect(page.getByText('Successfully removed access')).toBeVisible();
    
    // Verify user is removed
    await expect(viewerItem).not.toBeVisible();
  });

  test('copy link functionality', async ({ page }) => {
    await page.click('[data-testid="share-copy-link-button"]');
    await expect(page.getByText('Link copied to clipboard')).toBeVisible();
  });

  test('public access toggle', async ({ page }) => {
    const publicToggle = page.locator('[data-testid="share-public-toggle"]');
    
    // Toggle public access on
    await publicToggle.click();
    await expect(publicToggle).toBeChecked();
    await expect(page.getByText('Link sharing enabled')).toBeVisible();
    
    // Verify link button is available
    await expect(page.locator('[data-testid="share-copy-link-button"]')).toBeVisible();
    
    // Toggle public access off
    await publicToggle.click();
    await expect(publicToggle).not.toBeChecked();
    await expect(page.getByText('Link sharing disabled')).toBeVisible();
  });

  test('email validation', async ({ page }) => {
    const emailInput = page.locator('[data-testid="share-email-input"]');
    
    // Test invalid email
    await emailInput.fill('invalid-email');
    await emailInput.press('Enter');
    
    // Verify no chip is created for invalid email
    await expect(page.locator('[data-testid="share-email-chip-invalid-email"]')).not.toBeVisible();
    
    // Test valid email
    await emailInput.clear();
    await emailInput.fill('valid@email.com');
    await emailInput.press('Enter');
    
    // Verify chip is created for valid email
    await expect(page.locator('[data-testid="share-email-chip-valid@email.com"]')).toBeVisible();
  });
}); 