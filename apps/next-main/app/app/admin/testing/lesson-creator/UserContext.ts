
export interface UserBasicContext {
    name: string;
}

export interface UserSkillContext {
    basics: UserBasicContext;
    reasons: string[];
    selfReportedLevel?: string;
}

export function formatUserSkillContext(userSkillContext: UserSkillContext): string {
    return `
    # User Context

    The user has provided the following reason(s) for studying this skill:
    \`\`\`
    ${userSkillContext.reasons.join('\n')}
    \`\`\`

    ${userSkillContext.selfReportedLevel ? `The user has self-reported their level as: "${userSkillContext.selfReportedLevel}` : ''}
    `;
}