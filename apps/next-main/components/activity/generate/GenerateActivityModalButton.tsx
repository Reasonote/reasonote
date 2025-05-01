'use client'
import { useState } from "react";

import {
  useActivityTypeClient,
} from "@/components/activity/activity-type-clients/useActivityTypeClient";
import {
  ActivityTypeIndicator,
} from "@/components/activity/ActivityTypeIndicator";
import {
  ActivityType,
  ActivityTypesPublic,
} from "@reasonote/core";
import { ModalContent } from "@/components/modals/ModalContent";
import {
  Button,
  Grid,
  MenuItem,
  Modal,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  ActivityTypeSelector,
} from "../components/ActivityTypeSelector";

interface LessonGenerateActivitiesArgs {
  activityTypes: ActivityType[];
  activityCount: number;
  additionalInstructions?: string;
}

interface GenerateActivitiesModalButtonProps {
  onGenerateActivities: (args: LessonGenerateActivitiesArgs) => void;
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


function ActivityTypeMenuItem({ activityType, onClick, disabled }) {
  const { data: { definition } } = useActivityTypeClient({ activityType: activityType });

  return (
    <MenuItem
      key={activityType}
      onClick={onClick}
      disabled={disabled}
    >
      <Tooltip title={`Add ${definition?.typeHumanName}`} arrow>
        <Grid container alignItems="center" wrap="nowrap">
          <ActivityTypeIndicator activityType={activityType} />
        </Grid>
      </Tooltip>
    </MenuItem>
  );
}

export function GenerateActivitiesModalButton({ onGenerateActivities }: GenerateActivitiesModalButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [activityCount, setActivityCount] = useState<null | number>(1);
  const disabledActivityTypes: any[] = []; // Define disabled activity types if any
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<ActivityType[]>([...ActivityTypesPublic]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (activityType) => {
    setSelectedActivityTypes([...selectedActivityTypes, activityType]);
    handleClose();
  };

  const handleActivityCountChange = (event) => {
    if (event.target.value === "") {
      setActivityCount(null);
      return;
    }
    const newValue = parseInt(event.target.value);

    if (newValue <= 10) {
      if (newValue < 1) {
        // setActivityCount(1);
      }
      else {
        setActivityCount(newValue);
      }
    }
    else {
      // setActivityCount(10);
    }
  };

  const { data: { definition } } = useActivityTypeClient({ activityType: ActivityTypesPublic[0] });

  return (
    <>
      <Button variant="contained" onClick={handleOpenModal}>
        Generate Activities
      </Button>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="create-activities-modal-title"
        aria-describedby="create-activities-modal-description"
      >
        <ModalContent>
          <Stack width={'500px'}>
            <Typography id="create-activities-modal-title" variant="h6">
              Generate Activities
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <ActivityTypeSelector
                  enabledActivityTypes={selectedActivityTypes}
                  onActivityTypeChange={(activityTypes: string[]) => {
                    setSelectedActivityTypes(activityTypes as any);
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Number of Activities"
                  type="number"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                  value={activityCount}
                  onChange={handleActivityCountChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Additional Instructions"
                  type="text"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  multiline
                  maxRows={10}
                  minRows={2}
                  variant="outlined"
                  fullWidth
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (!activityCount) {
                      return;
                    }
                    onGenerateActivities({
                      activityTypes: selectedActivityTypes,
                      activityCount,
                      additionalInstructions,
                    });

                    handleCloseModal();
                  }}
                >
                  Generate Activities
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </ModalContent>
      </Modal>
    </>
  );
}