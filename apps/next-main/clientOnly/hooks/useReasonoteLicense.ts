import {z} from "zod";

import {UserLimitsRoute} from "@/app/api/user/limits/routeSchema";
import {
  makeVar,
  useReactiveVar,
} from "@apollo/client";
import {asyncSleep} from "@lukebechtel/lab-ts-utils";
import {ReasonoteLicensePlans} from "@reasonote/core";
import {
  useAsyncEffect,
  useStateWithRef,
} from "@reasonote/lib-utils-frontend";

import {useRefreshCallback} from "./useCallbackSingleThreaded";
import {useSearchParamHelper} from "./useQueryParamHelper";

type RetType = z.infer<typeof UserLimitsRoute['responseSchema']>;

/**
 * Will be globally shared among all instances of this hook.
 */
const ReasonoteLicenseVar = makeVar<
    { type: 'success', data: RetType | null | undefined } |
    { type: 'error', error: Error } |
    null
>(null);

export function useReasonoteLicense() {
    const value = useReactiveVar(ReasonoteLicenseVar);
    const [isFetching, setIsFetching, isFetchingRef] = useStateWithRef(false);
    const [hasTriedFetching, setHasTriedFetching, hasTriedFetchingRef] = useStateWithRef(false);

    // Cannot use useDevParamHelper here, because we need to fetch the license from the server.
    // otherwise gets recursive
    // If localhost, and there are search params "dev_plan", use that plan
    const { value: devPlan } = useSearchParamHelper('dev_plan');

    // Cannot use useDevParamHelper here, because we need to fetch the license from the server.
    // otherwise gets recursive
    // If localhost, and "dev_plan_limits_exceeded", update all limits to be exceeded
    const { value: devPlanLimitsExceeded } = useSearchParamHelper('dev_plan_limits_exceeded');

    // Cannot use useDevParamHelper here, because we need to fetch the license from the server.
    // otherwise gets recursive
    // If localhost, and "dev_plan_limits_close", update all limits to be closed
    const { value: devPlanLimitsClose } = useSearchParamHelper('dev_plan_limits_close');

    const refetch = useRefreshCallback('useReasonoteLicenseRefetch', async () => {
        if (isFetchingRef.current) {
            return;
        }

        try {
            setIsFetching(true);

            const response = await UserLimitsRoute.call({});

            if (response.success) {
                ReasonoteLicenseVar({ type: 'success', data: response.data });
            }
            else {
                ReasonoteLicenseVar({ type: 'error', error: response.error });
            }
        } catch (error) {
            console.error(error);
        } finally {
            await asyncSleep(100);
            setIsFetching(false);
        }
    }, {throttleMs: 1000});

    // If the value has not been set, fetch it from the server, if we haven't already tried.
    useAsyncEffect(async () => {
        if (!value && !hasTriedFetchingRef.current) {
            setHasTriedFetching(true);
            refetch();
        }
    }, [refetch]);
     
    const canUseDevParams = value?.type === 'success' && ['Reasonote-Admin', 'Reasonote-QA'].includes(value.data?.currentPlan.type ?? '') || window.location.hostname.includes('localhost');

    const devPlanOverride = devPlan && canUseDevParams ? devPlan : null;

    const upsellOverride = devPlanOverride ? 
        ReasonoteLicensePlans[devPlanOverride as keyof typeof ReasonoteLicensePlans]?.upsell : 
        undefined;

    const devPlanLimitsExceededOverride = devPlanLimitsExceeded && canUseDevParams ? true : undefined;
    const devPlanLimitsCloseOverride = devPlanLimitsClose && canUseDevParams ? true : undefined;

    return value?.type === 'success' && value.data ? {
        data: {
            ...value.data,
            currentPlan: {
                ...value.data.currentPlan,
                type: devPlanOverride ?? value.data.currentPlan.type,
                upsell: upsellOverride,
                isCanceled: value.data.currentPlan.isCanceled ?? false,
                canceledAt: value.data.currentPlan.canceledAt,
                cancellationReason: value.data.currentPlan.cancellationReason,
            },
            features: value.data.features.map(f => ({
                ...f,
                usage: f.usage ? {
                    ...f.usage,
                    isOverLimit: devPlanLimitsExceededOverride ? true : f.usage.isOverLimit,
                    numberInPeriod: devPlanLimitsExceededOverride ?
                        f.usage.numberInPeriodAllowed ?? 0 :
                        devPlanLimitsCloseOverride ?
                            (f.usage.numberInPeriodAllowed ?? 0) - 1 :
                            f.usage.numberInPeriod,
                    numberTotal: devPlanLimitsExceededOverride ?
                        f.usage.numberTotalAllowed :
                        devPlanLimitsCloseOverride ?
                            (f.usage.numberTotalAllowed ?? 0) - 1 :
                            f.usage.numberTotal,
                } : undefined
            }))
        },
        refetch: () => {
            refetch();
        },
        error: null,
        loading: isFetching || !value,
    } : {
        data: null,
        error: value?.type === 'error' ? value.error : null,
        loading: isFetching || !value,
        refetch: () => {
            refetch();
        },
    }
}
