import {
  expect,
  test,
} from '@playwright/test';

import { loginAsSystem } from '../_helpers/loginAsSystem';

test.describe('Simple Chat', () => {
    test('Logged In User Can Create & Send Chat', async ({ page }) => {
        test.setTimeout(60000)
        await loginAsSystem(test, page);

        // Find the element "New Chat" on the page and click it
        await page.locator('text=New Chat').click();

        // Wait for the page to load, grab the id from the route
        await page.waitForURL('**/app/chat/chat_**');
        const url = page.url();
        const id = url.split('/').pop();

        await page.waitForTimeout(5000);

        // Try to find the chat text field
        const chatTextField = await page.getByTestId(`chat-text-field-${id}`);

        // Type a message into the chat text field
        const userMessage = 'Please concatenate the strings "Hello " and "World" and send the result to the chat. Do NOT say anything else.'
        await chatTextField.fill(userMessage); 

        const chatSendButton = await page.getByTestId(`chat-send-button-${id}`);
        await chatSendButton.click();
        
        await page.waitForTimeout(5000);
        
        // Make sure the text field is now empty
        const chatTextFieldValue = await chatTextField.innerText();
        expect(chatTextFieldValue.trim()).toBe('');
        
        // Try to find the chat text field
        const userChatMessage = await page.locator(`text=${userMessage}`).first();

        expect(userChatMessage).not.toBeNull();

        const botResponseMsg = await page.locator('text=Hello World').first();
        expect(botResponseMsg).not.toBeNull();


        // Refresh page and make sure still true
        await page.reload();
        test.setTimeout(60000)
        await page.waitForTimeout(5000);

        // Make sure the text field is now empty
        const chatTextFieldValueAfter = await chatTextField.innerText();
        expect(chatTextFieldValueAfter.trim()).toBe('');
        
        // Try to find the chat text field
        const userChatMessageAfter = await page.locator(`text=${userMessage}`).first();

        expect(userChatMessageAfter).not.toBeNull();

        const botResponseMsgAfter = await page.locator('text=Hello World').first();
        expect(botResponseMsgAfter).not.toBeNull();
    });
})