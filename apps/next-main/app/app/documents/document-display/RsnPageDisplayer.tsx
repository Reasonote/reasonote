"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {GraphQLError} from "graphql";
import _ from "lodash";
import {ErrorBoundary} from "next/dist/client/components/error-boundary";

import {RSNMDXEditor} from "@/components/markdown/mdxeditor/MDXEditor";
import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {useMutation} from "@apollo/client";
import {MDXEditorMethods} from "@mdxeditor/editor";
import {Comment} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  IconButton,
  Paper,
  Stack,
  TextField,
  TextFieldProps,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import {updateRsnPageFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";
import {useRsnPageFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {useUpdateHelper} from "../../../../clientOnly/hooks/useUpdateHelper";
import {DocSuggestion} from "../document-chat/DocumentChat";

const DocCommentComponent = ({
  comment,
  isExpanded,
  setIsExpanded,
}: {
  comment: { line: number; comment: string };
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
}) => {
  return (
    <Paper elevation={15}>
      <Box>
        <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ zIndex: 1, position: "absolute", top: "0px", left: "0px" }}
        >
          <Comment />
        </IconButton>

        {isExpanded ? (
          <Stack
            direction={"row"}
            alignItems="center"
            justifyContent={"end"}
            sx={{
              zIndex: 2,
              position: "absolute",
              top: "100%",
              right: "0px",
              width: "200px",
            }}
          >
            <Paper elevation={15} sx={{ padding: "10px" }}>
              <Typography width={"100%"}>{comment.comment}</Typography>
            </Paper>
          </Stack>
        ) : null}
      </Box>
    </Paper>
  );
};

const TextareaWithComment = ({
  comments,
  textfieldProps,
}: {
  textfieldProps: TextFieldProps;
  comments: { line: number; comment: string }[];
}) => {
  const textareaRef = useRef<any>(null);
  const [commentStyles, setCommentStyles] = useState<Record<number, any>>({});

  const [expandedComment, setExpandedComment] = useState<number | null>(null);

  const updateCommentPositions = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const scrollTop = textarea.scrollTop;

      // Create a new style object for each comment
      const newCommentStyles = comments.reduce((styles, comment) => {
        const topPosition = (comment.line - 1) * lineHeight - scrollTop;
        styles[comment.line] = {
          top: `${topPosition}px`,
          display:
            topPosition >= 0 && topPosition <= textarea.clientHeight
              ? "block"
              : "none",
        };
        return styles;
      }, {} as Record<number, any>);

      setCommentStyles(newCommentStyles);
    }
  }, [comments]);

  useEffect(() => {
    updateCommentPositions();
  }, [JSON.stringify(comments)]);

  useEffect(() => {
    window.addEventListener("resize", updateCommentPositions);
    return () => window.removeEventListener("resize", updateCommentPositions);
  }, [updateCommentPositions]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("scroll", updateCommentPositions);
      return () =>
        textarea.removeEventListener("scroll", updateCommentPositions);
    }
  }, [updateCommentPositions]);

  return (
    <Box position="relative" mt={2}>
      <TextField
        multiline
        variant="outlined"
        fullWidth
        inputRef={textareaRef}
        onScroll={updateCommentPositions} // For initial position and scroll updates
        {...textfieldProps}
      />
      {comments.map((comment, idx) => (
        <Box
          key={idx}
          sx={{
            position: "absolute",
            left: "100%", // Position it right outside the textarea
            transform: "translateX(10px)", // Give some space
            whiteSpace: "pre-wrap",
            ...commentStyles[comment.line],
          }}
        >
          <DocCommentComponent
            comment={comment}
            isExpanded={expandedComment === comment.line}
            setIsExpanded={(v) => setExpandedComment(v ? comment.line : null)}
          />
        </Box>
      ))}
    </Box>
  );
};

