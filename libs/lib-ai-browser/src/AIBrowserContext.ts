import _ from 'lodash';

export interface AIBrowserContextConstructorArgs {
    /**
     * The url of the host for this context.
     */   
    hostUrl: string | (() => string);

    /**
     * The url of the host for this context.
     */
    hostUrlTextStream?: string | (() => string);

    /**
     * Custom fetch
     */
    fetch?: typeof fetch;
}


export class AIBrowserContext {    
    constructor(
        readonly args: AIBrowserContextConstructorArgs
    ){}

    get hostUrl(){
        return _.isFunction(this.args.hostUrl) ? this.args.hostUrl() : this.args.hostUrl;
    }

    get hostUrlTextStream(){
        return _.isFunction(this.args.hostUrlTextStream) ? this.args.hostUrlTextStream() : this.args.hostUrlTextStream;
    }

    get fetch(){
        return this.args.fetch ?? fetch;
    }
}