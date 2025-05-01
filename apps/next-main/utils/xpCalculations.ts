export interface LevelInfo {
    level: number;
    currentLevelXp: number;
    xpForNextLevel: number;
    totalXp: number;
    progress: number; // 0-1 progress to next level
}

export function calculateLevel(totalXp: number): LevelInfo {
    let level = 1;
    let xpRequired = 100; // XP required for level 2
    let totalXpRequired = 0;

    // Calculate level based on XP thresholds
    while (totalXp >= totalXpRequired + xpRequired) {
        totalXpRequired += xpRequired;
        level++;

        if (level <= 10) {
            // Use the predefined progression for levels 1-10
            xpRequired = level <= 2 ? 200 : // Level 3
                level <= 3 ? 400 : // Level 4
                    level <= 4 ? 800 : // Level 5
                        level <= 5 ? 1600 : // Level 6
                            level <= 6 ? 3000 : // Level 7
                                level <= 7 ? 5000 : // Level 8
                                    level <= 8 ? 8000 : // Level 9
                                        13000; // Level 10
        } else {
            // After level 10, use the formula: 18,000 * (1.6 ^ (level - 10))
            xpRequired = Math.round(13000 * Math.pow(1.6, level - 10) / 1000) * 1000;
        }
    }

    const currentLevelXp = totalXp - totalXpRequired;
    const progress = currentLevelXp / xpRequired;

    return {
        level,
        currentLevelXp,
        xpForNextLevel: xpRequired,
        totalXp,
        progress
    };
} 