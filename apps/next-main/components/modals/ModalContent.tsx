import React from "react";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Box,
  BoxProps,
  Card,
  CardProps,
} from "@mui/material";

export const ModalContent = React.forwardRef<HTMLDivElement, {
    children: React.ReactNode,
    cardProps?: CardProps,
    boxProps?: BoxProps
}>(function ModalContent({children, cardProps, boxProps}, ref) {
    const isSmallDevice = useIsSmallDevice();
    return <Box
            {...boxProps}
            ref={ref}
            tabIndex={-1}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            role="dialog"
            sx={{
                position: "absolute" as "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxWidth: isSmallDevice ? "100vw" : "auto",
                maxHeight: "80vh",
                overflow: "auto",
                width: isSmallDevice ? "100vw" : "auto",
                outline: "none",
                ...boxProps?.sx
            }}
        >
        <Card {...cardProps}>
            {children}
        </Card>
    </Box>
});