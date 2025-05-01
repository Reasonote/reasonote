'use client'
import {useRouter} from "next/navigation";

import FullCenter from "@/components/positioning/FullCenter";
import {
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";

export default function Page(){
    const router = useRouter();
    return <FullCenter>
        <Card>
            <Stack gap={1}>
                <Typography>Create New Skillset</Typography>
                <Button onClick={() => router.push(`/app/skillsets/create/fromdocument`)}>
                    From Document
                </Button>
            </Stack>
        </Card>
    </FullCenter>

}