import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {ContentType} from "../types/courseCreation.types";

export interface StepperConfig {
  steps: string[];
  currentStep: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
}

export interface UseStepperConfigProps {
  initialContentType?: ContentType;
  initialCourseName?: string;
}

export function useStepperConfig({
  initialContentType,
  initialCourseName,
}: UseStepperConfigProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [contentType, setContentType] = useState<ContentType | undefined>(initialContentType);
  const [nameStepCompleted, setNameStepCompleted] = useState(!!initialCourseName);

  // Dynamic step generation - always include base steps, add content-specific steps
  const steps = useMemo(() => {
    const baseSteps = ['Name', 'Add Content'];
    
    // Add content-specific steps based on type
    switch (contentType) {
      case 'anki':
        return [...baseSteps, 'Select Cards', 'Organize Skills'];
      case 'document':
        return baseSteps; // Document flow ends after Add Content (processing happens)
      case 'manual':
        return [...baseSteps, 'Configure Content'];
      default:
        return baseSteps;
    }
  }, [contentType]);

  // Stepper navigation helpers
  const config: StepperConfig = useMemo(() => ({
    steps,
    currentStep,
    canGoBack: currentStep > 0,
    canGoForward: currentStep < steps.length - 1,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    totalSteps: steps.length,
  }), [steps, currentStep]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (config.canGoForward) {
      setCurrentStep(prev => prev + 1);
    }
  }, [config.canGoForward]);

  const goToBack = useCallback(() => {
    if (config.canGoBack) {
      setCurrentStep(prev => prev - 1);
    }
  }, [config.canGoBack]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  // Update content type and potentially add steps
  const updateContentType = useCallback((newContentType: ContentType) => {
    setContentType(newContentType);
    // Don't auto-advance step, let user control navigation
  }, []);

  // Complete the name step and proceed to next step
  const completeNameStep = useCallback(() => {
    setNameStepCompleted(true);
    goToNext();
  }, [goToNext]);

  // Skip course name and proceed to next step
  const skipCourseName = useCallback(() => {
    setNameStepCompleted(true);
    goToNext();
  }, [goToNext]);

  // Set course name (this doesn't complete the step, just updates the value)
  const setCourseName = useCallback((name: string) => {
    // This is just for updating the course name value, not for step completion
    // The step completion should happen when user clicks Next or Skip
  }, []);

  // Reset stepper to initial state
  const reset = useCallback(() => {
    setCurrentStep(0);
    setContentType(undefined);
    setNameStepCompleted(!!initialCourseName);
  }, [initialCourseName]);

  // Get current step name
  const getCurrentStepName = useCallback(() => {
    return steps[currentStep] || 'Unknown';
  }, [steps, currentStep]);

  // Check if we're on a specific step
  const isOnStep = useCallback((stepName: string) => {
    return steps[currentStep] === stepName;
  }, [steps, currentStep]);

  return {
    // Configuration
    config,
    
    // State
    contentType,
    nameStepCompleted,
    
    // Navigation
    goToNext,
    goToBack,
    goToStep,
    
    // State updates
    updateContentType,
    completeNameStep,
    skipCourseName,
    setCourseName,
    reset,
    
    // Helpers
    getCurrentStepName,
    isOnStep,
  };
} 