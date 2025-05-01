import {
  describe,
  expect,
  it,
} from 'vitest';

import { createDefaultStubAI } from '@reasonote/lib-ai/src/DefaultStubAI';

import { latexFixer } from '../latexFixer';

describe('latexFixer', () => {
    const ai = createDefaultStubAI();

    it('should fix basic LaTeX expressions', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'The fraction $\\frac{1}{2}$ is correct',
                'Here\'s code: `console.log(\'hi\')`',
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'The fraction <latex>\\frac{1}{2}</latex> is correct',
            'Here\'s code: `console.log(\'hi\')`',
        ]);
    }, {timeout: 10000});

    it('should handle multiple LaTeX expressions in one string', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'First fraction $\\frac{1}{2}$ and second fraction $\\frac{3}{4}$'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'First fraction <latex>\\frac{1}{2}</latex> and second fraction <latex>\\frac{3}{4}</latex>'
        ]);
    }, {timeout: 10000});

    it('should preserve code blocks', async () => {
        const result = await latexFixer({
            stringsToFix: [
                '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```'
        ]);
    }, {timeout: 10000});

    it('should fix incorrectly wrapped code', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'Incorrectly Wrapped Code: <latex>console.log("hi")</latex>'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'Incorrectly Wrapped Code: `console.log("hi")`'
        ]);
    }, {timeout: 10000});

    it('should handle mixed content correctly', async () => {
        const result = await latexFixer({
            stringsToFix: [
                `For <latex>(a + bi) \\cdot (c + di)</latex>, you will:
                1. Here's some code: \`multiply(a, c)\`
                2. And some LaTeX: $a \\cdot di$
                3. More code:
                \`\`\`javascript
                const result = multiply(bi, c);
                \`\`\`
                4. Final LaTeX: $(bi \\cdot di)$ because $i^2 = -1$`
            ]
        }, ai);

        const output = result.fixedLatexStrings[0];
        
        expect(output).toContain('<latex>(a + bi) \\cdot (c + di)</latex>');
        expect(output).toContain('`multiply(a, c)`');
        expect(output).toContain('<latex>a \\cdot di</latex>');
        
        expect(output).toContain(
            '```javascript\n                const result = multiply(bi, c);\n                ```'
        );
        
        expect(output).toContain('<latex>(bi \\cdot di)</latex>');
        expect(output).toContain('<latex>i^2 = -1</latex>');
    }, {timeout: 10000});

    it('should handle double dollar signs correctly', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'This is a display equation: $$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'This is a display equation: <latex>\\sum_{i=1}^n i = \\frac{n(n+1)}{2}</latex>'
        ]);
    }, {timeout: 10000});

    it('should not modify already correct latex tags', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'Already correct: <latex>\\frac{1}{2}</latex>'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'Already correct: <latex>\\frac{1}{2}</latex>'
        ]);
    }, {timeout: 10000});

    it('should handle strings with no latex content', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'Plain text without any latex',
                'Code only: `const x = 1`'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'Plain text without any latex',
            'Code only: `const x = 1`'
        ]);
    }, {timeout: 10000});

    it('should handle nested code blocks within latex correctly', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'Consider the function $f(x) = \\text{`x + 1`}$'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'Consider the function <latex>f(x) = \\text{`x + 1`}</latex>'
        ]);
    }, {timeout: 10000});

    /**
     * TODO: In the future, we should differentiate between inline and display mode LaTeX.
     * Display mode ($$) is typically used for centered, standalone equations,
     * while inline mode ($) is used for math within text flow.
     * 
     * We should use <latex-display> for display mode to allow different styling/positioning.
     * Currently disabled until we update the frontend renderer to support this.
     */
    /*
    it('should handle display mode equations differently from inline mode', async () => {
        const result = await latexFixer({
            stringsToFix: [
                'Inline equation $x^2$ in text.',
                'Display equation: $$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$'
            ]
        }, ai);

        expect(result.fixedLatexStrings).toEqual([
            'Inline equation <latex>x^2</latex> in text.',
            'Display equation: <latex-display>\\sum_{i=1}^n i = \\frac{n(n+1)}{2}</latex-display>'
        ]);
    }, {timeout: 10000});
    */

    it('should quickly return unmodified strings when no LaTeX is present (<1.5s)', async () => {
        const testStrings = [
            'Plain text without any math',
            'Code example: `const x = 1`',
            '```typescript\nfunction test() {\n  return true;\n}```',
            'Regular text with *markdown* and [links](https://example.com)',
            'Numbers like 1/2 without $ signs'
        ];
        
        const startTime = performance.now();
        
        const result = await latexFixer({
            stringsToFix: testStrings
        }, ai);
        
        const duration = performance.now() - startTime;
        
        // Verify timing
        expect(duration).toBeLessThan(1500);
        
        // Verify strings are unchanged
        expect(result.fixedLatexStrings).toEqual(testStrings);
    }, {timeout: 10000});
}); 