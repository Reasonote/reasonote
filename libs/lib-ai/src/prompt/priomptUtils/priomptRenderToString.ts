import {
  PromptElement,
  render,
} from '@anysphere/priompt';
import {
  getTokenizerByName_ONLY_FOR_OPENAI_TOKENIZERS,
} from '@anysphere/priompt/dist/tokenizer';

export async function priomptRenderToString(element: PromptElement, options: {
    tokenLimit?: number;
    tokenizer?: string;
} = {}) {
    // console.debug('priomptRenderToString called with element:', 
    //     typeof element, 
    //     element && typeof element === 'object' ? Object.keys(element) : element
    // );
    
    try {
        const tokenizer = getTokenizerByName_ONLY_FOR_OPENAI_TOKENIZERS(options.tokenizer as any ?? 'cl100k_base');
        // console.log('Using tokenizer:', tokenizer?.name);
        
        const result = await render(element, {
            tokenLimit: options.tokenLimit ?? 1_000_000_000,
            tokenizer: tokenizer,
        });

        // console.log('priomptRenderToString result type:', typeof result);
        // console.log('priomptRenderToString result keys:', Object.keys(result));

        if (typeof result.prompt === 'string') {
            return result.prompt;
        } else {
            console.warn('priomptRenderToString: result.prompt is not a string', 
                typeof result.prompt, 
                result.prompt && typeof result.prompt === 'object' ? `Object: ${JSON.stringify(result.prompt)}` : result.prompt
            );
            return '';
        }
    } catch (error) {
        console.error('Error in priomptRenderToString:', error);
        throw error;
    }
}
