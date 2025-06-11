import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {useRouter} from "next/navigation";
import posthog from "posthog-js";

import {
  IntegrationsDocsProcessStorageRoute,
} from "@/app/api/integrations/docs/process_storage/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSupabase} from "@/components/supabase/SupabaseProvider";

import {
  ContentType,
  CourseCreationState,
  ProcessingState,
  UploadedDocument,
} from "../types/courseCreation.types";

interface CourseCreationContextType {
  state: CourseCreationState;
  
  // Course info actions
  setCourseName: (name: string) => void;
  setContentType: (type: ContentType) => void;
  clearContentType: () => void;
  
  // Document upload actions
  handleDocumentUpload: (files: File[]) => Promise<void>;
  clearDocumentError: () => void;
  
  // Course creation action
  createCourse: () => Promise<void>;
  
  // Processing actions
  setProcessingState: (state: ProcessingState) => void;
  
  // Navigation actions
  goToNext: () => void;
  goToBack: () => void;
  goToStep: (step: number) => void;
  canProgress: boolean;
  
  // Utility actions
  reset: () => void;
}

const CourseCreationContext = createContext<CourseCreationContextType | undefined>(undefined);

// File type constants from existing upload functionality
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CourseCreationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const rsnUserId = useRsnUserId();
  const { sb } = useSupabase();
  
  const [state, setState] = useState<CourseCreationState>({
    currentStep: 0,
    steps: ['Name', 'Add Content'],
    canProgress: false,
    isProcessing: false,
  });

  // Course info actions
  const setCourseName = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      courseName: name,
      canProgress: true,
    }));
  }, []);

  const setContentType = useCallback((type: ContentType) => {
    setState(prev => {
      // Dynamic step generation based on content type
      let newSteps = ['Name', 'Add Content'];
      switch (type) {
        case 'anki':
          newSteps = [...newSteps, 'Select Cards', 'Organize Skills'];
          break;
        case 'document':
          // Document flow ends after Add Content (processing happens)
          break;
        case 'manual':
          newSteps = [...newSteps, 'Configure Content'];
          break;
      }
      
      return {
        ...prev,
        contentType: type,
        steps: newSteps,
        canProgress: true,
      };
    });
  }, []);

  const clearContentType = useCallback(() => {
    setState(prev => ({
      ...prev,
      contentType: undefined,
      steps: ['Name', 'Add Content'],
      canProgress: false,
    }));
  }, []);

  // Document upload functionality based on existing HomeMainSkillCreatorV2
  const handleDocumentUpload = useCallback(async (files: File[]): Promise<void> => {
    if (!rsnUserId) {
      throw new Error("No user ID found -- cannot upload files");
    }

    // Update state to show uploading
    setState(prev => ({
      ...prev,
      documentUpload: {
        isUploading: true,
        uploadedFiles: files.map(file => ({
          fileName: file.name,
          fileType: file.type,
          status: 'processing',
        })),
        uploadError: undefined,
      },
    }));

    // Track upload attempt
    posthog.capture('course_creation_document_upload_started', {
      file_count: files.length,
      file_types: files.map(f => f.type),
      file_sizes: files.map(f => f.size),
    }, { send_instantly: true });

    try {
      const processedDocuments: UploadedDocument[] = [];

      for (const file of files) {
        // Create a unique storage path for the file
        const storagePath = `${rsnUserId}/${file.name}`;

        // Upload the file to storage
        const { data: fileData, error: fileError } = await sb.storage
          .from('attachment-uploads')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: true,
          });

        if (fileError) {
          throw new Error(`Failed to upload file ${file.name}: ${fileError.message}`);
        }

        console.log('Uploaded file:', fileData);

        // Process the file from storage
        const { data: docsData, error: docsError } = await IntegrationsDocsProcessStorageRoute.call({
          storagePath,
          fileName: file.name,
          fileType: file.type,
        });

        if (docsError) {
          throw new Error(`Failed to process file ${file.name}: ${docsError}`);
        }

        if (!docsData?.documents || docsData.documents.length === 0) {
          throw new Error(`No document data returned for ${file.name}`);
        }

        // Add the processed documents to our array
        const processedDocs: UploadedDocument[] = docsData.documents.map(doc => ({
          fileName: file.name,
          fileType: file.type,
          status: 'complete' as const,
          pageId: doc.pageId,
          title: doc.title,
          content: doc.content,
        }));

        processedDocuments.push(...processedDocs);
      }

      // Update state with completed uploads
      setState(prev => ({
        ...prev,
        documentUpload: {
          isUploading: false,
          uploadedFiles: processedDocuments,
          uploadError: undefined,
        },
        canProgress: true,
      }));

      // Track successful upload
      posthog.capture('course_creation_document_upload_success', {
        file_count: files.length,
        document_count: processedDocuments.length,
        file_types: files.map(f => f.type),
      }, { send_instantly: true });

    } catch (error) {
      console.error('Error uploading files:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload documents. Please try again.';
      
      // Update state with error
      setState(prev => ({
        ...prev,
        documentUpload: {
          isUploading: false,
          uploadedFiles: files.map(file => ({
            fileName: file.name,
            fileType: file.type,
            status: 'error',
            error: errorMessage,
          })),
          uploadError: errorMessage,
        },
        canProgress: false,
      }));

      // Track failed upload
      posthog.capture('course_creation_document_upload_failed', {
        file_count: files.length,
        file_types: files.map(f => f.type),
        error_message: errorMessage,
      }, { send_instantly: true });

      throw error;
    }
  }, [rsnUserId, sb]);

  const clearDocumentError = useCallback(() => {
    setState(prev => ({
      ...prev,
      documentUpload: prev.documentUpload ? {
        ...prev.documentUpload,
        uploadError: undefined,
      } : undefined,
    }));
  }, []);

  // Processing actions
  const setProcessingState = useCallback((processingState: ProcessingState) => {
    setState(prev => ({
      ...prev,
      isProcessing: processingState.isProcessing,
      processingState,
    }));
  }, []);

  // Navigation actions
  const goToNext = useCallback(() => {
    setState(prev => {
      const nextStep = Math.min(prev.currentStep + 1, prev.steps.length - 1);
      return {
        ...prev,
        currentStep: nextStep,
        canProgress: false, // Reset progress when moving to next step
      };
    });
  }, []);

  const goToBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
      canProgress: true, // Can always go back
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, prev.steps.length - 1)),
    }));
  }, []);

  const canProgress = useMemo(() => {
    // Can't progress if currently processing
    if (state.isProcessing) {
      return false;
    }

    // For document content type, need successful uploads
    if (state.contentType === 'document') {
      const hasUploadedDocs = state.documentUpload?.uploadedFiles?.some(
        doc => doc.status === 'complete' && doc.pageId
      ) || false;
      return hasUploadedDocs;
    }

    // For other content types (future), have different logic
    // For now, return false since they're not implemented
    return false;
  }, [state.isProcessing, state.contentType, state.documentUpload]);

  // Utility actions
  const reset = useCallback(() => {
    setState({
      currentStep: 0,
      steps: ['Name', 'Add Content'],
      canProgress: false,
      isProcessing: false,
    });
  }, []);

  // Course creation action
  const createCourse = useCallback(async (): Promise<void> => {
    if (!state.documentUpload?.uploadedFiles?.length) {
      throw new Error("No uploaded documents found");
    }

    // Start processing
    setState(prev => ({
      ...prev,
      isProcessing: true,
      processingState: {
        isProcessing: true,
        type: 'document',
        fileNames: prev.documentUpload?.uploadedFiles.map(doc => doc.fileName) || [],
      },
    }));

    // Track course creation start
    posthog.capture('course_creation_started', {
      content_type: state.contentType,
      course_name: state.courseName,
      document_count: state.documentUpload.uploadedFiles.length,
    }, { send_instantly: true });

    try {
      // Get the first processed document's pageId for skill creation
      const firstDocument = state.documentUpload.uploadedFiles.find(doc => doc.pageId);
      if (!firstDocument?.pageId) {
        throw new Error("No processed document found with pageId");
      }

      // Create the skill using the same API call pattern as homepage
      const response = await fetch('/api/integrations/docs/create_skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: firstDocument.pageId,
          skillName: state.courseName?.trim() || undefined, // Pass course name if provided
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create course');
      }

      if (!data.skillId) {
        throw new Error('No skill ID returned from course creation');
      }

      // Track successful creation
      posthog.capture('course_creation_success', {
        skill_id: data.skillId,
        content_type: state.contentType,
        course_name: state.courseName,
        document_count: state.documentUpload.uploadedFiles.length,
      }, { send_instantly: true });

      // Navigate to the created skill
      router.push(`/app/skills/${data.skillId}?tab=outline`);

    } catch (error) {
      console.error('Error creating course:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course. Please try again.';
      
      // Stop processing and show error
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingState: undefined,
        documentUpload: prev.documentUpload ? {
          ...prev.documentUpload,
          uploadError: errorMessage,
        } : undefined,
      }));

      // Track failed creation
      posthog.capture('course_creation_failed', {
        content_type: state.contentType,
        course_name: state.courseName,
        document_count: state.documentUpload?.uploadedFiles?.length || 0,
        error_message: errorMessage,
      }, { send_instantly: true });

      throw error;
    }
  }, [state, router]);

  const contextValue: CourseCreationContextType = {
    state,
    
    // Course info actions
    setCourseName,
    setContentType,
    clearContentType,
    
    // Document upload actions
    handleDocumentUpload,
    clearDocumentError,
    
    // Course creation action
    createCourse,
    
    // Processing actions
    setProcessingState,
    
    // Navigation actions
    goToNext,
    goToBack,
    goToStep,
    canProgress,
    
    // Utility actions
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
  if (context === undefined) {
    throw new Error('useCourseCreation must be used within a CourseCreationProvider');
  }
  return context;
} 