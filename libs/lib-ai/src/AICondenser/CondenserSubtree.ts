import { AI } from '../AI';
import { AISingleCondenser } from './AICondenser/AISingleCondenser';

export class CondenserSubtree {    
    constructor(readonly ai: AI){

    }

    aiSingle = new AISingleCondenser(this.ai);
}