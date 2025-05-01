"use client";

import _ from "lodash";

import {
  generateFYPActivityProps,
  generateFYPActivityResult,
} from "./generateFYPActivityTypes";
import {generateFYPActivityV1} from "./v1/generateFYPActivityV1";

export async function generateFYPActivity(props: generateFYPActivityProps): Promise<generateFYPActivityResult>{
    if (props.algorithm === 'v1'){
        return await generateFYPActivityV1(props);
    }
    else {
        throw new Error(`Algorithm version "${props.algorithm}" not supported!`)
    }
}