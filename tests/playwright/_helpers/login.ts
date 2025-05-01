

export async function login({test, page, email, password}: {test: any, page: any, email: string, password: string}){
    // Step 1: Navigate to login
    await page.goto('/app/login');

    // Step 2: Type username and password
    const emailField = page.getByTestId('login-email-input');
    await emailField.fill(email);
    const passwordField = page.getByTestId('login-password-input');
    await passwordField.fill(password);
    
    await page.locator('#MAIN_PAGE_CONTENT').getByRole('button', { name: 'Login' }).click();
    
    await page.waitForSelector('text=You are logged in.');
}