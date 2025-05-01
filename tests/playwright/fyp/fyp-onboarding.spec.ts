import { test } from '@playwright/test';

import { signupNewBetaUser } from '../_helpers/addBetaUser';

test.describe('FYP Onboarding', () => {
    test('Onboarding to fyp', async ({ page}, testInfo) => {
        test.setTimeout(90_000)
        await signupNewBetaUser({test, page});

        await page.goto('/app/foryou');

        await page.waitForTimeout(5000)

        const foryoubutton = await page.getByTestId('fyp-choose-intent-screen-card-for-you');
        await foryoubutton.click();

        // Without any skills, the user should receive a greeting
        await page.waitForSelector('text=Welcome to Reasonote!');
        
        await page.waitForTimeout(4000);
        // Add a skill
        const allSkills = await page.locator('.rsn-skill-chip-add-button').all();

        await Promise.all(allSkills.map(async (skill) => await skill.click()))

        await page.waitForTimeout(2000);

        await page.getByRole('button', { name: 'Let\'s Go' }).click();

        await page.getByTestId('fyp-activity-loaded').waitFor({state: 'visible'});
    });
})