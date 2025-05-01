import {
  expect,
  test,
} from '@playwright/test';

test.describe('Reset Password', () => {
    test('Reset Password for Known User', async ({ page }) => {
        test.setTimeout(15000)
        // Step 1: Navigate to login
        await page.goto('/app/reset-password');

        // Step 2: Type username and password
        const emailField = await page.getByTestId('reset-password-email');
        expect(emailField).not.toBeNull();
        await emailField.fill('system@reasonote.com');
       
        await page.locator('#MAIN_PAGE_CONTENT').getByRole('button', { name: 'Send Email' }).click();
        
        await page.waitForSelector('text=An email has been sent to your inbox. Follow the instructions there to reset your password.');
    });
})