import {
  describe,
  expect,
  it,
} from 'vitest';

import { PriomptSync2 } from './priomptSync.priompt';

/**
 * EXPERIMENTAL: Tests for async hydration with Priompt
 * 
 * This test suite was created as part of an experiment to explore
 * whether we could implement an asynchronous hydration strategy
 * that works effectively with Priompt components.
 * 
 * The experiment aims to validate if Priompt components can be
 * dynamically populated with data from async sources while maintaining
 * the expected component structure and behavior.
 * 
 * These tests are exploratory in nature and not meant for production validation.
 */

/**
   * Tests for the priomptRenderToString function with async Priompt components
   */
  describe('dom-tree like object', () => {
    it('should constuct a dom-tree like object....', () => {
      const result = PriomptSync2();

      expect(result).toBeDefined();


      console.log('RESULT', JSON.stringify(result, null, 2));
    });
  });