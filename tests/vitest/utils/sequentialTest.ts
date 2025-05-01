import { trimAllLines } from '@lukebechtel/lab-ts-utils';
import { it } from 'vitest';

class Sequentializer {
  private testOrder: string[] = [];
  private completedTests = new Set<string>();

  sequentialIt = (name: string, fn: () => Promise<void>) => {
    // Store test name in order
    this.testOrder.push(name);
   
    return it(name, async () => {
      // Check if all previous tests have been run
      const currentIndex = this.testOrder.indexOf(name);
      const previousTests = this.testOrder.slice(0, currentIndex);

      const missingTests = previousTests.filter(test => !this.completedTests.has(test));
      if (missingTests.length > 0) {
        throw new Error(
          trimAllLines(`
            Test "${name}" cannot run in isolation before its prerequisites: ${missingTests.map(test => `"${test}"`).join(', ')}
            
            HINT: Try running the entire suite of tests.
          `)
        );
      }

      // Run the test
      await fn();

      // Mark this test as completed
      this.completedTests.add(name);
    });
  }

  reset = () => {
    this.testOrder = [];
    this.completedTests.clear();
  }
}

export const createSequentializer = () => new Sequentializer(); 