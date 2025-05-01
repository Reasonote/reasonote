// Activity type descriptions for tooltips
export const activityTypeDescriptions: Record<string, string> = {
    'flashcard': 'Review and memorize key concepts using interactive cards. Flip them to test your knowledge of terms and definitions.',
    'multiple-choice': 'Test your understanding by selecting the correct answer from a list of options. Great for checking comprehension!',
    'fill-in-the-blank': 'Practice your knowledge by typing in missing words in sentences or paragraphs. Perfect for vocabulary and key concepts.',
    'choose-the-blank': 'Select the best word or phrase to complete sentences from provided options. Helps improve understanding of context and meaning.',
    'teach-the-ai': 'Demonstrate your mastery by explaining concepts to an AI character. Teaching others is one of the best ways to learn!',
    'roleplay': 'Put yourself in different scenarios and respond as specific characters. Great for developing critical thinking and perspective-taking.',
    'sequence': 'Put items in the correct order to show relationships or processes. Perfect for understanding steps, timelines, or hierarchies.',
    'short-answer': 'Express your understanding by writing brief responses to questions. Helps develop clear and concise communication skills.',
    'term-matching': 'Connect related terms, definitions, or concepts by matching pairs. Great for seeing relationships between ideas!',
    'slide': 'Learn through engaging content slides. A familiar way to absorb new information.',
    // Add descriptions for any other activity types
};

// Helper function to get description with fallback
export const getActivityTypeDescription = (
    activityType: string, 
    fallbackName?: string
): string => {
    return activityTypeDescriptions[activityType] || 
        `${fallbackName || activityType} activity`;
}; 