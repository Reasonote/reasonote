import {useReasonoteLicense} from "./useReasonoteLicense";

export function useUserIsLoggedIn() {
    const { data: licenseData, loading: licenseLoading, error: licenseError } = useReasonoteLicense();
    
    return {
        data: !licenseLoading && licenseData?.currentPlan.type !== 'Reasonote-Anonymous',
        loading: licenseLoading,
        error: licenseError,
    };
}
