"use client";
import { Skeleton } from "@mui/material";

export default function Web(props: { params: any }) {
  return (
    <Skeleton variant="rectangular" width={"100%"} height={"90vw"}></Skeleton>
  );
}
