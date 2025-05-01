'use client'

import {useRouter} from "next/navigation";

import FullCenter from "@/components/positioning/FullCenter";
import {
  Card,
  CardHeader,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";

export default function Page() {
    const router = useRouter();
    return <FullCenter>
        <Card sx={{width: '100%'}}>
            <CardHeader title="Skill Sets" />
            <List>
                <ListItem>
                    <ListItemButton onClick={() => {
                        router.push('/app/skillsets/create')
                    }}>
                        Create
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <Typography  onClick={() => {
                        router.push('/app/skillsets/default')
                    }}>
                        Default Skillset
                    </Typography>
                </ListItem>
            </List>
        </Card>
    </FullCenter>
}