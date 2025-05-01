import {
  makeArrayStreamApiRoute,
} from "@/app/api/helpers/apiHandlers/makeArrayStreamApiHandler";
import {BasicApiError} from "@/app/api/helpers/errors";
import {getLessonOverviewStream} from "@reasonote/ai-generators";

import {
  getLessonData,
  LessonResultEntry,
  saveLessonActivities,
  saveLessonSlideOverviews,
} from "../helpers";
import {LessonGetOverviewStreamRoute} from "./routeSchema";

// 5 minute timeout.
export const maxDuration = 300;

export const { POST } = makeArrayStreamApiRoute({
  route: LessonGetOverviewStreamRoute,
  handler: async function* (ctx): AsyncGenerator<any, void, unknown> {
    const { parsedReq, user, ai } = ctx;
    const { lessonId, fieldsToGet = ['slides', 'practice'], forceGenerate = false } = parsedReq;

    if (!user) {  
      throw new BasicApiError("Unauthorized", 401);
    }

    var shouldRegenerateForSlides = true;
    var shouldRegenerateForPractice = true;

    // Get lesson data and check for existing content
    let lesson: LessonResultEntry;
    try {
      const result = await getLessonData(ctx, lessonId);
      lesson = result.lesson;

      const hasExistingSlides = lesson.lesson_activity.some(la => la.activity ? la.activity._type === 'slide' : false);
      const hasExistingPractice = lesson.lesson_activity.some(la => la.activity ? la.activity._type !== 'slide' : false);

      shouldRegenerateForSlides = fieldsToGet.includes('slides') && (!hasExistingSlides || forceGenerate);
      shouldRegenerateForPractice = fieldsToGet.includes('practice') && (!hasExistingPractice || forceGenerate);

      if (!shouldRegenerateForSlides && !shouldRegenerateForPractice) {
        for (const la of lesson.lesson_activity) {
          yield {
            activityId: la.activity?.id,
          };
        }
        return;
      } 
    } catch (error) {
      throw new BasicApiError("Lesson not found", 404);
    }

    const lessonContext = await ai.prompt.lessons.format({lessonId});

    const filteredFieldsToGet = fieldsToGet.filter(field => shouldRegenerateForSlides && field === 'slides' || shouldRegenerateForPractice && field === 'practice');

    var idx = 0;
    // For each item in the getLessonOverviewStream, send it to the client
    for await (const item of getLessonOverviewStream({
      ai,
      // TODO: ugly mapping in
      existingActivities: lesson.lesson_activity
        .map((la) => la.activity)
        .filter((a) => a !== null) as any[],
      lessonContext: lessonContext ?? '',
      fieldsToGet: filteredFieldsToGet,
    })) {
      console.debug(`Item ${idx}: ${JSON.stringify(item)}`);
      if (item.type === 'slide') {
        // Slides are saved as literal activities.
        const result = await saveLessonSlideOverviews(ctx, lessonId, [item]);

        console.debug("save slide overview result", result);

        for (const act of result.activities) {
          yield {
            activityId: act.id,
            type: 'slide',
          };
        }
      } else {
        // Lesson activities are saved as activity descriptions 
        const result = await saveLessonActivities(ctx, lessonId, [item as any]);
        console.debug("save lesson activities result", result);
        for (const act of result.activities) {
          yield {
            activityId: act.id,
            type: 'practice',
          };
        }
      }

      idx++;
    }
  },
}); 
