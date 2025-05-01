import {
  useEffect,
  useState,
} from "react";

import {useSupabase} from "@/components/supabase/SupabaseProvider";

type SkillProcessingState = 'CREATING_DAG' | 'DAG_CREATION_FAILED' | 'DAG_GENERATED' | 'CREATING_MODULES' | 'MODULE_CREATION_FAILED' | 'SUCCESS' | null;

export interface SkillProcessingStatus {
    isProcessing: boolean;
    error: string | null;
    currentStep: SkillProcessingState;
}

/**
 * Hook to track the processing status of a skill's DAG creation and module generation
 * @param {Object} params - Hook parameters
 * @param {string} params.skillId - Skill ID to track status for
 * @param {number} params.pollInterval - Optional interval in ms to check status (default: 2000)
 * @returns {SkillProcessingStatus} Current processing status
 */
export function useSkillProcessingStatus({ 
    skillId,
    pollInterval = 2000 
}: { 
    skillId: string;
    pollInterval?: number;
}): SkillProcessingStatus {
    const { sb } = useSupabase();
    const [status, setStatus] = useState<SkillProcessingStatus>({
        isProcessing: true,
        error: null,
        currentStep: null
    });

    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            if (!isMounted) return;

            try {
                const { data: skillData, error: fetchError } = await sb
                    .from('skill')
                    .select('processing_state')
                    .eq('id', skillId)
                    .single();

                if (fetchError) throw fetchError;

                if (isMounted) {
                    const processingState = skillData?.processing_state as SkillProcessingState;
                    
                    setStatus({
                        isProcessing: processingState !== null && 
                                    processingState !== 'SUCCESS' && 
                                    processingState !== 'DAG_CREATION_FAILED' && 
                                    processingState !== 'MODULE_CREATION_FAILED' &&
                                    processingState !== 'DAG_GENERATED',
                        error: processingState === 'DAG_CREATION_FAILED' 
                            ? 'DAG creation failed' 
                            : processingState === 'MODULE_CREATION_FAILED'
                                ? 'Module creation failed'
                                : null,
                        currentStep: processingState || null
                    });
                }
            } catch (err) {
                console.error('Error checking skill processing status:', err);
                if (isMounted) {
                    setStatus(prev => ({
                        ...prev,
                        error: err instanceof Error ? err.message : 'Error checking processing status',
                        isProcessing: false,
                        currentStep: null
                    }));
                }
            }
        };

        const interval = setInterval(checkStatus, pollInterval);
        checkStatus(); // Check immediately

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [skillId, sb, pollInterval]);

    return status;
} 