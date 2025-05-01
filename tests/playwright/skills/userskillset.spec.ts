import { test } from '@playwright/test';

import { loginAsSystem } from '../_helpers/loginAsSystem';

test.describe('Skill Set Page', () => {
    test('Logged In User Sees Skill Set Page', async ({ page }) => {
        test.setTimeout(10000)
        await loginAsSystem(test, page);

        await page.goto('/app/skills');

        await page.waitForSelector('text=Skill Sets');
        await page.waitForSelector('text=Your Skill Set');
    });
})