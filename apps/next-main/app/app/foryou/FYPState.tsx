import {makeVar} from "@apollo/client";

import {FYPIntent} from "./FYPTypes";

export const vFYPIntent = makeVar<FYPIntent | null>(null);