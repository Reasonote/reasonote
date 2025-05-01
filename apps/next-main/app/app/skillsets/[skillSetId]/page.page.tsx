'use client'
import {useRouter} from "next/navigation";

import {useRouteParams} from "@/clientOnly/hooks/useRouteParams";
import {NotFoundPage} from "@/components/navigation/NotFound";
import FullCenter from "@/components/positioning/FullCenter";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";

export default function Page(o: any) {
    const router = useRouter();
    const skillSetId = useRouteParams(o.params, 'skillSetId');

    return skillSetId ?
        <FullCenter>
            <Card>
                <CardHeader title="Default Skill Set" />
                <CardContent>
                    <Button onClick={() => router.push(`/app/skillsets/${skillSetId}/tree`)}>
                        Show Tree
                    </Button>
                </CardContent>
            </Card>
        </FullCenter>
        :
        <NotFoundPage/>
}