import { z } from "zod";

/**
 * All ungraded activity types that are hard-coded into the app.
 */
export const ActivityTypesUngraded = [
    // 'narrative',
    'slide',
    // 'socratic'
] as const;

/**
 * Schema for ungraded activity types that are hard-coded into the app.
 */
export const ActivityTypesUngradedSchema = z.enum(ActivityTypesUngraded);
/**
 * All ungraded activity types that are hard-coded into the app.
 */
export type ActivityTypeUngraded = z.infer<typeof ActivityTypesUngradedSchema>;


/**
 * All internal-only activity types that are hard-coded into the app.
 */
export const ActivityTypesInternalOnly = [
    'user-skill-self-assessment',
] as const;
/**
 * Schema for internal-only activity types that are hard-coded into the app.
 */
export const ActivityTypesInternalOnlySchema = z.enum(ActivityTypesInternalOnly);
/**
 * All internal-only activity types that are hard-coded into the app.
 */
export type ActivityTypeInternalOnly = z.infer<typeof ActivityTypesInternalOnlySchema>;


/**
 * All graded activity types that are hard-coded into the app.
 */
export const ActivityTypesGraded = [
    'flashcard',
    'multiple-choice',
    'fill-in-the-blank',
    'choose-the-blank',
    'teach-the-ai',
    'roleplay',
    'sequence',
    'short-answer',
    'term-matching',
] as const;
/**
 * Schema for graded activity types that are hard-coded into the app.
 */
export const ActivityTypesGradedSchema = z.enum(ActivityTypesGraded);
/**
 * All graded activity types that are hard-coded into the app.
 */
export type ActivityTypeGraded = z.infer<typeof ActivityTypesGradedSchema>;


/**
 * All activity types that are hard-coded into the app.
 */
export const ActivityTypes = [
    ...ActivityTypesUngraded,
    ...ActivityTypesGraded,
] as const;


export const ActivityTypesPublic = [
    'slide',
    'flashcard',
    'multiple-choice',
    'choose-the-blank',
    'term-matching',
    'fill-in-the-blank',
    'short-answer',
    'teach-the-ai',
    'roleplay',
    'sequence',
    // 'socratic'
    // 'narrative'
] as const;
export const ActivityTypesPublicSchema = z.enum(ActivityTypesPublic);

export type ActivityTypePublic = z.infer<typeof ActivityTypesPublicSchema>;


export const ActivityTypeMetadata = {
    'slide': {
        complexityOutOf10: 1,
    },
    'flashcard': {
        complexityOutOf10: 2,
    },
    'multiple-choice': {
        complexityOutOf10: 3,
    },
    'choose-the-blank': {
        complexityOutOf10: 3,
    },
    'sequence': {
        complexityOutOf10: 3,
    },
    'term-matching': {
        complexityOutOf10: 4,
    },
    'fill-in-the-blank': {
        complexityOutOf10: 5,
    },
    'short-answer': {
        complexityOutOf10: 8,
    },
    'teach-the-ai': {
        complexityOutOf10: 9,
    },
    'roleplay': {
        complexityOutOf10: 10,
    },

}


export const ActivityTypesSimple = [
    'flashcard',
    'multiple-choice',
    'choose-the-blank',
    'slide',
    'sequence',
] as const;
export const ActivityTypesSimpleSchema = z.enum(ActivityTypesSimple);

export const ActivityTypesModerate = [
    'fill-in-the-blank',
] as const;
export const ActivityTypesModerateSchema = z.enum(ActivityTypesModerate);

/**
 * Activity types that are particularly complex.
 * 
 * These are generally saved for the end of the lesson, and are rarely shown early in practice mode.
 */
export const ActivityTypesComplex = [
    'roleplay',
    'teach-the-ai',
    'short-answer'
] as const;
/**
 * Schema for activity types that are particularly complex.
 */
export const ActivityTypesComplexSchema = z.enum(ActivityTypesComplex);

/**
 * Schema for all activity types that are hard-coded into the app.
 */
export const ActivityTypesSchema = z.enum(ActivityTypes).describe('All activity types that are hard-coded into the app.');
/**
 * All activity types that are hard-coded into the app.
 */
export type ActivityType = z.infer<typeof ActivityTypesSchema>;
