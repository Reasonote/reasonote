'use client'
import React, {useState} from "react";

import FullCenter from "@/components/positioning/FullCenter";
import {useApolloClient} from "@apollo/client";
import {
  KeyboardArrowLeft,
  Send,
} from "@mui/icons-material";
import {
  Alert,
  Card,
  CardHeader,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {updateRsnUserSysdataFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

export default function AddBetaUserPage() {
    const [email, setEmail] = useState<string>('')
    const [issue, setIssue] = useState<{severity: 'warning' | 'error' | 'info', message: string | React.ReactNode} | null>(null);
    const ac = useApolloClient();
    
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
                        Add Beta User
                    </Typography>
                }
            />
            <Stack gap={2}>
                
                
                <Alert severity="warning">
                    User must already have signed up for an account for this to work.
                </Alert>
                <Stack direction={'row'} gap={1} alignItems={'center'}>
                
                    <TextField
                        label="Email"
                        inputProps={{
                            'data-testid': 'add-beta-user-email-input'
                        }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <IconButton
                        onClick={async () => {
                            const {data, errors} = await ac.mutate({
                                mutation: updateRsnUserSysdataFlatMutDoc,
                                variables: {
                                    set: {
                                        extraLicenseInfo: JSON.stringify({
                                            "Reasonote-Beta": true
                                        })
                                    },
                                    filter: {
                                        authEmail: {
                                            eq: email
                                        }
                                    },
                                    atMost: 1
                                }
                            })

                            if(errors || !data || data.updateRsnUserSysdataCollection.affectedCount < 1) {
                                setIssue(
                                    {
                                        severity: 'error',
                                        message: 
                                            <Typography sx={{whiteSpace: 'pre'}}>
                                                {JSON.stringify({data, errors}, null, 2)}
                                            </Typography>
                                        }
                                    )
                            } else {
                                setIssue({
                                    severity: 'info', 
                                    message: 
                                        <Typography sx={{whiteSpace: 'pre'}}>
                                            {JSON.stringify(data, null, 2)}
                                        </Typography>
                                })
                            }
                        }}
                        sx={{
                            'data-testid': 'add-beta-user-submit-button'
                        }}
                    >
                        <Send/>
                    </IconButton>
                </Stack>
                {
                    issue && 
                        <Alert severity={issue.severity} >
                            <Stack sx={{maxHeight: '500px', overflow: 'auto'}}>
                                {issue.message}
                            </Stack>
                        </Alert>
                }
            </Stack>
        </Card>
    </FullCenter>
}