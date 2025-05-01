import { test } from '@playwright/test';

test.describe('Signup Unkown User', () => { 
    test('Signup unknown user', async ({ page }) => {
        test.setTimeout(15000)
        // Step 1: Navigate to login
        await page.goto('/app/login');

        // Click Sign Up
        await page.locator('text=Sign Up').click();

        // Step 2: Type username and password
        const emailField = page.getByTestId('signup-email-input');
        await emailField.fill(`${1+Math.random()}@fakeuser.com`);
        const passwordField = page.getByTestId('signup-password-input');
        await passwordField.fill('fakepassword');
        const firstNameField = page.getByTestId('signup-firstname-input');
        await firstNameField.fill('Faker');
       
        await page.getByTestId('signup-button').click();
        
        await page.waitForSelector('text=You are logged in.');
    });

    test('Signup unknown user goes to waitlist page', async ({ page }) => {
        test.setTimeout(15000)
        // Step 1: Navigate to login
        await page.goto('/app/login');

        // Click Sign Up
        await page.locator('text=Sign Up').click();

        // Step 2: Type username and password
        const emailField = page.getByTestId('signup-email-input');
        await emailField.fill(`${1+Math.random()}@fakeuser.com`);
        const passwordField = page.getByTestId('signup-password-input');
        await passwordField.fill('fakepassword');
        const firstNameField = page.getByTestId('signup-firstname-input');
        await firstNameField.fill('Faker');
       
        await page.getByTestId('signup-button').click();
        
        await page.waitForSelector('text=You are logged in.');

        // This should eventually redirect us to a page that says we're on the waitlist
        await page.waitForSelector("text=You're on the waitlist!");
    });
})