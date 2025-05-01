import _ from 'lodash';

import {
  ChapterFilter,
  GetChaptersDeepQuery,
  InputMaybe,
} from '@reasonote/lib-sdk-apollo-client';

// import {
//   getChapterDeep,
// } from '@reasonote/lib-sdk-apollo-client';
import { AIPromptObj } from './AIPromptObj';

export class ChapterAIPromptObj extends AIPromptObj {
    async formatChapters({filter}: {filter: InputMaybe<ChapterFilter>}) {
        // const {data: chapterData} = await this.ai.ac.query({
        //     query: getChapterDeep,
        //     variables: {
        //         filter
        //     }
        // });

        // const chapters = chapterData?.chapterCollection?.edges?.map((edge) => edge.node).filter(notEmpty) ?? [];

        // if (chapters.length === 0){
        //     return null;
        // }
        // else {
        //     return await Promise.all(chapters.map(async (chapter) => await this.formatObj(chapter)).filter(notEmpty));
        // }

        return null;
    }

    async formatMany({chapterIds}: {chapterIds: string[]}) {
        // const {data: chapterData} = await this.ai.ac.query({
        //     query: getChapterDeep,
        //     variables: {
        //         filter: {
        //             id: {in: chapterIds}
        //         }
        //     }
        // });

        // return await Promise.all(chapterData?.chapterCollection?.edges?.map(async (edge) => await this.formatObj(edge.node)).filter(notEmpty) ?? []);
    }

    async format({chapterId, context}: {chapterId: string, context?: string}) {
        // const {data: chapterData} = await this.ai.ac.query({
        //     query: getChapterDeep,
        //     variables: {
        //         filter: {
        //             id: {eq: chapterId}
        //         }
        //     }
        // });

        // return await this.formatObj(chapterData?.chapterCollection?.edges?.[0].node);
    }

    async formatObj(chapter: NonNullable<GetChaptersDeepQuery['chapterCollection']>['edges'][0]['node'] | null | undefined){
        // if (!chapter){
        //     return null;
        // }

        // const {data: skillPathContext} = await this.ai.prompt.skills.getSkillPathAiContext({ids: chapter.rootSkillPath?.filter(notEmpty) ?? []});

        // const lessonItems = chapter.lessonCollection?.edges?.map((edge) => edge.node).filter(notEmpty) ?? [];
        // const lessonsFormatted = (await Promise.all(lessonItems.map(async (lesson) => await this.ai.prompt.lessons.formatObj(lesson)))).filter(notEmpty);

        // return `
        // <Chapter name="${chapter.name}" summary="${chapter.summary ?? ''}" ${skillPathContext && skillPathContext.trim().length > 0 ? `for_skill="${skillPathContext}"` : ''}>
        //     ${
        //         chapter.lessonCollection?.edges && chapter.lessonCollection?.edges.length > 0 ?
        //         `
        //         <Lessons>
        //         ${lessonsFormatted.join('\n')}
        //         </Lessons>
        //         `
        //         :
        //         ''
        //     }
        // </Chapter>
        // `
    }
}