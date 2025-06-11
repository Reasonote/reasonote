import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import {
  ContentType,
  CourseCreationState,
  ProcessingState,
} from "../types/courseCreation.types";

interface CourseCreationContextValue extends CourseCreationState {
  // Actions
  setCourseName: (name: string) => void;
  setContentType: (type: ContentType) => void;
  setProcessingState: (state: ProcessingState) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const CourseCreationContext = createContext<CourseCreationContextValue | null>(null);

interface CourseCreationProviderProps {
  children: ReactNode;
  onProcessingStateChange?: (state: ProcessingState) => void;
  onError?: (error: string) => void;
}

export function CourseCreationProvider({
  children,
  onProcessingStateChange,
  onError,
}: CourseCreationProviderProps) {
  // Course creation state
  const [courseName, setCourseNameState] = useState<string>('');
  const [contentType, setContentTypeState] = useState<ContentType>();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<string[]>(['Name', 'Add Content']);
  const [canProgress, setCanProgress] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingStateInternal] = useState<ProcessingState>();
  const [finalDestination, setFinalDestination] = useState<string>();
  const [error, setErrorState] = useState<string | null>(null);

  // Actions
  const setCourseName = useCallback((name: string) => {
    setCourseNameState(name);
  }, []);

  const setContentType = useCallback((type: ContentType) => {
    setContentTypeState(type);
    
    // Update steps based on content type
    const baseSteps = ['Name', 'Add Content'];
    
    switch (type) {
      case 'anki':
        setSteps([...baseSteps, 'Select Cards', 'Organize Skills']);
        break;
      case 'document':
        setSteps(baseSteps); // Document processing happens after Add Content
        break;
      case 'manual':
        setSteps([...baseSteps, 'Configure Content']);
        break;
      default:
        setSteps(baseSteps);
    }
  }, []);

  const setProcessingState = useCallback((state: ProcessingState) => {
    setProcessingStateInternal(state);
    setIsProcessing(state.isProcessing);
    
    // Notify parent component
    if (onProcessingStateChange) {
      onProcessingStateChange(state);
    }
  }, [onProcessingStateChange]);

  const setError = useCallback((error: string | null) => {
    setErrorState(error);
    
    // Notify parent component
    if (error && onError) {
      onError(error);
    }
  }, [onError]);

  const reset = useCallback(() => {
    setCourseNameState('');
    setContentTypeState(undefined);
    setCurrentStep(0);
    setSteps(['Name', 'Add Content']);
    setCanProgress(true);
    setIsProcessing(false);
    setProcessingStateInternal(undefined);
    setFinalDestination(undefined);
    setErrorState(null);
  }, []);

  const contextValue: CourseCreationContextValue = {
    // State
    courseName,
    contentType,
    currentStep,
    steps,
    canProgress,
    isProcessing,
    processingState,
    finalDestination,
    
    // Actions
    setCourseName,
    setContentType,
    setProcessingState,
    setError,
    reset,
  };

  return (
    <CourseCreationContext.Provider value={contextValue}>
      {children}
    </CourseCreationContext.Provider>
  );
}

export function useCourseCreation() {
  const context = useContext(CourseCreationContext);
  
  if (!context) {
    throw new Error('useCourseCreation must be used within a CourseCreationProvider');
  }
  
  return context;
} 