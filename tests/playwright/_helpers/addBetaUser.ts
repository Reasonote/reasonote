import {
  Page,
  test as ptest,
} from '@playwright/test';

import { login } from './login';
import { loginAsSystem } from './loginAsSystem';
import { signupRandomNewUser } from './signupNewUser';

export async function signupNewBetaUser({test, page}: {test: typeof ptest, page: Page}){
    const {email, password} = await signupRandomNewUser({test, page});

    await page.goto('/app/logout');

    await page.waitForURL('/app/login');

    await loginAsSystem(test, page);

    await page.goto('/app/admin/users/add-beta-user')

    await page.getByTestId('add-beta-user-email-input').fill(email);

    await page.getByTestId('SendIcon').click();

    await page.waitForSelector('text="affectedCount": 1')

    await page.goto('/app/logout');
    await page.waitForURL('/app/login');

    await login({test, page, email, password});
}