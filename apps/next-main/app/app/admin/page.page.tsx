'use client'

import {useState} from "react";

import {useRouter} from "next/navigation";

import {
  RevectorizeAllRoute,
} from "@/app/api/internal/revectorize_all/routeSchema";
import {
  SnipExtractTextCronRoute,
} from "@/app/api/internal/snip_extract_text_cron/routeSchema";
import FullCenter from "@/components/positioning/FullCenter";
import {useSupabase} from "@/components/supabase/SupabaseProvider";

import {CheckCircle} from "@mui/icons-material";
import {
  Button,
  Card,
  CircularProgress,
  Divider,
  Modal,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

export function RevectorizeAllButton() {
    const theme = useTheme();
    const [showModal, setShowModal] = useState<boolean>(false)
    const [opState, setOpState] = useState<{status: 'idle'} | {status: 'running'} | {status: 'done', result: 
        Awaited<ReturnType<typeof RevectorizeAllRoute.call>>
    }>({status: 'idle'})
    const {sb} = useSupabase()

    return <Stack>
        <Button onClick={() => {
            setShowModal(true);
        }}>
            Revectorize all
        </Button>

        <Modal
            open={showModal}
            onClose={() => {
                console.log('close')
                setShowModal(false)
            }}
            sx={{
                alignContent: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
            }}
        >
            <Card sx={{padding: '10px', maxHeight: '800px', minWidth: theme.breakpoints.values.sm, overflow: 'auto'}}>
                <Stack>
                    {
                        opState.status === 'idle' ?
                            <Button onClick={() => {
                                setOpState({status: 'running'})
                                RevectorizeAllRoute.call({magicWord: 'please'})
                                .then((result) => {
                                    setOpState({status: 'done', result})
                                })
                            }}>
                                Start
                            </Button>
                            :
                            opState.status === 'running' ?
                                <Stack direction={'row'} alignItems={'center'} gap={1}>
                                    <CircularProgress/>
                                    <Typography>Running...</Typography>
                                </Stack>
                                :
                                opState.status === 'done' ?
                                    <Stack>
                                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                                            <CheckCircle/>
                                            <Typography variant={'h4'}>
                                                Done!
                                            </Typography>
                                        </Stack>
                                        <Stack>
                                            <Button onClick={() => {
                                                setOpState({status: 'running'})
                                                RevectorizeAllRoute.call({magicWord: 'please'})
                                                .then((result) => {
                                                    setOpState({status: 'done', result})
                                                })
                                            }}>
                                                Run Again
                                            </Button>
                                        </Stack>
                                        <Stack>
                                            {
                                                opState.result.data?.results.map((result) => {
                                                    return <Stack gap={1}>
                                                        <Typography variant={'h5'}>{result.tablename}.{result.colname}{result.colpath ? `.${result.colpath.join('.')}` : ''}</Typography>
                                                        <Typography>Vecs Queued: {result.numQueuedVecs}</Typography>
                                                        <Typography>Vecs Failed: {result.numVecsFailedToQueue}</Typography>
                                                        <Divider/>
                                                    </Stack>
                                                })
                                            }
                                        </Stack>
                                    </Stack>
                                    :
                                    null
                    }
                </Stack>
            </Card>
        </Modal>
    </Stack>
}


export function ExtractTextButton() {
    const theme = useTheme();
    const [showModal, setShowModal] = useState<boolean>(false)
    const [opState, setOpState] = useState<{status: 'idle'} | {status: 'running'} | {status: 'done', result: 
        Awaited<ReturnType<typeof SnipExtractTextCronRoute.call>>
    }>({status: 'idle'})

    return <Stack>
        <Button onClick={() => {
            setShowModal(true);
        }}>
            Snip Extract Text (Cron)
        </Button>

        <Modal
            open={showModal}
            onClose={() => {
                console.log('close')
                setShowModal(false)
            }}
            sx={{
                alignContent: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
            }}
        >
            <Card sx={{padding: '10px', maxHeight: '800px', minWidth: theme.breakpoints.values.sm, overflow: 'auto'}}>
                <Stack>
                    {
                        opState.status === 'idle' ?
                            <Button onClick={() => {
                                setOpState({status: 'running'})
                                SnipExtractTextCronRoute.call({})
                                    .then((result) => {
                                        setOpState({status: 'done', result})
                                    })
                            }}>
                                Start
                            </Button>
                            :
                            opState.status === 'running' ?
                                <Stack direction={'row'} alignItems={'center'} gap={1}>
                                    <CircularProgress/>
                                    <Typography>Running...</Typography>
                                </Stack>
                                :
                                opState.status === 'done' ?
                                    <Stack>
                                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                                            <CheckCircle/>
                                            <Typography variant={'h4'}>
                                                Done!
                                            </Typography>
                                        </Stack>
                                        <Stack>
                                            <Button onClick={() => {
                                                setOpState({status: 'running'})
                                                SnipExtractTextCronRoute.call({})
                                                    .then((result) => {
                                                        setOpState({status: 'done', result})
                                                    })
                                            }}>
                                                Run Again
                                            </Button>
                                        </Stack>
                                        <Stack>
                                            {
                                                opState.result.data?.result.map((result) => {
                                                    return <Stack gap={1}>
                                                        <Typography variant={'h5'}>{result.id}</Typography>
                                                        <Divider/>
                                                    </Stack>
                                                })
                                            }
                                        </Stack>
                                    </Stack>
                                    :
                                    null
                    }
                </Stack>
            </Card>
        </Modal>
    </Stack>
}


export default function AdminPage(){
    const theme = useTheme();
    const router = useRouter()

    const adminSubdirectories = [
        'users',
        'testing',
        'migrations',
        'resend-sync',
        'send-email',
        'testing'
    ]

    return <FullCenter>
        <Card sx={{padding: '10px', width: theme.breakpoints.values.sm}}>
            <Stack sx={{maxHeight: '80vh', overflow: 'auto'}} spacing={2}>
                <Typography variant="h4" align="center">Admin Dashboard</Typography>

                <RevectorizeAllButton/>

                <ExtractTextButton/>

                <Divider />

                <Typography variant="h6">Admin Pages</Typography>
                {adminSubdirectories.map((subdir) => (
                    <Button 
                        key={subdir}
                        onClick={() => {
                            router.push(`/app/admin/${subdir}`)
                        }}
                        variant="outlined"
                    >
                        {subdir.charAt(0).toUpperCase() + subdir.slice(1)}
                    </Button>
                ))}
            </Stack>
        </Card>
    </FullCenter>
}