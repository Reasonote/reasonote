import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  CheckCircleOutline,
  ImportExport,
} from "@mui/icons-material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ErrorIcon from "@mui/icons-material/Error";
import {
  Box,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import {styled} from "@mui/system";

import CenterPaperStack from "../positioning/FullCenterPaperStack";
import {LinearProgressWithLabel} from "../progress/LinearProgressWithLabel";
import {Txt} from "../typography/Txt";
import {
  FileHandler,
  FileHandlerRegistry,
  HandlerResult,
} from "./fileHandlerSystem";

const DropzoneBackdrop = styled(Box)({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 999998,
});

const DropzoneOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: '5px',
  right: '5px',
  bottom: '5px',
  left: '5px',
  zIndex: 999999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '4px dashed white',
  borderRadius: '24px',
}));

interface FullScreenDropzoneProps {
  fileHandlerRegistry: FileHandlerRegistry;
  onComplete: () => void;
}

export const FullScreenDropzone: React.FC<FullScreenDropzoneProps> = ({ fileHandlerRegistry, onComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dropMessage, setDropMessage] = useState("");
  const [currentHandler, setCurrentHandler] = useState<FileHandler | null>(null);
  const [handlerResult, setHandlerResult] = useState<HandlerResult | null>(null);

  const isSmallDevice = useIsSmallDevice();

  const acceptedFileTypes = fileHandlerRegistry.getAllAcceptedFileTypes();

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDropMessage("");
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.clientX === 0 && e.clientY === 0) {
      setIsDragging(false);
      setDropMessage("");
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const handler = fileHandlerRegistry.getHandlerForFile(file);

      if (handler) {
        setDropMessage("Processing file...");
        try {
          const result = await handler.handleFile(file);
          setHandlerResult(result);
          setCurrentHandler(handler);
          setDropMessage(result.success ? "File processed successfully!" : "Error processing file.");
        } catch (error) {
          console.error('Error:', error);
          setDropMessage("Error processing file.");
        }
      } else {
        setDropMessage("Unsupported file type.");
      }

      e.dataTransfer.clearData();
    }
  }, [fileHandlerRegistry]);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  const isSuccess = handlerResult?.success;

  if (currentHandler && handlerResult) {
    const HandlerComponent = currentHandler.ReactComponent;
    const HandlerTitle = currentHandler.Title ?? (() => <Txt>Importing</Txt>);
    const HandlerTitleIcon = currentHandler.TitleIcon ?? ImportExport;

    if (!HandlerComponent) {
      console.error('Handler does not have a ReactComponent');
      return <Typography>Error: Handler does not have a ReactComponent</Typography>;
    }
    else {
      return <Modal open={true}>
        <CenterPaperStack 
          stackProps={{
            overflow: 'auto', 
            maxHeight: '90vh', 
            maxWidth: isSmallDevice ? '100vw' : '500px',
            gap: 2
          }}
        >
          <Txt startIcon={<HandlerTitleIcon/>} variant="h6">
            <HandlerTitle />
          </Txt>
          <HandlerComponent result={handlerResult} onComplete={onComplete} />
        </CenterPaperStack>
      </Modal> 
    }
   
  }

  if (!isDragging && !dropMessage) return null;

  return (
    <>
      <DropzoneBackdrop />
      <DropzoneOverlay
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Stack alignItems="center" gap={2}>
          {isDragging ? (
            //@ts-ignore
            <CloudUploadIcon sx={{ fontSize: 64}} color='white' />
          ) : dropMessage.includes("Unsupported") ? (
            <ErrorIcon sx={{ fontSize: 64}} color="error" />
          ) : (
            <CheckCircleOutline sx={{ fontSize: 64}} color={'success'} />
          )}
          <Typography variant="h4" color="textPrimary" sx={{padding: '20px'}} textAlign={'center'} whiteSpace={'pre-line'}>
            {isDragging ? "Drop files here" : dropMessage}
            
          </Typography>
          {isSuccess && (
              <LinearProgressWithLabel label={<Txt color="textPrimary">Uploading...</Txt>} labelPos='above' />
            )}
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Supported file types: {acceptedFileTypes.join(', ')}
          </Typography>
        </Stack>
      </DropzoneOverlay>
    </>
  );
};