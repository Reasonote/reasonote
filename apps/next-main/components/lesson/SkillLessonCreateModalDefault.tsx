import _ from "lodash";
import {useRouter} from "next/navigation";

import {useApolloClient} from "@apollo/client";
import {notEmpty} from "@lukebechtel/lab-ts-utils";
import {createLessonFlatMutDoc} from "@reasonote/lib-sdk-apollo-client";

import {
  LessonCreateModal,
} from "../lesson_session/LessonSessionFinish/LessonCreateModal";

export interface SkillLessonCreateModalDefaultProps {
    fullSkillIdPath: string[];
    showing: boolean;
    setShowing: (showing: boolean) => void;
}

export function SkillLessonCreateModalDefault({
    fullSkillIdPath,
    showing,
    setShowing
}: SkillLessonCreateModalDefaultProps) {
    const ac = useApolloClient();
    const router = useRouter();

    const skillId = fullSkillIdPath[fullSkillIdPath.length - 1];

    return fullSkillIdPath && showing && skillId ? <LessonCreateModal
            skillId={skillId}
            onSubmit={async ({name, summary}) => {
                const fullSkillPath = _.uniq(fullSkillIdPath).filter(notEmpty);

                if (!fullSkillPath || fullSkillPath.length === 0) {
                    console.error(`Failed to create lesson! No skill path!`)
                    return;
                }

                // Create the lesson
                const lessonCreateRes = await ac.mutate({
                    mutation: createLessonFlatMutDoc,
                    variables: {
                        objects: [
                            {
                                name,
                                summary,
                                // Same root skill.
                                rootSkill: fullSkillPath[0],
                                // The path is the original rootSkillPath, plus the new skill.
                                rootSkillPath: fullSkillPath,
                            }
                        ]
                    }
                })
                
                // Get its id...
                const newLessonId = lessonCreateRes.data?.insertIntoLessonCollection?.records[0]?.id;
                if (!newLessonId) {
                    console.error(`Failed to create lesson!`)
                    return;
                }

                // Now we go to the new session page.
                router.push(`/app/lessons/${newLessonId}/new_session`)
                setShowing(false);
            }}
            isShowing={true} 
            onClose={()=>{
                setShowing(false);
            }}
        />
        : null;
}