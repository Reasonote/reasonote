import React, { SyntheticEvent, useEffect, useState } from "react";

import _, { Dictionary } from "lodash";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  Card,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { notEmpty } from "@reasonote/lib-utils";

import ComparisonCard from "./ComparisonCard";

interface Entity {
  entityTypeId: string;
  entityId?: string;
  data: Dictionary<any>;
}

interface ComparisonSliderProps {
  newEntities: Entity[];
  existingEntities: Entity[];
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  newEntities,
  existingEntities,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchValue, setSearchValue] = React.useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = React.useState("");
  const [acceptedEntities, setAcceptedEntities] = useState<Dictionary<any>>({});
  const [rejectedEntities, setRejectedEntities] = useState<Dictionary<any>>({});
  const [matchingExistingEntityId, setMatchingExistingEntityId] = useState<
    string | undefined
  >(undefined);
  // The staged entity we're currently operating on.
  const [currentStagedEntity, setCurrentStagedEntity] = useState<
    Dictionary<any>
  >({});
  const [currentRejectedFields, setCurrentRejectedFields] = useState<
    (string | number)[][]
  >([]);

  const currentEntity = newEntities[currentIndex] as Entity | undefined;

  // Whenever the currentEntity changes, we need to initialize the currentStagedEntity.
  useEffect(() => {
    // Reset the staged entity.
    currentEntity?.data && setCurrentStagedEntity(currentEntity?.data);

    // Reset the rejected fields.
    setCurrentRejectedFields([]);
  }, [currentIndex]);

  const noMoreEntities = !currentEntity;

  const matchingExistingEntity = matchingExistingEntityId
    ? existingEntities.find(
        (entity) => entity.entityId === matchingExistingEntityId
      )
    : undefined;

  const handleAccept = () => {
    if (!currentEntity) {
      return;
    }

    // TODO LUKE YOU ARE ALMOST THERE!!!!
    // you just need to "reject" the fields which have been rejected.
    // This could probably be done more elegantly, and elsehwere,
    // but if you do that here - you'll be able to start using this the way you want...

    console.log("handleAccept", currentStagedEntity);

    // Clear Search / Matching Entity.
    setMatchingExistingEntityId(undefined);

    // Set Accepted Entities.
    setAcceptedEntities({
      ...acceptedEntities,
      [currentEntity.entityId as string]: currentEntity.data,
    });

    // Move to next entity.
    setCurrentIndex(currentIndex + 1);
  };

  const handleReject = () => {
    if (!currentEntity) {
      return;
    }

    console.log("handleReject", currentStagedEntity);

    // Clear Search / Matching Entity.
    setMatchingExistingEntityId(undefined);

    // Set Rejected Entities.
    setRejectedEntities({
      ...rejectedEntities,
      [currentEntity.entityId as string]: currentEntity.data,
    });

    // Move to next entity.
    setCurrentIndex(currentIndex + 1);
  };

  const handleSearch = (
    event: SyntheticEvent<Element, Event>,
    value: any,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<any> | undefined
  ) => {
    if (!value) {
      setMatchingExistingEntityId(undefined);
      setSearchValue(null);
      return;
    }
    setSearchValue(value.label);
    setMatchingExistingEntityId(value.id);
  };

  const handleModifyStaged = (path: (string | number)[], newValue: any) => {
    console.log("handleModifyStaged", path, newValue);
    // Clone the staged entity, and set the new value at the path.
    const newObj = _.set(_.cloneDeep(currentStagedEntity), path, newValue);

    // Set the new staged entity.
    setCurrentStagedEntity(newObj);
  };

  const handleDelete = (path: (string | number)[]) => {
    setCurrentRejectedFields([...currentRejectedFields, path]);
  };

  console.log("ComparisonSlider", {
    original: matchingExistingEntity?.data,
    proposedChanges: currentEntity?.data,
  });

  return (
    <Grid container direction="column">
      <>
        <Grid item>
          <Autocomplete
            id="free-solo-demo"
            value={searchValue}
            inputValue={searchInputValue}
            onInputChange={(event, newInputValue) => {
              setSearchInputValue(newInputValue);
            }}
            freeSolo
            options={existingEntities
              .map((option) =>
                option.data.name
                  ? {
                      label: option.data.name,
                      id: option.entityId,
                    }
                  : undefined
              )
              .filter(notEmpty)}
            renderInput={(params: any) => (
              <TextField {...params} label="Search" />
            )}
            onChange={handleSearch}
          />
        </Grid>

        <Grid item>
          <Grid container justifyItems={"space-between"} alignItems="center">
            <Grid
              container
              item
              xs={1}
              alignItems={"center"}
              justifyItems={"center"}
            >
              <IconButton onClick={handleReject} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Grid>

            <Grid item xs={10}>
              {noMoreEntities ? (
                <Card>
                  <Typography variant="h6">
                    No more entities to compare
                  </Typography>
                </Card>
              ) : (
                <Card>
                  <Typography variant="h6">
                    {currentEntity?.data.name}
                  </Typography>
                  <Typography variant="subtitle2">
                    {currentEntity?.entityTypeId}
                  </Typography>

                  {matchingExistingEntity ? (
                    <ComparisonCard
                      comparison={{
                        original: matchingExistingEntity.data,
                        proposedChanges: currentEntity.data,
                        stagedChanges: currentStagedEntity,
                        rejectedFields: currentRejectedFields,
                      }}
                      onDelete={handleDelete}
                      onModifyStaged={handleModifyStaged}
                    />
                  ) : (
                    <div>No Matching Entities Found</div>
                  )}
                </Card>
              )}
            </Grid>

            <Grid item xs={1}>
              <IconButton onClick={handleAccept} size="small">
                <CheckIcon fontSize="small" />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </>
    </Grid>
  );
};
