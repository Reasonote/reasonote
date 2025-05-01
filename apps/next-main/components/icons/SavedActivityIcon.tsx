import React from "react";

import {BookmarkAdded} from "@mui/icons-material";
import {SvgIconProps} from "@mui/material";

export default function SavedActivityIcon(props: SvgIconProps) {
    return <BookmarkAdded fontSize="small" {...props}/>
}