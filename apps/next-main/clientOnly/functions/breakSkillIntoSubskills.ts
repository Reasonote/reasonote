import {z} from "zod";

import {oneShotAIClient} from "@/clientOnly/ai/oneShotAIClient";
import {trimLines} from "@lukebechtel/lab-ts-utils";

export async function breakSkillIntoSubskills(skillName: string, allowSameSkill = false) {
    const ret = await oneShotAIClient({
      systemMessage: trimLines(
        `
              The user needs help breaking down the concept of ${skillName} into a tree of its subskills.
              `
      ),
      functionName: "breakSkillIntoSubskills",
      functionDescription: "Break down a skill into its subskills",
      functionParameters: z.object({
        subskillTree: z
          .array(
            z.object({
              name: z.string(),
              prerequisites: z.array(z.string()),
            })
          )
          .describe("The tree of subskills you have identified for this skill"),
      }),
      driverConfig: {
        type: 'openai',
        config: {
          model: 'gpt-4o-mini'
        }
      }
    });

    if (ret.data){
      return {
        ...ret,
        data: {
          // Sometimes it returns the same thing (i.e. inputting "calculus" will sometimes produce "calculus").
          // We filter that out here, as we don't think it's ever useful.
          subskillTree: 
            allowSameSkill ? 
              ret.data.subskillTree :
              ret.data.subskillTree.filter((s) => s.name !== skillName)
        }
      }
    }
    else {
      return ret;
    }
  }