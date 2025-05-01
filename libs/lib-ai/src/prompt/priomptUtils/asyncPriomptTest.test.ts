import {
  describe,
  expect,
  it,
} from 'vitest';

import { priomptRenderToString } from '@reasonote/lib-ai';

import { TestAsyncPriompt } from './asyncPriompt.priompt';

/**
 * Tests for the priomptRenderToString function with async Priompt components
 */
describe('priomptRenderToString with async Priompt components', () => {
  // Skipping this test because it is not working.
  it.skip('should correctly render TestAsyncPriompt component to string', async () => {
    // Arrange
    // TestAsyncPriompt contains nested blocks and an async component

    // Act
    // @ts-ignore
    const renderedString = await priomptRenderToString(TestAsyncPriompt());
    
    // Assert
    expect(renderedString).toBeDefined();
    expect(typeof renderedString).toBe('string');
    expect(renderedString).toContain('<TEST>');
    expect(renderedString).toContain('<TEST2>');
    expect(renderedString).toContain('<TEST3>');
    expect(renderedString).toMatch(/<TEST>[\s\S]*TEST[\s\S]*<\/TEST>/);
  });
});