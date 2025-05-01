import type * as tiktoken from 'js-tiktoken';

import { getEncoding } from '@langchain/core/utils/tiktoken';

import { AI } from '../AI';

export class AITokens {
    constructor(readonly ai: AI){}

    private _tokenizer?: tiktoken.Tiktoken;

    async getTokenizer(){
        if(!this._tokenizer){
            this._tokenizer = await getEncoding('gpt2');
        }

        return this._tokenizer;
    }

    async encode(text: string): Promise<number[]> {
        const tokenizer = await this.getTokenizer();
        return tokenizer.encode(text);
    }

    async decode(tokens: number[]): Promise<string> {
        const tokenizer = await this.getTokenizer();
        return tokenizer.decode(tokens);
    }
}