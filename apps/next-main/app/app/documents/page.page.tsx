"use client";
import React, {
  useCallback,
  useState,
} from "react";

import _ from "lodash";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  AutoAwesome,
  Fullscreen,
  KeyboardArrowLeft,
} from "@mui/icons-material";
import {
  IconButton,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import {useSupabase} from "../../../components/supabase/SupabaseProvider";
import {Document} from "./Common";
import {DocSuggestion} from "./document-chat/DocumentChat";
import {RsnPageDisplayer} from "./document-display/RsnPageDisplayer";
import {RsnPageTools} from "./document-display/RsnPageTools";
import {DocumentList} from "./DocumentList";

const mockDocuments: Document[] = [
  {
    docId: "DOC-1",
    title: "Document 1",
    body: "11 1 1 1 11111",
    dateCreated: "2022-10-01",
    dateModified: "2022-10-01",
  },
  {
    docId: "DOC-2",
    title: "Document 2",
    body: "22 2 2 2 22222",
    dateCreated: "2021-10-01",
    dateModified: "2021-10-01",
  },
  {
    docId: "DOC-3",
    title: "Document 3",
    body: "33 3 3 3 33333",
    dateCreated: "2021-10-01",
    dateModified: "2021-10-01",
  },
  {
    docId: "DOC-4",
    title: "Document 4",
    body: "44 4 4 4 44444",
    dateCreated: "2021-10-01",
    dateModified: "2021-10-01",
  },
  {
    docId: "DOC-5",
    title: "Document 5",
    body: "55 5 5 5 55555",
    dateCreated: "2021-10-01",
    dateModified: "2021-10-01",
  },
  {
    docId: "DOC-6",
    title: "Document 6",
    body: "66 6 6 6 66666",
    dateCreated: "2021-10-01",
    dateModified: "2021-10-01",
  },
  {
    docId: "DOC-7",
    title: "Document 7",
    body: "77 7 7 7 77777",
    dateCreated: "2021-10-01",
    dateModified: "2021-10-01",
  },
];

export function useSearchParamsAdvanced() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchParamsUpdater = useCallback(
    (opts: { addParams?: Record<string, any>; removeParams?: string[] }) => {
      const usingSearchParams = searchParams ?? {};
      const usingRemoveParams = opts.removeParams ?? [];
      const usingAddParams = opts.addParams ?? {};

      const newParams = new URLSearchParams(usingSearchParams);

      // Add the new params
      for (const [key, value] of Object.entries(usingAddParams)) {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      }

      // Remove the old params
      for (const key of usingRemoveParams) {
        newParams.delete(key);
      }

      router.push(pathname + "?" + newParams.toString());
    },
    [searchParams, router, pathname]
  );

  return {
    searchParams,
    searchParamsUpdater,
  };
}

export function useQueryState<T>(key: string, initialValue: T) {
  const { searchParams, searchParamsUpdater } = useSearchParamsAdvanced();
  const value = (searchParams?.get(key) as T) || initialValue;
  const setValue = (newValue: T) => {
    searchParamsUpdater({
      addParams: {
        [key]: newValue,
      },
    });
  };
  return [value, setValue] as const;
}

export default function DocumentsPage() {
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [docComments, setDocComments] = useState<
    { line: number; comment: string }[]
  >([
    // {
    //   line: 5,
    //   comment: trimLines(`
    //   This is line 5
    //   Line 5
    //   Line 5!!!!!!!!!!!!
    //   Wow Line 5
    //   Line 55555
    //   `)
    // }, {
    //   line: 10,
    //   comment: 'This is line 10'
    // }
  ]);

  const [showTools, setShowTools] = useState<boolean>(false);

  const [docSuggestions, setDocSuggestions] = useState<DocSuggestion[]>([]);

  const [selectedDocId, setSelectedDocId] = useQueryState<string | null>(
    "selectedDocId",
    null
  );
  const [focusedMode, setFocusedMode] = useQueryState<boolean>(
    "focusedMode",
    false
  );

  const sb = useSupabase();

  const onRepopulateVectors = () => {
    sb.supabase.functions.invoke("update_doc_vectors");
  };

  // Clear comments when switching documents
  // useEffect(() => {
  //   setDocComments([])
  // }, [selectedDocId])

  const showBackButton = focusedMode || showTools;

  return (
    <>
      <Grid
        container
        spacing={1}
        minWidth="90vw"
        gridAutoFlow="row"
        flexDirection={"column"}
      >
        {/* <Button fullWidth={false} onClick={onRepopulateVectors}>
          Repopulate vectors
        </Button> */}
        <Grid container spacing={1} gridAutoFlow="row">
          {focusedMode || showTools ? null : (
            <Grid xs={6}>
              <DocumentList
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
              />
            </Grid>
          )}

          <Grid xs={(focusedMode && !showTools) ? 11 : 6} gap={2}>
            <Stack direction={"row"} spacing={1} justifyContent={'space-between'}>
              <IconButton onClick={() => {
                if (focusedMode || showTools){
                  setFocusedMode(false)
                  setShowTools(false)
                }
                else {
                  setFocusedMode(true)
                }
              }}>
                {showBackButton ? <KeyboardArrowLeft /> : <Fullscreen />}
              </IconButton>
              <IconButton onClick={() => setShowTools(!showTools)}>
                <AutoAwesome />
              </IconButton>
            </Stack>
            <RsnPageDisplayer
              selectedDocId={selectedDocId}
              docComments={docComments}
              docSuggestions={docSuggestions}
            />
          </Grid>
          {
            showTools ? (
              <Grid xs={6}>
                <RsnPageTools
                  selectedDocId={selectedDocId}
                />
              </Grid>
            ) : null
          }
        </Grid>
      </Grid>
      <React.Fragment key={"bottom"}>
        {/* <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 1000,
          }}
        >
          <IconButton
            sx={{
              backgroundColor: chatOpen
                ? theme.palette.primary.dark
                : theme.palette.primary.main,
              ":hover": {
                backgroundColor: chatOpen
                  ? theme.palette.primary.main
                  : theme.palette.primary.dark,
              },
              color: chatOpen
                ? theme.palette.grey[200]
                : theme.palette.grey[200],
            }}
            onClick={() => setChatOpen(!chatOpen)}
          >
            <Chat />
          </IconButton>
        </div> */}

      </React.Fragment>
    </>
  );
}
