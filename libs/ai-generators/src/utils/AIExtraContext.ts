
export interface AIExtraContextArgs {
    title: string;
    appliesWhen?: string;
    body?: string;
    description?: string;
}

export class AIExtraContext implements AIExtraContextArgs {
    readonly title: string;
    readonly description?: string;
    readonly appliesWhen?: string;
    readonly body?: string;

    constructor({
        title,
        description,
        appliesWhen,
        body,
    }: AIExtraContextArgs) {
        this.title = title;
        this.description = description;
        this.appliesWhen = appliesWhen;
        this.body = body;
    }

    static make(args: AIExtraContextArgs) {
        return new AIExtraContext({
            title: args.title,
            appliesWhen: args.appliesWhen,
            body: args.body,
        });
    }

    toPrompt() {
        return `
            <${this.title} ${this.description ? `description="${this.description}"` : ''} ${this.appliesWhen ? `appliesWhen="${this.appliesWhen}"` : ''}>
                <BODY description="The context body">
                    ${this.body ?? ''}
                </BODY>
            </${this.title}>
        `;
    }
}