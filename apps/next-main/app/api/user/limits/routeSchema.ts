import {z} from "zod";

import {ReasonoteLicenseTypeSchema} from "@reasonote/core";
import {ApiRoute} from "@reasonote/lib-api-sdk";

const FeatureUsageSchema = z.object({
  periodStart: z.string().nullish(), // ISO datetime string
  periodEnd: z.string().nullish(),   // ISO datetime string
  numberInPeriod: z.number().nullish(),
  numberInPeriodAllowed: z.number().nullish(),
  numberTotal: z.number().nullish(),
  numberTotalAllowed: z.number().nullish(),
  isUnlimitedPerPeriod: z.boolean().nullish(),
  isUnlimitedTotal: z.boolean().nullish(),
  isOverLimit: z.boolean().nullish()
});

export const UserLimitsRoute = new ApiRoute({
  path: "/api/user/limits",
  method: "post",
  requestSchema: z.object({}),
  responseSchema: z.object({
    features: z.array(z.object({
      featureId: z.string(),
      usage: FeatureUsageSchema.optional(),
      isEnabled: z.boolean(),
    })),
    currentPlan: z.object({
      type: ReasonoteLicenseTypeSchema,
      name: z.string(),
      isCanceled: z.boolean().optional(),
      canceledAt: z.string().nullable().optional(),
      cancellationReason: z.string().nullable().optional(),
    })
  }),
}); 