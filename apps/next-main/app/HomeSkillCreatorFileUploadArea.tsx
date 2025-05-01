import {useDropzone} from "react-dropzone";

import {Txt} from "@/components/typography/Txt";

import {UploadFile} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";

export const HomeSkillCreatorFileUploadArea = ({ files, onDrop, onDeleteFile }) => {
    const theme = useTheme();
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt'],
      }
    });
  
    return (
      <Stack direction="column" alignItems="center" justifyContent="center" spacing={2} width="100%">
        <div
          {...getRootProps()}
          className="flex flex-col items-center justify-center p-2 border border-gray-500 rounded-lg cursor-pointer"
          style={{
            borderRadius: '10px',
            width: '200px',
            color: theme.palette.gray.light,
            transition: 'color 0.3s ease, border 0.3s ease, background-color 0.3s ease',
            border: `2px solid ${theme.palette.gray.light}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.palette.text.primary;
            e.currentTarget.style.backgroundColor = theme.palette.primary.dark;
            e.currentTarget.style.border = `3px solid ${theme.palette.primary.main}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.palette.gray.light;
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.border = `2px solid ${theme.palette.gray.light}`;
          }}
        >
          <Stack alignItems="center" direction="row" justifyContent="center" spacing={0}>
            <UploadFile fontSize="medium" />
            <Txt variant="body2">
              {isDragActive ? (
                "Drop the files here..."
              ) : (
                <>
                  <span>Learn from your files</span>
                  <br />
                  <span style={{ fontStyle: 'italic', marginLeft: '5px' }}>(optional)</span>
                </>
              )}
            </Txt>
          </Stack>
          <input {...getInputProps()} />
        </div>
  
        {files.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ marginTop: 1 }}>
            {files.map((file) => (
              <Card key={file.data.fileName} sx={{ padding: '0px', maxWidth: 200 }} elevation={5}>
                <CardContent sx={{ position: 'relative', paddingRight: '24px', py: 1, px: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Txt
                      onClick={() => { }}
                      startIcon={
                        file.status === 'processing' ? (
                          <CircularProgress size={12} />
                        ) : file.status === 'error' ? (
                          <ErrorIcon color="error" fontSize="small" />
                        ) : (
                          file.data.fileType === 'application/pdf' ? (
                            <PictureAsPdfIcon fontSize="small" />
                          ) : (
                            <InsertDriveFileIcon fontSize="small" />
                          )
                        )
                      }
                      variant="caption"
                      sx={{
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.7rem',
                      }}
                    >
                      {file.data.fileName.length > 15 ? file.data.fileName.slice(0, 15) + "..." : file.data.fileName}
                    </Txt>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (file.data.fileName) {
                          onDeleteFile(file.data.fileName);
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };