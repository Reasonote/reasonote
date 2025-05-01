export async function signupRandomNewUser({test, page}){
    // Step 1: Navigate to login
    await page.goto('/app/login');

    // Click Sign Up
    await page.locator('text=Sign Up').click();

    const email = `${1+Math.random()}@fakeuser.com`;
    const password = 'fakepassword';

    // Step 2: Type username and password
    const emailField = page.getByTestId('signup-email-input');
    await emailField.fill(email);
    const passwordField = page.getByTestId('signup-password-input');
    await passwordField.fill(password);
    const firstNameField = page.getByTestId('signup-firstname-input');
    await firstNameField.fill('Faker');
   
    await page.getByTestId('signup-button').click();
    
    await page.waitForSelector('text=You are logged in.');

    return {
        email,
        password
    }
}