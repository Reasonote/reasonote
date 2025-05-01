import {ReasonoteLicenseType} from "@reasonote/core";

import {useReasonoteLicense} from "./useReasonoteLicense";

export function useHasLicenseType(type: ReasonoteLicenseType) {
    const {data: licenseData, loading: licenseLoading, error: licenseError, refetch: licenseRefetch} = useReasonoteLicense();


    if (licenseLoading) {
        return {
            data: false,
            loading: true,
            error: null,
            refetch: licenseRefetch
        }
    }
    else if (licenseError) {
        return {
            data: false,
            loading: false,
            error: licenseError,
            refetch: licenseRefetch
        }
    }
    else {
        return {
            data: licenseData?.currentPlan.type === type,
            loading: false,
            error: null,
            refetch: licenseRefetch
        }
    }
}