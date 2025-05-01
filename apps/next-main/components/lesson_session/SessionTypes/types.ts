export interface LessonSessionConceptPracticeReviewProps {
    lessonSessionId: string;
    onBack: () => void;
    onBackAfterLessonComplete: () => void;
    onStartNewLesson: (newLessonId: string) => void;
}

export type ItemConcept = {
    stage: 'Concepts';
    stubId: string;
    title: string;
    content: string;
    emoji?: string;
    activityId?: string;
}

export type ItemPractice = {
    stage: 'Practice';
    activityId?: string;
    generationState: 'idle' | 'generating' | 'done' | 'error';
}

export type ItemReview = {
    stage: 'Review',
    stubId: string;
    description: string;
}

export type Item = ItemConcept | ItemPractice | ItemReview;

export type PracticeLoadingState = {
    isLoading: boolean;
    showSkipPrompt: boolean;
};

export const complexityLevels = ['Beginner', 'Novice', 'Adept', 'Pro', 'Expert'];
