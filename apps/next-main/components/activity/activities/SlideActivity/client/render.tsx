import {useCallback} from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {MuiMarkdownDefault} from "@/components/markdown/MuiMarkdownDefault";
import {
  Button,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  SlideActivityConfig,
  SlideActivityConfigSchema,
  SlideResult,
} from "@reasonote/activity-definitions";

import {ActivityComponent} from "../../ActivityComponent";

export const SlideActivity: ActivityComponent<
  SlideActivityConfig,
  any,
  SlideResult
> = ({
  config,
  callbacks,
}) => {
    const theme = useTheme();
    const isSmallDevice = useIsSmallDevice();

    const { markdownContent, title, titleEmoji } = config;

    const onNext = useCallback(() => {
      callbacks?.onSkip?.({})
    }, [callbacks]);

    // Do this to make sure we have a valid format
    const parsedSlide = SlideActivityConfigSchema.safeParse(config);
    if (!parsedSlide.success) {
      return (
        <Paper sx={{ width: '100%' }}>
          <Stack padding={2} gap={2}>
            <MuiMarkdownDefault>Error: Invalid slide.</MuiMarkdownDefault>
            <div>
              <pre>{JSON.stringify(parsedSlide.error, null, 2)}</pre>
            </div>
            <Button
              onClick={() =>
                onNext()
              }
            >
              Next
            </Button>
          </Stack>
        </Paper>
      );
    }

    return (
      <Paper sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <Stack
          padding={2}
          gap={2}
          sx={{
            maxHeight: callbacks?.restrictHeight ? '70vh' : '100%',
            height: '100%',
            overflowY: 'scroll',
            paddingBottom: callbacks?.hideSkipButton ? '0px' : '80px',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
          }}
        >
          <Typography variant={isSmallDevice ? "h6" : "h5"}>{titleEmoji} {title}</Typography>
          <Stack
            sx={{
              flexGrow: 1,
              overflowY: 'auto'
            }}
          >
            <MuiMarkdownDefault>{markdownContent}</MuiMarkdownDefault>
          </Stack>
        </Stack>

        {/* Fixed position button container */}
        {!callbacks?.hideSkipButton && (
          <Stack
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: isSmallDevice ? 1 : 2,
              backgroundColor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
              alignItems: 'center'
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => onNext()}
            >
              Next
            </Button>
          </Stack>
        )}
      </Paper>
    );
  }
