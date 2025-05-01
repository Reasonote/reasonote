"use client";
import { useEffect, useState } from "react";

import _ from "lodash";

import { Box } from "@mui/material";

const Component = () => {
  // const classes = useStyles();
  const [query, setQuery] = useState("");
  const [rawText, setRawText] = useState("");
  const [chunks, setChunks] = useState<string[]>([]);

  return <Box sx={{ padding: "20px" }}>Not Implemented</Box>;
};

//////////////////////////////////////////////
// The actual exported page.
export default function Web() {
  // This is my way of doing NoSSR.
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  return <>{domLoaded && <Component />}</>;
}
