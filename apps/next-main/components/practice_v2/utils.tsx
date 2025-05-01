
// Note: The system is designed to never downgrade a user's level automatically.
// Once a user reaches a level (BEGINNER -> INTERMEDIATE -> ADVANCED), they will stay
// at that level even if their score drops below the threshold, unless explicitly reset.
export const LEVEL_THRESHOLDS = {
    BEGINNER: 0,
    INTERMEDIATE: 40,
    ADVANCED: 80
};

export const NEXT_LEVEL = {
    BEGINNER: LEVEL_THRESHOLDS.INTERMEDIATE,
    INTERMEDIATE: LEVEL_THRESHOLDS.ADVANCED,
    ADVANCED: 100,
};

export const determineLevel = (score: number): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' => {
    if (score >= LEVEL_THRESHOLDS.ADVANCED) return 'ADVANCED';
    if (score >= LEVEL_THRESHOLDS.INTERMEDIATE) return 'INTERMEDIATE';
    return 'BEGINNER';
};