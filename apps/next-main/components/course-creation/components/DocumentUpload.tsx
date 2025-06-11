import React, {
  useCallback,
  useRef,
} from "react";

import {Upload} from "lucide-react";
import {
  FileRejection,
  useDropzone,
} from "react-dropzone";

import {Txt} from "@/components/typography/Txt";
import {
  Close,
  Description,
  Error as ErrorIcon,
  InsertDriveFile,
  PictureAsPdf,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  useTheme,
} from "@mui/material";

import {
  DocumentUploadState,
  UploadedDocument,
} from "../types/courseCreation.types";

interface DocumentUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  uploadState?: DocumentUploadState;
  onClearError?: () => void;
}

const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function FileStatusIcon({ document }: { document: UploadedDocument }) {
  if (document.status === 'processing') {
    return <CircularProgress size={16} />;
  }
  
  if (document.status === 'error') {
    return <ErrorIcon color="error" fontSize="small" />;
  }
  
  if (document.fileType === 'application/pdf') {
    return <PictureAsPdf color="primary" fontSize="small" />;
  }
  
  if (document.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <Description color="primary" fontSize="small" />;
  }
  
  return <InsertDriveFile color="primary" fontSize="small" />;
}

function UploadedFilesList({ 
  files, 
  onRemoveFile 
}: { 
  files: UploadedDocument[];
  onRemoveFile?: (fileName: string) => void;
}) {
  if (files.length === 0) return null;
  
  return (
    <Stack gap={1}>
      <Txt variant="body2" color="text.secondary">
        Uploaded Files:
      </Txt>
      {files.map((file) => (
        <Card key={file.fileName} variant="outlined" sx={{ position: 'relative' }}>
          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
                <FileStatusIcon document={file} />
                <Stack sx={{ minWidth: 0, flex: 1 }}>
                  <Txt 
                    variant="body2" 
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {file.fileName}
                  </Txt>
                  {file.status === 'processing' && (
                    <LinearProgress sx={{ mt: 0.5 }} />
                  )}
                  {file.status === 'error' && file.error && (
                    <Txt variant="caption" color="error">
                      {file.error}
                    </Txt>
                  )}
                  {file.status === 'complete' && file.title && (
                    <Txt variant="caption" color="text.secondary">
                      {file.title}
                    </Txt>
                  )}
                </Stack>
              </Stack>
              
              {onRemoveFile && file.status !== 'processing' && (
                <IconButton 
                  size="small" 
                  onClick={() => onRemoveFile(file.fileName)}
                  sx={{ ml: 1 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function DocumentUpload({ 
  onUpload, 
  uploadState,
  onClearError 
}: DocumentUploadProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      let errorMessage = 'Invalid file';
      
      if (rejection.errors[0].code === "file-too-large") {
        errorMessage = `File size exceeds the limit. Maximum file size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB.`;
      } else if (rejection.errors[0].code === "file-invalid-type") {
        errorMessage = "Invalid file type. Supported types: " + Object.values(ALLOWED_FILE_TYPES).flat().join(", ");
      } else {
        errorMessage = rejection.errors[0].message || 'Invalid file type or size';
      }
      
      // For now, we'll rely on the parent component to handle errors
      // You could also throw an error here to be caught by the parent
      console.error(errorMessage);
      return;
    }

    if (acceptedFiles.length === 0) return;

    try {
      await onUpload(acceptedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      // Error is handled by the parent component
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    noClick: true,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const isUploading = uploadState?.isUploading || false;
  const hasFiles = uploadState?.uploadedFiles && uploadState.uploadedFiles.length > 0;

  return (
    <Stack gap={3}>
      {/* Upload Error */}
      {uploadState?.uploadError && (
        <Alert 
          severity="error" 
          onClose={onClearError}
          action={
            onClearError && (
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={onClearError}
              >
                <Close fontSize="inherit" />
              </IconButton>
            )
          }
        >
          {uploadState.uploadError}
        </Alert>
      )}

      {/* Upload Area */}
      <div {...getRootProps()}>
        <Box
          sx={{
            border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 2,
            padding: 4,
            textAlign: 'center',
            backgroundColor: isDragActive ? 
              `${theme.palette.primary.main}08` : 
              theme.palette.background.paper,
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: `${theme.palette.primary.main}04`,
            },
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          
          <Stack gap={2} alignItems="center">
            <Upload 
              size={48} 
              color={isDragActive ? theme.palette.primary.main : theme.palette.text.secondary} 
            />
            
            <Stack gap={1} alignItems="center">
              <Txt variant="h6" color={isDragActive ? "primary" : "text.primary"}>
                {isDragActive ? "Drop your documents here" : "Upload Your Documents"}
              </Txt>
              
              <Txt variant="body2" color="text.secondary">
                Drag & drop files here, or click to browse
              </Txt>
              
              <Txt variant="caption" color="text.secondary">
                Supports PDF, Word documents (.docx), and text files (.txt)
                <br />
                Maximum file size: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB
              </Txt>
            </Stack>

            {!isUploading && (
              <Button 
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                sx={{ mt: 1 }}
              >
                Choose Files
              </Button>
            )}
          </Stack>
        </Box>
      </div>

      {/* Progress Indicator */}
      {isUploading && (
        <Stack gap={1}>
          <Txt variant="body2" color="text.secondary">
            Processing your documents...
          </Txt>
          <LinearProgress />
        </Stack>
      )}

      {/* Uploaded Files List */}
      {hasFiles && (
        <UploadedFilesList 
          files={uploadState?.uploadedFiles || []}
          onRemoveFile={undefined} // We'll implement file removal later if needed
        />
      )}
    </Stack>
  );
} 