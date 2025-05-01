'use client'
import {z} from "zod";

import {MainMobileLayout} from "@/components/positioning/MainMobileLayout";
import {SmartSkeleton} from "@/components/smart-skeleton/SmartSkeleton";

export default function Page(){
    return <MainMobileLayout>
        <SmartSkeleton
            oneShotAIArgs={{
                systemMessage: 'You should output a fun fact about lord of the rings.',
                functionName: 'output_fun_fact',
                functionDescription: 'Output a fun fact about lord of the rings.',
                functionParameters: z.object({
                    funFact: z.string(),
                }),
                driverConfig: {
                    type: 'openai',
                    config: {
                        model: 'fastest'
                    }
                
                }
            }}
            formatResponse={(resp) => {
                if (resp.success){
                    return <div>{resp.data.funFact}</div>
                }
                else {
                    return null
                }
            }}
        />
    </MainMobileLayout> 
}