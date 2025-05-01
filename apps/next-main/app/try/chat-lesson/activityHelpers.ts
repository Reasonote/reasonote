import {ActivityConfig} from "@reasonote/core";
import {ActivityFlatFragFragment} from "@reasonote/lib-sdk-apollo-client";

export const transformActivities = (activities: ActivityConfig[] | undefined | null): ActivityFlatFragFragment[] =>
    activities?.map((activity, index) => ({
      ...activity,
      typeConfig: activity,
      type: activity.type,
      id: index.toString(),
      name: index.toString(),
      createdDate: new Date(),
      updatedDate: new Date(),
    })) || [];

export function getActivitiesWithVersions(activities: Omit<ActivityConfig, "version">[]) {
    return activities.map((activity) => ({
        ...activity,
        version: activity.type === "slide" ? "0.0.0" : 
            activity.type === "multipleChoice" ? "0.0.1" :
            activity.type === "termMatching" ? "0.0.0" :
            "0.0.0"
    }));
}