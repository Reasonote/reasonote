import React from "react";

import {
  Stack,
  Typography,
} from "@mui/material";

export const SwotItemComponent = ({ swotItem }) => {
    return (
        <Stack direction={'row'} gap={1}>
            -
            <Typography>{swotItem.item.description}</Typography>
        </Stack>
    );
};