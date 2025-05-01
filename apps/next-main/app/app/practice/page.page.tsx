'use client';
import {useRouter} from "next/navigation";

import {useSearchParamHelper} from "@/clientOnly/hooks/useQueryParamHelper";
import MobileContent from "@/components/positioning/mobile/MobileContent";
import MobileContentMain
  from "@/components/positioning/mobile/MobileContentMain";
import {PracticePageMain} from "@/components/practice/PracticePageMain";
import {Txt} from "@/components/typography/Txt";

export default function PracticePage() {
    const router = useRouter();
    const { value: skillId } = useSearchParamHelper('skillId');

    return (
        skillId ? (
            <MobileContent>
                <MobileContentMain>
                    <PracticePageMain
                        skillId={skillId}
                        onBack={() => router.push('/app')}
                    />
                </MobileContentMain>
            </MobileContent>
        ) : (
            <MobileContent>
                <MobileContentMain>
                    <Txt>No skill ID provided</Txt>
                </MobileContentMain>
            </MobileContent>
        )
    );
}