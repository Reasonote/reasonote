import React, {
  useCallback,
  useState,
} from "react";

import {
  BookOpen,
  Plus,
  Upload,
} from "lucide-react";

import {Txt} from "@/components/typography/Txt";
import {ImportExport} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Stack,
  useTheme,
} from "@mui/material";

import {DocumentUpload} from "../components/DocumentUpload";
import {
  AddContentStepProps,
  ContentType,
} from "../types/courseCreation.types";

interface ContentTypeOption {
  type: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  coming_soon?: boolean;
}

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  {
    type: 'document',
    title: 'Upload Documents',
    description: 'Upload PDFs, Word docs, or text files to create your course',
    icon: <Upload size={24} />,
  },
  {
    type: 'anki',
    title: 'Import Anki Decks',
    description: 'Import your existing Anki flashcard decks',
    icon: <ImportExport sx={{ fontSize: 24 }} />,
    coming_soon: true,
  },
  {
    type: 'manual',
    title: 'Create Manually',
    description: 'Build your course content from scratch',
    icon: <Plus size={24} />,
    coming_soon: true,
  },
];

function ContentTypeCard({ 
  option, 
  isSelected, 
  onClick, 
  disabled 
}: { 
  option: ContentTypeOption;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  
  return (
    <Card 
      variant="outlined"
      sx={{
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? 
          theme.palette.primary.main : 
          theme.palette.divider,
        backgroundColor: isSelected ? 
          `${theme.palette.primary.main}08` : 
          theme.palette.background.paper,
        '&:hover': disabled ? {} : {
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}04`,
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardActionArea 
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        sx={{ 
          p: 3,
          '&.Mui-disabled': {
            opacity: 1, // We handle opacity at the card level
          },
        }}
      >
        <Stack gap={2} alignItems="center" textAlign="center">
          <Box 
            sx={{ 
              color: isSelected ? 
                theme.palette.primary.main : 
                theme.palette.text.secondary,
              transition: 'color 0.2s ease-in-out',
            }}
          >
            {option.icon}
          </Box>
          
          <Stack gap={0.5}>
            <Txt 
              variant="h6" 
              color={isSelected ? "primary" : "text.primary"}
              sx={{ fontWeight: 600 }}
            >
              {option.title}
              {option.coming_soon && (
                <Txt 
                  component="span" 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    ml: 1,
                    fontWeight: 400,
                    fontStyle: 'italic',
                  }}
                >
                  (Coming Soon)
                </Txt>
              )}
            </Txt>
            
            <Txt variant="body2" color="text.secondary">
              {option.description}
            </Txt>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

export function AddContentStep({
  contentType,
  onContentTypeSelect,
  onNext,
  onBack,
  canProgress,
  onDocumentUpload,
  documentUploadState,
}: AddContentStepProps) {
  const [selectedType, setSelectedType] = useState<ContentType | undefined>(contentType);

  const handleContentTypeSelect = useCallback((type: ContentType) => {
    setSelectedType(type);
    onContentTypeSelect(type);
  }, [onContentTypeSelect]);

  const handleDocumentUploadWrapper = useCallback(async (files: File[]) => {
    if (onDocumentUpload) {
      await onDocumentUpload(files);
    }
  }, [onDocumentUpload]);

  const handleClearDocumentError = useCallback(() => {
    // This will be implemented when we add clearDocumentError to the context
    console.log('Clear document error');
  }, []);

  const hasUploadedDocuments = documentUploadState?.uploadedFiles && 
    documentUploadState.uploadedFiles.length > 0 && 
    documentUploadState.uploadedFiles.some(file => file.status === 'complete');

  return (
    <Stack gap={4} width="100%">
      {/* Header */}
      <Stack gap={1}>
        <Txt variant="h5" color="text.primary">
          Add Your Content
        </Txt>
        <Txt variant="body2" color="text.secondary">
          Choose how you'd like to add content to your course.
        </Txt>
      </Stack>

      {/* Content Type Selection */}
      <Stack gap={2}>
        <Txt variant="h6" color="text.primary">
          Select Content Type
        </Txt>
        
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          gap={2}
          sx={{ width: '100%' }}
        >
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <Box key={option.type} sx={{ flex: 1 }}>
              <ContentTypeCard
                option={option}
                isSelected={selectedType === option.type}
                onClick={() => handleContentTypeSelect(option.type)}
                disabled={option.coming_soon}
              />
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Document Upload Interface */}
      {selectedType === 'document' && (
        <Stack gap={2}>
          <Txt variant="h6" color="text.primary">
            Upload Your Documents
          </Txt>
          
          <DocumentUpload
            onUpload={handleDocumentUploadWrapper}
            uploadState={documentUploadState}
            onClearError={handleClearDocumentError}
          />
        </Stack>
      )}

      {/* Coming Soon Message for Other Types */}
      {selectedType && selectedType !== 'document' && (
        <Card 
          sx={{ 
            p: 3,
            backgroundColor: 'background.default',
            textAlign: 'center',
          }}
        >
          <Stack gap={1} alignItems="center">
            <BookOpen size={32} color="#666" />
            <Txt variant="h6" color="text.secondary">
              {selectedType === 'anki' ? 'Anki Import' : 'Manual Creation'} Coming Soon
            </Txt>
            <Txt variant="body2" color="text.secondary">
              This feature will be available in a future release. For now, try uploading documents to create your course.
            </Txt>
            <Button 
              variant="outlined" 
              onClick={() => handleContentTypeSelect('document')}
              sx={{ mt: 1 }}
            >
              Try Document Upload Instead
            </Button>
          </Stack>
        </Card>
      )}

      {/* Navigation */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button 
          onClick={onBack} 
          variant="outlined"
          sx={{
            textTransform: 'none',
            minWidth: '120px',
          }}
        >
          Back
        </Button>
        
        <Button 
          onClick={onNext} 
          variant="contained"
          disabled={!canProgress}
          sx={{
            textTransform: 'none',
            minWidth: '120px',
          }}
        >
          {selectedType === 'document' && hasUploadedDocuments ? 
            'Create Course' : 
            'Next'
          }
        </Button>
      </Stack>
    </Stack>
  );
} 