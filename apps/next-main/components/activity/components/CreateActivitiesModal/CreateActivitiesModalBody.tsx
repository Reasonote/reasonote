import {useState} from "react";

import {ActivityGenerateRoute} from "@/app/api/activity/generate/routeSchema";
import {AnkiDeck} from "@/app/api/integrations/anki/ingest/route.api";
import {
  SnipAddToAutocomplete,
} from "@/app/app/snips/[snipsId]/SnipAddToAutocomplete";
import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {SnipIcon} from "@/components/icons/SnipIcon";
import {
  AnkiImportButton,
} from "@/components/integrations/anki/AnkiImportButton";
import {TxtField} from "@/components/textFields/TxtField";
import {useApolloClient} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {Label} from "@mui/icons-material";
import {
  Button,
  Card,
  Skeleton,
  Stack,
  StackProps,
  Typography,
} from "@mui/material";
import {
  createActivitySkillFlatMutDoc,
  createSnipFlatMutDoc,
  GetResourceDeepDocument,
  updateSnipFlatMutDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {Activity} from "../../Activity";
import {
  CreateActivityTypeButtonGroup,
} from "../../generate/CreateActivityTypeButtonGroup";
import {ImportApkgFile} from "./_modes/ImportApkgFile";
import {InitialActionCards} from "./_modes/InitialActionCards";

interface CreateActivitiesModalBodyProps {
  onCancel(): void;
  onCreated(args: { activityIds: string[] }): void;
  stackProps?: StackProps;
}

type ViewType = "initial" | "create" | "import";

export function CreateActivitiesModalBody({
  onCreated,
  stackProps,
}: CreateActivitiesModalBodyProps) {
  const [view, setView] = useState<ViewType>("initial");
  const [activitySourceTitle, setActivitySourceTitle] = useState<string>("");
  const [activitySourceText, setActivitySourceText] = useState<string>("");
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [imports, setImports] = useState<{ decks: AnkiDeck[] } | null>(null);
  const isSmallDevice = useIsSmallDevice();
  const ac = useApolloClient();
  const [snipId, setSnipId] = useState<string | null>(null);

  useAsyncEffect(async () => {
    const res = await ac.mutate({
      mutation: createSnipFlatMutDoc,
      variables: {
        objects: [
          {
            name: "Untitled Snip",
            type: "text",
            textContent: "",
          },
        ],
      },
    });

    const snipId = res.data?.insertIntoSnipCollection?.records?.[0]?.id;
    if (snipId) {
      setSnipId(snipId);
    }
  }, []);

  const handleCreateAll = async () => {
    await ac.mutate({
      mutation: updateSnipFlatMutDoc,
      variables: {
        set: {
          name: activitySourceTitle,
          textContent: activitySourceText,
        },
        filter: {
          id: { eq: snipId },
        },
        atMost: 1,
      },
    });

    const skillResourceDeep = await ac.query({
      query: GetResourceDeepDocument,
      variables: {
        filter: {
          childSnipId: { eq: snipId },
        },
      },
    });

    const skillIds =
      skillResourceDeep.data?.resourceCollection?.edges?.map(
        (edge) => edge.node?.parentSkill?.id
      ).filter(notEmpty) ?? [];

    const pairs = skillIds.flatMap((skillId) =>
      activityIds.map((activityId) => ({
        skillId,
        activityId,
      }))
    );

    await ac.mutate({
      mutation: createActivitySkillFlatMutDoc,
      variables: {
        objects: pairs.map((pair) => ({
          activity: pair.activityId,
          skill: pair.skillId,
          weight: 0.5,
        })),
      },
    });
  };

  const handleActivityTypeCreate = async (activityType: string) => {
    const actGenRes = await ActivityGenerateRoute.call({
      activityTypes: [activityType as any],
      from: { 
        documents: [{
          title: activitySourceTitle,
          text: activitySourceText,
        }] 
      },
    });

    if (actGenRes.success) {
      setActivityIds((existing) => [...existing, ...actGenRes.data.activityIds]);
    }
  };

  const renderImportSection = () => (
    <Stack>
        
        {
            imports && imports.decks && imports.decks.length > 0 ? (
                <ImportApkgFile decks={imports.decks} />
            )
            :
            <AnkiImportButton
                onImport={async ({ decks }) => {
                    setImports({ decks });
                }}
            />
        }
    </Stack>
  );

  const renderCreateSection = () => (
    <Stack direction={isSmallDevice ? "column" : "row"} gap={2}>
      <Stack gap={1.5} width={isSmallDevice ? undefined : "400px"}>
        <TxtField
          startIcon={<Label fontSize="small" />}
          value={activitySourceTitle}
          onChange={(ev) => setActivitySourceTitle(ev.target.value)}
          label="Source Text Name"
          size="small"
          fullWidth
          placeholder="My Cool Subject Matter"
        />
        <TxtField
          startIcon={<SnipIcon fontSize="small" />}
          value={activitySourceText}
          onChange={(ev) => setActivitySourceText(ev.target.value)}
          label="Paste Or Type Your Source Text Here"
          multiline
          fullWidth
          rows={7}
          placeholder="My Cool Subject Matter"
        />
      </Stack>
      <Stack gap={2} maxHeight="700px" maxWidth={"400px"}>
        <Stack flex="0 0 auto">
          <Button disabled={activityIds.length === 0} onClick={handleCreateAll}>
            Create All
          </Button>
          {snipId ? (
            <SnipAddToAutocomplete snipId={snipId} />
          ) : (
            <Skeleton variant="rectangular" width="100%" height="100px" />
          )}
          <CreateActivityTypeButtonGroup
            onActivityTypeCreate={handleActivityTypeCreate}
          />
        </Stack>
        <Stack flex="1 1 auto" gap={1} overflow={"auto"}>
          {activityIds.length > 0 && (
            <Stack gap={2}>
              <Typography variant="h6">Created Activities</Typography>
              {activityIds.map((actId) => (
                <Card key={actId}>
                  <Activity activityId={actId} onActivityComplete={() => {}} onDelete={() => {
                    setActivityIds((existing) => existing.filter((id) => id !== actId));
                  }}/>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <Stack {...stackProps}>
      {view === "initial" && (
        <InitialActionCards
          onSelectCreate={() => setView("create")}
          onSelectImport={() => setView("import")}
        />
      )}
      {view === "create" && renderCreateSection()}
      {view === "import" && renderImportSection()}
    </Stack>
  );
}