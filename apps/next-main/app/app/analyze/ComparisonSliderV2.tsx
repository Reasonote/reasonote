import React, { SyntheticEvent, useEffect, useState } from "react";

import { compare, Operation as JSONPatchOperation } from "fast-json-patch";
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

import ComparisonCardV2 from "./ComparisonCardV2";

interface Entity {
  entityTypeId: string;
  entityId?: string;
  data: Dictionary<any>;
}

interface ComparisonSliderV2Props {
  newEntities: Entity[];
  existingEntities: Entity[];
}

export const ComparisonSliderV2: React.FC<ComparisonSliderV2Props> = ({
  newEntities,
  existingEntities,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchValue, setSearchValue] = React.useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = React.useState("");

  // Accepted Patches
  const [acceptedPatches, setAcceptedPatches] = useState<
    {
      originalEntity: Entity;
      changes: {
        proposed: JSONPatchOperation[];
        userEdits: JSONPatchOperation[];
      };
    }[]
  >([]);
  const [rejectedEntities, setRejectedEntities] = useState<
    {
      originalEntity: Entity;
      changes: {
        proposed: JSONPatchOperation[];
        userEdits: JSONPatchOperation[];
      };
    }[]
  >([]);
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
  const [currentProposedDiff, setCurrentProposedDiff] = useState<
    JSONPatchOperation[]
  >([]);
  const [curUserEditDiff, setCurUserEditDiff] = useState<JSONPatchOperation[]>(
    []
  );

  const currentEntity = newEntities[currentIndex] as Entity | undefined;

  const noMoreEntities = !currentEntity;

  const matchingExistingEntity = matchingExistingEntityId
    ? existingEntities.find(
        (entity) => entity.entityId === matchingExistingEntityId
      )
    : undefined;

  // Whenever the currentEntity changes, we need to initialize the currentStagedEntity.
  useEffect(() => {
    // Reset the staged entity.
    currentEntity?.data && setCurrentStagedEntity(currentEntity?.data);

    // Reset the rejected fields.
    setCurrentRejectedFields([]);
  }, [currentIndex]);

  useEffect(() => {
    // Calculate the diff
    if (matchingExistingEntity && currentEntity) {
      const diff = compare(matchingExistingEntity.data, currentEntity.data);
      // This is now our current diff.
      setCurrentProposedDiff(diff);
    } else {
      setCurrentProposedDiff([]);
      setCurUserEditDiff([]);
    }
  }, [matchingExistingEntityId]);

  /**
   * This is what happens when a set of patches gets completely accepted
   * (i.e. "Swipe Right")
   * @returns
   */
  const handleAccept = () => {
    if (!currentEntity) {
      return;
    }

    console.log("handleAccept", currentStagedEntity);

    // Clear Search / Matching Entity.
    setMatchingExistingEntityId(undefined);

    // TODO: Set Accepted Entities.
    // setAcceptedEntities({
    //     ...acceptedEntities,
    //     [currentEntity.entityId as string]: currentEntity.data,
    // });

    // Move to next entity.
    setCurrentIndex(currentIndex + 1);
  };

  /**
   * This is what happens when a set of patches gets completely rejected
   * (i.e. "Swipe Left")
   * @returns
   */
  const handleReject = () => {
    if (!currentEntity) {
      return;
    }

    console.log("handleReject", currentStagedEntity);

    // Clear Search / Matching Entity.
    setMatchingExistingEntityId(undefined);

    // TODO: Set Rejected Entities.
    // setRejectedEntities({
    //     ...rejectedEntities,
    //     [currentEntity.entityId as string]: currentEntity.data,
    // });

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

  const handleUserEditOp = (op: JSONPatchOperation) => {
    // First, is this the same path and op as before?
    const lastDiffItem = _.last(curUserEditDiff);

    const lastPath = lastDiffItem?.path;
    const lastOp = lastDiffItem?.op;

    // This is done to prevent really really long operation sequences (i.e., assume while user is typing we have to create a single diff for each keystroke... that is inefficient.)
    if (lastPath === op.path && lastOp === op.op && op.op === "replace") {
      const shortened = _.slice(curUserEditDiff, curUserEditDiff.length - 1);

      setCurUserEditDiff([
        ...shortened,
        { path: lastPath, op: "replace", value: op.value },
      ]);
    } else {
      // Add it to our list
      setCurUserEditDiff([...curUserEditDiff, op]);
    }
  };

  return (
    <Grid container direction="column">
      <>
        <Grid item>
          <Autocomplete
            id="free-solo-demo"
            key="free-thing"
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
              <TextField key={params.key ?? ""} {...params} label="Search" />
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
                    <ComparisonCardV2
                      comparison={{
                        original: matchingExistingEntity.data,
                        changes: {
                          proposed: currentProposedDiff,
                          userEdits: curUserEditDiff,
                        },
                      }}
                      onUserEditOp={handleUserEditOp}
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
