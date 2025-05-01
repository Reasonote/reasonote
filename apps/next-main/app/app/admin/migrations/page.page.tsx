'use client'
import React, {useState} from "react";

import {useToken} from "@/clientOnly/hooks/useToken";
import FullCenter from "@/components/positioning/FullCenter";
import {KeyboardArrowLeft} from "@mui/icons-material";
import {
  Card,
  CardHeader,
  IconButton,
  Typography,
} from "@mui/material";

export default function AddBetaUserPage() {
    const [issue, setIssue] = useState<{severity: 'warning' | 'error' | 'info', message: string | React.ReactNode} | null>(null);
    const {token} = useToken();
    
    return <FullCenter>
        <Card sx={{padding: '10px'}}>
            <CardHeader 
                avatar={
                    <IconButton onClick={() => {
                        window.history.back()
                    }}>
                        <KeyboardArrowLeft/>
                    </IconButton>
                } 
                title={
                    <Typography variant="h5">
                        Migrations
                    </Typography>
                }
            /> 
        </Card>
    </FullCenter>
}