import React, {
  useRef,
  useState,
} from "react";

import _ from "lodash";

import {ChaptersSuggestRoute} from "@/app/api/chapters/suggest/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {Add} from "@mui/icons-material";
import {
  Button,
  ButtonProps,
  Fab,
  FabProps,
  Modal,
  Popover,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {useChapterFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {ModalContent} from "../modals/ModalContent";
import {useSupabase} from "../supabase/SupabaseProvider";
import {TxtField} from "../textFields/TxtField";
import {Txt} from "../typography/Txt";

export function ChapterSelectButton({
  chapterId,
  onClick,
  onPopoverOpen,
  onPopoverClose,
  isOpen,
  ...rest
}: {
  chapterId: string;
  onClick?: () => void;
  onPopoverOpen?: () => void;
  onPopoverClose?: () => void;
  isOpen: boolean;
} & FabProps) {
  const { data: chapter } = useChapterFlatFragLoader(chapterId);
  const ref = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <Fab
        {...rest}
        ref={ref}
        onClick={() => {
          if (isOpen) {
            onPopoverClose?.();
          } else {
            onPopoverOpen?.();
          }
        }}
      >
        {chapter?.icon}
      </Fab>
      {chapter && (
        <Popover
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          sx={{
            zIndex: 2000,
          }}
          open={isOpen}
          anchorEl={ref.current}
          onClose={onPopoverClose}
        >
          <Stack maxWidth={"300px"} padding={1} gap={1}>
            <Txt startIcon={chapter.icon} variant="h6">
              {chapter.name}
            </Txt>
            <Typography variant="caption">{chapter.summary}</Typography>
            <Button onClick={onClick} variant="contained">
              <b>Start Chapter</b>
            </Button>
          </Stack>
        </Popover>
      )}
    </>
  );
}

export function ChapterCreateModal({
  skillIdPath,
  onClose,
  onChapterCreated,
}: {
  skillIdPath: string[];
  onClose: () => void;
  onChapterCreated: (args: { chapterId: string }) => void;
}) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const {sb} = useSupabase();
  const rsnUserId = useRsnUserId();

  const [isCreating, setIsCreating] = useState(false);

  return (
    <Stack gap={2} padding={2}>
      <Txt startIcon={<Add/>} variant="h6">Custom Chapter Generator</Txt>
      <Txt variant="caption">
        Tell us what you want to learn, & we'll generate a chapter for you.
      </Txt>
      <Stack gap={1}>
        <TxtField 
          label="Chapter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TxtField 
          label="Chapter Summary"
          value={summary}
          placeholder="Learn about..."
          onChange={(e) => setSummary(e.target.value)}
          minRows={2}
          maxRows={4}
        />
        <Button
          onClick={async () => {
            setIsCreating(true);
            try {
              // 
              const chapterInsertResult = await sb
                .from('chapter')
                .insert({
                  _name: name,
                  _summary: summary,
                  for_user: rsnUserId,
                  root_skill: skillIdPath?.[0],
                  root_skill_path: skillIdPath,
                })
                .select('*').single();

              const theId = chapterInsertResult.data?.id;

              if (!theId) {
                console.error('Failed to create chapter', chapterInsertResult.error)
              }
              else {
                onChapterCreated({ chapterId: theId });
                onClose();
              }
            } finally {
              setIsCreating(false);
            }
          }}
          disabled={isCreating}
        >
          Create Chapter
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * This will create a modal that allows the user to create a new chapter, with a name, and a summary
 */
export function ChapterCreateButton({
  onChapterCreated,
  skillIdPath,
  ...rest
}: {
  skillIdPath: string[];
  onChapterCreated: (args: { chapterId: string }) => void;
} & FabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Fab
        {...rest}
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        +
      </Fab>
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      >
        <ModalContent>
          <ChapterCreateModal
            skillIdPath={skillIdPath}
            onClose={() => {
              setIsModalOpen(false);
            }}
            onChapterCreated={onChapterCreated}
          />
        </ModalContent>
      </Modal>
    </>
  );
}

export function ChapterSelectButtons({
  skillIdPath,
  onChapterSelect,
  startMode = "collapsed",
  buttonTextOverride,
  expandButtonOverrides,
}: {
  skillIdPath: string[];
  onChapterSelect?: (chapterId: string) => void;
  startMode?: "collapsed" | "expanded";
  buttonTextOverride?: React.ReactNode;
  expandButtonOverrides?: ButtonProps;
}) {
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [mode, setMode] = useState(startMode);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const isGenerating = useRef(false);

  useAsyncEffect(async () => {
    if (isGenerating.current || chapterIds.length > 0) {
      return;
    }
    isGenerating.current = true;
    try {
      const res = await ChaptersSuggestRoute.call({
        subject: {
          skillIdPath,
        },
        numChapters: 3,
      });

      if (res.error) {
        console.error(res.error);
        return;
      }

      setChapterIds(res.data?.chapterIds ?? []);
    } finally {
      isGenerating.current = false;
    }
  }, [JSON.stringify(skillIdPath), chapterIds.length]);

  return (
    <>
      {mode === "collapsed" ? (
        <Button 
          onClick={() => setMode("expanded")}
          {...expandButtonOverrides}
        >
          {buttonTextOverride ?? "Select Next Chapter"}
        </Button>
      ) : (
        <Stack alignItems={'center'}> 
          <Typography variant="h6"><i>Select Next Chapter</i></Typography>        
          <Stack
            gap={2}
            direction="row"
            justifyContent={"center"}
            alignItems={"center"}
          >
            
            {chapterIds.length === 0
              ? _.range(3).map((i) => (
                  <Skeleton variant="circular" key={i}>
                    <Fab />
                  </Skeleton>
                ))
              : chapterIds.map((chapterId) => (
                  <ChapterSelectButton
                    key={chapterId}
                    chapterId={chapterId}
                    onClick={() => {
                      onChapterSelect?.(chapterId);
                      setOpenPopoverId(null);
                    }}
                    onPopoverOpen={() => setOpenPopoverId(chapterId)}
                    onPopoverClose={() => setOpenPopoverId(null)}
                    isOpen={openPopoverId === chapterId}
                  />
                ))}
              <ChapterCreateButton
                key={'chapter-create-button'}
                skillIdPath={skillIdPath}
                onChapterCreated={({chapterId}) => {
                  onChapterSelect?.(chapterId);
                  setOpenPopoverId(null);
                }}
              />
          </Stack>
        </Stack>
      )}
    </>
  );
}