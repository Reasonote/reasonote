import _ from "lodash";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {AddToSkillTreeRouteHandler} from "./handler";
import {SkillsAddToSkillTreeRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;



export const {
    POST,
} = makeServerApiHandlerV3({
    route: SkillsAddToSkillTreeRoute,
    handler: AddToSkillTreeRouteHandler
})
