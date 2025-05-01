import _ from 'lodash';

import {
  SkillLevel,
} from '@reasonote/core';
import { AIPromptObj } from './AIPromptObj';

export class AIPromptObjLevels extends AIPromptObj {
    async formatLevelExplanation({
        disableTypes
    }: {
        disableTypes?: SkillLevel[]
    }) {
        const explanations = {
            'UNKNOWN': {
                default: "The user's level is unknown."
            },
            'BEGINNER': {
                default: "The user is just starting out."
            },
            'NOVICE': {
                default: "The user has some experience."
            },
            'ADEPT': {
                default: "The user is proficient."
            },
            'PRO': {
                default: "The user knows enough to be a professional."
            },
            'EXPERT': {
                default: "The user knows enough to be an expert."
            }
        }

        const enabledTypes: SkillLevel[] = _.difference(Object.keys(explanations), disableTypes ?? []) as SkillLevel[];

        return enabledTypes.map((type) => `
            <LEVEL>
                <TYPE>
                    ${type}
                </TYPE>
                <EXPLANATION>
                    ${explanations[type].default}
                </EXPLANATION>
            </LEVEL>
        `).join('\n')
    }
}