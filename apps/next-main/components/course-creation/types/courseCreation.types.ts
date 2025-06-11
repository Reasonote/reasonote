export type ContentType = 'document' | 'anki' | 'manual';

export type ProcessingType = 'document' | 'anki';

export interface ProcessingState {
  isProcessing: boolean;
  type: ProcessingType;
  input?: string;
  fileNames?: string[];
}

// Document processing types
export interface DocumentUploadState {
  isUploading: boolean;
  uploadedFiles: UploadedDocument[];
  uploadError?: string;
}

export interface UploadedDocument {
  fileName: string;
  fileType: string;
  status: 'processing' | 'complete' | 'error';
  pageId?: string;
  title?: string;
  content?: string;
  error?: string;
}

export interface CourseCreationState {
  // Basic course info
  courseName?: string;
  contentType?: ContentType;
  
  // Document upload state
  documentUpload?: DocumentUploadState;
  
  // Stepper state
  currentStep: number;
  steps: string[];
  canProgress: boolean;
  
  // Processing state
  isProcessing: boolean;
  processingState?: ProcessingState;
  
  // Navigation
  finalDestination?: string;
}

export interface CreateCourseModalProps {
  open: boolean;
  onClose: () => void;
  onProcessingStateChange?: (state: ProcessingState) => void;
  onError?: (error: string) => void;
}

// Step component interfaces
export interface StepComponentProps {
  onNext: () => void;
  onBack: () => void;
  canProgress: boolean;
}

export interface CourseNameStepProps extends StepComponentProps {
  courseName?: string;
  onCourseNameChange: (name: string) => void;
  onSkip: () => void;
}

export interface AddContentStepProps extends StepComponentProps {
  contentType?: ContentType;
  onContentTypeSelect: (type: ContentType) => void;
  onDocumentUpload?: (files: File[]) => Promise<void>;
  documentUploadState?: DocumentUploadState;
} 