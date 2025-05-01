import {
  expect,
  Page,
  test,
} from '@playwright/test';

import { createTestUser } from '../../vitest/utils/testClient';

async function waitForCompleteMessage(page: Page, messageIndex: number = 0) {
  await page.waitForFunction(
    ([index]) => {
      const messages = document.querySelectorAll('[data-testid="assistant-message"]');
      return messages.length > index;
    },
    [messageIndex],
    { timeout: 30000, polling: 1000 }
  );
  return page.getByTestId('assistant-message').nth(messageIndex);
}

test.describe('ClassroomAI', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let skillId: string;

  test.beforeAll(async () => {
    user = await createTestUser('classroom@test.com', 'password123');

    // Create a test skill
    const { data: skill } = await user.sb
      .from('skill')
      .insert({ _name: 'Test Python Programming' })
      .select()
      .single();

    if (!skill) throw new Error('Failed to create test skill');
    skillId = skill.id;
  });

  test.beforeEach(async ({ page, context }) => {
    // Get the session
    const signinresult = await user.sb.auth.signInWithPassword({
      email: 'classroom@test.com',
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
  });

  test('first time user experience', async ({ page }) => {
    // Navigate to the classroom page
    await page.goto(`/app/skills/${skillId}/classroom`);

    // Wait for the complete initial message
    const initialMessage = await waitForCompleteMessage(page, 0);
    const initialText = await initialMessage.textContent();
    
    // Verify it asks about learning goals
    expect(initialText?.toLowerCase()).toContain('welcome to');
    expect(initialText?.toLowerCase()).toContain('test python programming');
    expect(initialText?.toLowerCase()).toMatch(/why do you want to learn|what are your reasons/);

    // Input learning goals
    await page.fill('[data-testid="user-input"]', 'I want to build web applications');
    await page.click('[data-testid="send-message"]');

    // Wait for level question
    const levelMessage = await waitForCompleteMessage(page, 1);
    const levelText = await levelMessage.textContent();
    
    // Verify it asks about skill level
    expect(levelText?.toLowerCase()).toMatch(/what best describes your level|how much experience|how familiar are you/);

    // Input level
    await page.fill('[data-testid="user-input"]', 'Beginner');
    await page.click('[data-testid="send-message"]');

    // Wait for interests question
    const interestsMessage = await waitForCompleteMessage(page, 2);
    const interestsText = await interestsMessage.textContent();
    
    // Verify it asks about specific interests
    expect(interestsText?.toLowerCase()).toMatch(/most interested in learning|specific interests|specifics/);

    // Input interests
    await page.fill('[data-testid="user-input"]', 'Web frameworks and databases');
    await page.click('[data-testid="send-message"]');

    // Verify it moves to lesson suggestions
    const finalMessage = await waitForCompleteMessage(page, 3);
    const finalText = await finalMessage.textContent();
    expect(finalText?.toLowerCase()).toContain('some lessons');
  });

  test('returning user experience', async ({ page }) => {
    // First, ensure user has existing data
    await user.sb.from('user_skill').upsert({
      rsn_user: user.rsnUserId,
      skill: skillId,
      interest_reasons: ['Build web applications'],
      self_assigned_level: 'beginner',
      specifics: ['Web frameworks', 'Databases']
    });

    // Navigate to the classroom page
    await page.goto(`/app/skills/${skillId}/classroom`);

    // Wait for welcome back message
    const welcomeMessage = await waitForCompleteMessage(page, 0);
    const welcomeText = await welcomeMessage.textContent();

    // Verify welcome back format
    // expect(welcomeText?.toLowerCase()).toContain('welcome back');
    // expect(welcomeText?.toLowerCase()).toMatch(/did you know|fun fact/);
    
    // Verify it doesn't ask about goals/level/interests
    expect(welcomeText?.toLowerCase()).not.toContain('why do you want to learn');
    expect(welcomeText?.toLowerCase()).not.toContain('what best describes your level');
    expect(welcomeText?.toLowerCase()).not.toContain('what are you most interested in');

    // Verify it shows the next steps
    expect(welcomeText?.toLowerCase()).toContain('to continue');
    expect(welcomeText?.toLowerCase()).toContain('click on the lessons tab');
    expect(welcomeText?.toLowerCase()).toContain('ask me to create new lessons');
    expect(welcomeText?.toLowerCase()).toContain('or ask me any questions');
  });

  test('lesson flow from slides to practice', async ({ page, }) => {
    // This test should have a timeout of 120 seconds
    test.setTimeout(120_000);
    
    // First, ensure user has existing data
    await user.sb.from('user_skill').upsert({
      rsn_user: user.rsnUserId,
      skill: skillId,
      interest_reasons: ['Build web applications'],
      self_assigned_level: 'beginner',
      specifics: ['Web frameworks', 'Databases']
    });

    // Navigate to the classroom page
    await page.goto(`/app/skills/${skillId}/classroom`);

    // Wait for initial message
    await waitForCompleteMessage(page, 0);

    // Request some lessons
    await page.fill('[data-testid="user-input"]', "Can you create some lessons about Python basics? I am a beginner, and I want to learn about Web frameworks and databases, because I want to build web applications.");
    await page.click('[data-testid="send-message"]');

    // Wait for AI response about creating lessons
    const lessonResponse = await waitForCompleteMessage(page, 1);
    const lessonResponseText = await lessonResponse.textContent();

    // Click on the lessons tab
    await page.click('[data-testid="lesson-tab"]');

    // Wait for lessons to load and click on the first lesson
    await page.waitForSelector('[data-testid="lesson-card"]', { timeout: 60_000 });
    await page.click('[data-testid="lesson-card"]');

    // Wait for the first slide to appear
    await page.waitForSelector('[data-testid="concept-card"]', { timeout: 30000 });

    // Verify slide content is visible
    const slideTitle = await page.textContent('[data-testid="concept-card-title"]', { timeout: 30000 });
    expect(slideTitle).toBeTruthy();
    
    const slideContent = await page.textContent('[data-testid="concept-card-content"]');
    expect(slideContent).toBeTruthy();

    var activityWasFound = false;

    // Keep clicking Next/Start Practice until we see an activity
    const startTime = Date.now();
    while (Date.now() - startTime < 90_000) { // 90 second timeout
      // Check if activity is already visible
      const activityVisible = await page.getByTestId('activity-body').count() > 0;
      if (activityVisible) {
        activityWasFound = true;
        break;
      }

      // Check if button is visible
      const button = await page.getByTestId('slide-next-button');
      if (await button.count() > 0) {
        // If button is visible, click it
        await button.click();
        await page.waitForTimeout(100);
      } else {
        // If button is not visible, hang out and wait to loop
        await page.waitForTimeout(500);
      }
    }

    // Verify activity content is visible
    expect(activityWasFound).toBe(true);
  });

  test.afterEach(async () => {
    // Clean up user_skill data
    await user.sb
      .from('user_skill')
      .delete()
      .eq('rsn_user', user.rsnUserId)
      .eq('skill', skillId);
  });

  test.afterAll(async () => {
    // Clean up skill
    await user.sb
      .from('skill')
      .delete()
      .eq('id', skillId);
  });
}); 