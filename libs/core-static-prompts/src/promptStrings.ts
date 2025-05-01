import _ from "lodash";

import {
    trimAllLines,
    trimLines,
} from "@lukebechtel/lab-ts-utils";
import {
    ActivityGenerateSkill,
    LessonConfig,
    SkillLevel,
    UserFeeling,
} from "@reasonote/core";
import { Database } from "@reasonote/lib-sdk";

interface AiExplainer {
    title?: string;
    content?: string;
    rules?: string[];
}

interface AiExplainerUserProfileArgs {
    givenName?: string;
    familyName?: string;
    aiContext?: string;
    feelings?: UserFeeling[];
}

interface AiExplainerUserSkillArgs {
    skill: {
        name: string;
    }
    user: {
        givenName?: string;
        familyName?: string;
        aiContext?: string;
    }
    userSkill: {
        selfAssignedLevel?: SkillLevel;
        interestReasons?: string[];
    }
}

interface AiExplainerLessonArgs {
    lessonConfig: LessonConfig;
}

export function aiExplainerFormat(explainer?: AiExplainer | null) {    
    return explainer ?
        trimAllLines(trimLines(`
            <${explainer.title ? `# ${explainer.title}` : ""}>
                ${explainer.content ?? ''}

                <${explainer.rules ? "RULES" : ""}>
                    ${explainer.rules ? explainer.rules.map((r, idx) => `${r}`).join("\n") : ""}
                </${explainer.rules ? "RULES" : ""}>
                
            </${explainer.title ? `# ${explainer.title}` : ""}>
            `))
        :
        '';
}

function formatFeelings(feelings: UserFeeling[]) {
    function formatFeeling(feeling: UserFeeling) {
        const activeTense = (feeling.feeling === "like" || feeling.feeling === 'likes') ? "likes" : "dislikes";
        return `- ${activeTense} the ${feeling.subject_type} "${feeling.subject_name}"`;
    }
    
    return feelings.map((feeling) => formatFeeling(feeling)).join("\n");
}

export function formatMarkdownAdvice() {
    return "Format this in markdown. (NOTE: Always represent math using LaTeX. for LaTeX, you MUST wrap in \"$$...$$\" tags and use double backslashes \"\\\\\")";
}

export const AI_EXPLAINERS = {
    OUTPUT_FORMAT_MARKDOWN_LATEX: {
        title: "Output Format",
        rules: [
            "You can use markdown to format any text outputs.",
            "If you need to render mathematics, you can use $$ ... $$ delimiters to render in LaTeX, i.e. $$\\frac{1}{2}$$ will render as 1/2.",
        ],
    },
    PARAMETER_FORMAT_MARKDOWN_LATEX: {
        content: "Format this in markdown. (NOTE: for LaTeX, you MUST wrap in \"$$ ... $$\" delimiters and use double backslashes \"\\\\\")"
    },
    USER_PROFILE: (args: AiExplainerUserProfileArgs) => ({
        title: "About the User",
        content: trimLines(`
        ${args.aiContext ?
        `## Provided Context
        The user has provided the following information about themselves:
        
        \`\`\`text
        ${args.aiContext}
        \`\`\`
        `
        : ``}

        ${args.feelings && args.feelings.length > 0 ? `
            ## Feelings
            We know the user has the following feelings:
            ${formatFeelings(args.feelings)}
            `
            :
            ''}
        `)
    }),
    USER_SKILL: (args: AiExplainerUserSkillArgs) => ({
        title: "About the User Skill",
        content: `
        # User Skill History
        We know this info about the user's relationship to the skill "${args.skill.name}"
        
        ## Self Assigned Level
        The user's self assigned level is ${args.userSkill.selfAssignedLevel ?? "UNKNOWN"}.

        ## Interest Reasons
        The user's stated reasons for being interested in this skill are:
        ${args.userSkill.interestReasons?.map((reason) => `- "${reason}"`).join("\n") ?? "UNKNOWN"}
        `
    }),
    SKILL_CONTEXT_DOCUMENTS: (skill: ActivityGenerateSkill) => {
        return skill.documents ? 
            ({
                title: `Skill "${skill.name}" Context Documents`,
                content: `
                These docs may help add context to the specific items the user wants to learn about "${skill.name}".

                ${skill.documents.map((doc) => `
                ## ${doc.name ?? "Document"}
                ${doc.pageContent ?? "No content provided."}
                `).join("\n")}
                `
            })
            :
            null;
    },
    SKILL_EXPERT_QUESTIONS: (skill: ActivityGenerateSkill) => {
        return skill.expertQuestions ?
            ({
                title: `Skill "${skill.name}" Expert Questions`,
                content: `
                The user has provided the following expert questions (along with the answers) for the skill "${skill.name}". These are questions that the user should be able to answer once they have achieved mastery of the skill:
                ${skill.expertQuestions.map((question) => `- "${question.question}"\n${question.answer}`).join("\n")}
                Please make sure that the activities you generate cover the same topics as these questions and help the user move towards the goal of being able to answer these questions.
                `
            })
            :
            null;
    },
    LESSON_DB: (args: {lesson: Database['public']['Tables']['lesson']['Row']}) => {
        return AI_EXPLAINERS.LESSON({
            lessonConfig: {
                basic: {
                    name: args.lesson._name ?? '',
                    summary: args.lesson._summary ?? ''
                },
                rootSkillId: '',
                learningObjectives: _.get(args.lesson, 'metadata.learning_objectives') ?? [],
                activities: [],
            }
        })
    },
    LESSON: (args: AiExplainerLessonArgs) => ({
        title: "About the Lesson",
        content: `
        ## Lesson Name
        "${args.lessonConfig.basic.name}"
        ## Lesson Description
        \`\`\`
        ${args.lessonConfig.basic.summary}
        \`\`\`

        ${/**
        TODO: fix
        args.lessonConfig.skillNames.length > 0 ? `
        ## Skills Covered
            ${args.lessonConfig.skillNames.map((skillName) => `- ${skillName}`).join("\n")}
        ` : "" */""}

        ## Learning Objectives
        \`\`\`
        ${args.lessonConfig.learningObjectives?.map((o) => `- "${o.name}"`).join('\n')}
        \`\`\`
        `
    })
}