

export async function loginAsSystem(test: any, page: any){
    // Step 1: Navigate to login
    await page.goto('/app/login');

    // Step 2: Type username and password
    const emailField = page.getByTestId('login-email-input');
    await emailField.fill('system@reasonote.com');
    const passwordField = page.getByTestId('login-password-input');
    await passwordField.fill('rootchangeme');
    
    await page.locator('#MAIN_PAGE_CONTENT').getByRole('button', { name: 'Login' }).click();
    
    await page.waitForSelector('text=You are logged in.');
}