import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import _ from "lodash";
import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {useUserSkills} from "@/clientOnly/hooks/useUserSkills";
import {Grid} from "@mui/material";
import {Skill} from "@reasonote/lib-sdk-apollo-client";
import {notEmpty} from "@reasonote/lib-utils";

import {SkillChip} from "../chips/SkillChip/SkillChip";

export async function getSuggestedSkills({context, existingSkills}: {context?: string, existingSkills: string[]}) {
    return await oneShotAIClient({
        systemMessage: "You are responsible for suggesting skills the user would be interested in learning.",
        functionName: "suggestSkills",
        functionDescription: "Suggest skills for the user to learn.",
        functionParameters: z.object({
            suggestedSkills: z.array(z.object({
                name: z.string().describe('The name of the skill'),
            })).describe("Skills to suggest to the user"),
        }),
        otherMessages: [
            {
                role: "assistant",
                content: `
                I know the following context about this user:
                ${context}
                `
            },
            {
                role: "assistant",
                content: `
                I know the user already has these skills:
                ${existingSkills.map(skill => `- ${skill}`).join('\n')}
                `
            },
        ],
        driverConfig: {
            type: 'openai',
            config: {
                model: 'gpt-4o-mini'
            }
        }
    })
}


export function SuggestedSkills({context}: {context?: string}) {
    // TODO: get the user's skills
    const existingSkillsResult = useUserSkills();

    const existingSkills = existingSkillsResult.skills ?? [];

    console.log("existingSkills", existingSkills)

    // TODO: pass to SuggestedSkillDumb
    return <div>
        <SuggestedSkillsDumb context={context ?? ""} existingSkills={existingSkills} />
    </div>
}

export function SuggestedSkillsDumb({ context, existingSkills }: { context: string, existingSkills: Partial<Skill>[] }) {
    const [suggestedSkills, setSuggestedSkills] = useState<{name: string}[]>([]);
    const loadingRef = useRef(false);
    const observer = useRef<IntersectionObserver>();
    const lastSkillElementRef = useRef<HTMLDivElement>(null);

    const allSkills: {name?: string;}[] = [
        ...suggestedSkills,
        ...existingSkills,
    ]

    // fetch more skills when scrolled to bottom
    const fetchMoreSkills = useCallback(async () => {
        if (loadingRef.current) return; // Don't fetch if already loading

        loadingRef.current = true;


        const suggestedResp = await getSuggestedSkills({
            existingSkills: allSkills.map((s) => s.name).filter(notEmpty),
        })

        const newSuggestions = suggestedResp.data?.suggestedSkills;

        if (!newSuggestions) {
            console.error("No new suggestions");
            return;
        }

        setSuggestedSkills((v) => {
            return _.uniqBy(
                [
                    ...v,
                    ...newSuggestions
                ],
                (_v) => _v.name
            )
        })

        loadingRef.current = false;
    }, [allSkills]);

    useEffect(() => {
        // Handle the case where we aren't probably scrolling yet
        if (suggestedSkills.length < 40){
            fetchMoreSkills();
        }
    }, [suggestedSkills])

    useEffect(() => {
        fetchMoreSkills();
    },[])

    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            console.log('INTERSECTING')
            if (entries[0].isIntersecting) {
                fetchMoreSkills();
            }
        });

        if (lastSkillElementRef.current) {
            observer.current.observe(lastSkillElementRef.current);
        }

    }, [fetchMoreSkills]);



    return (
        <Grid container gap={1} height={'100%'} width={'100%'}>
            {
                suggestedSkills.map((skill, index) => {
                    if (suggestedSkills.length === index + 1) {
                        return (
                            <Grid item ref={lastSkillElementRef}>
                                <SkillChip topicOrId={skill.name} />
                            </Grid>
                        )
                    } else {
                        return (
                            <Grid item>
                                <SkillChip topicOrId={skill.name} />
                            </Grid>
                        )
                    }
                })
            }
        </Grid>
    );
}
