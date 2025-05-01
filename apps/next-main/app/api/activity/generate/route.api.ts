import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {ActivityGenerateHandler} from "./handler";
import {ActivityGenerateRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 120 seconds.
export const maxDuration = 120;

export const { POST } = makeServerApiHandlerV3({
    route: ActivityGenerateRoute,
    handler: ActivityGenerateHandler
})
