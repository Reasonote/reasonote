import React, {useRef} from "react";

import {
  FillSubskillTreeRouteResponse,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {AccountTree} from "@mui/icons-material";
import {
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import {SkillTreeV2} from "../skill/SkillTreeV2/SkillTreeV2";
import {Txt} from "../typography/Txt";

interface SkillTreePanelProps {
  usingSkillId: string | null;
  skillTreeResult?: FillSubskillTreeRouteResponse | null;
  onCreateLesson?: (skillId: string) => void;
}

export const SkillTreePanel: React.FC<SkillTreePanelProps> = ({
  usingSkillId,
  onCreateLesson,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Stack height={'100%'} width={'100%'} overflow={'auto'} ref={containerRef}>
      {usingSkillId ? (
        <div>
          <SkillTreeV2
            hideAfterDepth={2}
            skillId={usingSkillId}
            skillChipProps={(n) => ({ size: 'small' as const, topicOrId: n.name ?? '' })}
            variant={'graph'}
            showScore={true}
            containerRef={containerRef}
            onCreateLessonOverride={onCreateLesson}
            emptyState={<Card>
              <CardContent>
                <AccountTree color="gray" fontSize="large"/>
                <Typography color="gray" sx={{color: 'gray'}} variant="h5">Generating your skill tree...</Typography>
                <Typography color="gray" sx={{color: 'gray'}} variant="caption">
                  This may take a while, please be patient.
                </Typography>
              </CardContent>
            </Card>}
          />
        </div>
      ) :
        <div>
          <Txt startIcon={<AccountTree/>} variant="h4">Skill Tree Generating</Txt>
          <Txt>
            This may take a while, please be patient.
          </Txt>
        </div>
      }
    </Stack>
  );
};