export interface RsnPageDisplayerParams {
  selectedDocId: string | null;
  docComments?: { line: number; comment: string }[];
  // TODO: add docSuggestions behavior
  docSuggestions?: DocSuggestion[];
  maxRows?: number;
  readOnly?: boolean;
}
export function RsnPageDisplayer(params: RsnPageDisplayerParams) {
  const docResult = useRsnPageFlatFragLoader(params.selectedDocId);
  const { supabase } = useSupabase();
  const { docComments } = params;

  const [docUpdate] = useMutation(updateRsnPageFlatMutDoc);
  const [errorsUpdatingNameState, setErrorsUpdatingNameState] = React.useState<
    readonly GraphQLError[] | undefined
  >(undefined);
  const [errorsUpdatingBodyState, setErrorsUpdatingBodyState] = React.useState<
    readonly GraphQLError[] | undefined
  >(undefined);
  const [descriptionIsCollapsed, setDescriptionIsCollapsed] =
    React.useState<boolean>(true);
  const [docNameState, setDocNameState] = useUpdateHelper({
    updateFn: async (docName: string, res: (typeof docResult)["data"]) => {
      if (!res || !res?.id) return;

      const { data, errors } = await docUpdate({
        variables: {
          set: {
            name: docName,
          },
          filter: {
            id: { eq: res.id },
          },
          atMost: 1,
        },
      });

      setErrorsUpdatingNameState(errors);
    },
    updateFnDeps: [JSON.stringify(docResult), params.selectedDocId],
    resetDeps: [params.selectedDocId],
    obj: docResult,
    statePopulator: (obj) => obj?.name ?? "",
    throttleWait: 1000,
  });

  const [docBodyState, setDocBodyState] = useUpdateHelper({
    updateFn: async (docBody: string, res: (typeof docResult)["data"]) => {
      if (!res || !res?.id) return;

      const { data, errors } = await docUpdate({
        variables: {
          set: {
            body: docBody,
          },
          filter: {
            id: { eq: res.id },
          },
          atMost: 1,
        },
      });

      setErrorsUpdatingBodyState(errors);
    },
    updateFnDeps: [JSON.stringify(docResult)],
    resetDeps: [params.selectedDocId],
    obj: docResult,
    statePopulator: (obj) => obj?.body ?? "",
    throttleWait: 1000,
  });

  const [docDescriptionState, setDocDescriptionState] = useUpdateHelper({
    updateFn: async (
      docDescription: string,
      res: (typeof docResult)["data"]
    ) => {
      if (!res || !res?.id) return;

      const { data, errors } = await docUpdate({
        variables: {
          set: {
            description: docDescription,
          },
          filter: {
            id: { eq: res.id },
          },
          atMost: 1,
        },
      });

      setErrorsUpdatingBodyState(errors);
    },
    updateFnDeps: [JSON.stringify(docResult)],
    resetDeps: [params.selectedDocId],
    obj: docResult,
    statePopulator: (obj) =>
      obj?.description ?? "",
    throttleWait: 1000,
  });

  const ref = React.useRef<MDXEditorMethods>(null)

  // Function to get the full storage path
  const getFullStoragePath = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith('PREFIX/') ? path : `attachment-uploads/${path}`;
  };

  // Function to get signed URL for PDF
  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('')  // Empty string to use the bucket root
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  // State for PDF URL
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Effect to get signed URL when storage path changes
  useEffect(() => {
    const storagePath = getFullStoragePath(docResult.data?.storagePath);
    if (storagePath && docResult.data?.fileType === 'application/pdf') {
      getSignedUrl(storagePath).then(url => setPdfUrl(url));
    }
  }, [docResult.data?.storagePath, docResult.data?.fileType]);

  return (
    <>
      {errorsUpdatingNameState || errorsUpdatingBodyState ? (
        <Grid container gridAutoFlow={"row"} flexDirection={"column"}>
          <div>Errors updating name:</div>
          {errorsUpdatingNameState?.map((err, idx) => (
            <div key={idx}>{err.message}</div>
          ))}
          <div>Errors updating body:</div>
          {errorsUpdatingBodyState?.map((err, idx) => (
            <div key={idx}>{err.message}</div>
          ))}
        </Grid>
      ) : null}
      {!_.isEmpty(docResult.data) && (
        <Grid container gridAutoFlow={"row"} flexDirection={"column"} gap={1}>
          <TextField
            multiline
            label="Title"
            value={docNameState}
            onChange={(ev) => {
              setDocNameState(ev.target.value);
            }}
          />
          {descriptionIsCollapsed ? (
            <Stack>
              <Button onClick={() => setDescriptionIsCollapsed(false)}>
                Edit Description
              </Button>
            </Stack>
          ) : (
            <Stack>
              <Button onClick={() => setDescriptionIsCollapsed(true)}>
                Collapse Description
              </Button>
              <TextField
                multiline
                label="Description"
                value={docDescriptionState}
                onChange={(ev) => {
                  setDocDescriptionState(ev.target.value);
                }}
              />
            </Stack>
          )}

          {docResult.data?.fileType?.startsWith('application/pdf') && pdfUrl ? (
            <Card sx={{ height: '800px', width: '100%' }}>
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="PDF Viewer"
              />
            </Card>
          ) : docResult.data?.fileType?.startsWith('image/') && pdfUrl ? (
            <Card sx={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              bgcolor: 'black'
            }}>
              <img
                src={pdfUrl}
                style={{
                  maxWidth: '100%',
                  maxHeight: '800px',
                  objectFit: 'contain'
                }}
                alt={docResult.data.name || 'Image'}
              />
            </Card>
          ) : (
            <Card>
              <ErrorBoundary errorComponent={() => <div>Error loading editor</div>}>
                <RSNMDXEditor
                  ref={ref}
                  markdown={docBodyState ?? ''}
                  onChange={(newContent) => {
                    if (newContent){
                      setDocBodyState(newContent);
                    }
                  }}
                  readOnly={params.readOnly}
                />
              </ErrorBoundary>
            </Card>
          )}
        </Grid>
      )}
    </>
  );
}
