import type { Database as DatabaseCodegen } from './supabase-rest-codegen';

export type { Json } from './supabase-rest-codegen';

/**
 * Supabase REST API client.
 * 
 * NOTE: this will be generated from the Supabase REST API schema.
 * We have also overridden some definitions in this file, which are marked below.
 * 
 * OVERRIDDEN DEFINITIONS:
 * - get_linked_skills_with_scores
 */
export type Database = DatabaseCodegen & {
    public: {
        Functions: {
            get_linked_skills_with_scores: {
                Args: DatabaseCodegen['public']['Functions']['get_linked_skills_with_scores']['Args']
                Returns: Array<{
                    skill_id: string
                    path_to: string[]
                    path_to_links: string[]
                    min_normalized_score_upstream: number | null
                    max_normalized_score_upstream: number | null
                    average_normalized_score_upstream: number | null
                    activity_result_count_upstream: number
                    all_scores: (number | null)[]
                    num_upstream_skills: number
                }>
            },
            login_jwt: {
                Args: DatabaseCodegen['public']['Functions']['login_jwt']['Args']
                Returns: {
                    /** The user's ID. */
                    id: string,
                    /** If the user has a password, this will be true. */
                    has_password: boolean,
                }
            },
            get_user_limits: {
                Args: DatabaseCodegen['public']['Functions']['get_user_limits']['Args']
                Returns: {
                    features: Array<{
                        featureId: string;
                        isEnabled: boolean;
                        usage: {
                            periodStart: string;
                            periodEnd: string;
                            numberInPeriod: number;
                            numberInPeriodAllowed: number;
                            numberTotal: number;
                            numberTotalAllowed: number;
                            isUnlimitedPerPeriod: boolean;
                            isUnlimitedTotal: boolean;
                            isOverLimit: boolean;
                        };
                    }>;
                    currentPlan: {
                        type: string;
                        name: string;
                    };
                }
            }
        }
    }
}