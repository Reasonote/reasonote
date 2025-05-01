import React from "react";

import {motion} from "framer-motion";
import {useRouter} from "next/navigation";

import {ArrowBack as ArrowBackIcon} from "@mui/icons-material";
import {
  IconButton,
  Tooltip,
} from "@mui/material";

export function BackToToolsButton() {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
                position: 'absolute', 
                top: 10,
                left: 16, 
                zIndex: 20,
            }}
        >
            <Tooltip title="Back to Tools">
                <IconButton 
                    onClick={() => router.push('/app/tools')}
                    color="primary"
                    sx={{ 
                        bgcolor: 'background.paper', 
                        boxShadow: 1,
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
            </Tooltip>
        </motion.div>
    );
} 