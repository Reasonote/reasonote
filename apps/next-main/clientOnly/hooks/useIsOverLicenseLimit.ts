import {useReasonoteLicense} from "./useReasonoteLicense";

export function useIsOverLicenseLimit(featureId: string) {
    const { data, loading, refetch, error } = useReasonoteLicense();
    
    if (loading) {
        return {
            data: null,
            error: null,
            loading,
            refetch
        };
    }
    else if (error) {
        return {
            data: null,
            error,
            loading,
            refetch
        };
    }
    else {
        return {
            data: !!data?.features.find(f => f.featureId === featureId)?.usage?.isOverLimit,
            loading,
            refetch
        };
    }
}