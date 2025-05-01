import { test } from '@playwright/test';

test.describe('Signup Basic Users', () => {
    test('Signup known user', async ({ page }) => {
        test.setTimeout(15000)
        // Step 1: Navigate to login
        await page.goto('/app/login');

        // Click Sign Up
        await page.locator('text=Sign Up').click();

        // Step 2: Type username and password
        const emailField = page.getByTestId('signup-email-input');
        await emailField.fill('system@reasonote.com');
        const passwordField = page.getByTestId('signup-password-input');
        await passwordField.fill('rootchangeme');
        const firstNameField = page.getByTestId('signup-firstname-input');
        await firstNameField.fill('System');

        await page.getByTestId('signup-button').click();
        
        await page.waitForSelector('text=User already registered. Login?');
    });

})