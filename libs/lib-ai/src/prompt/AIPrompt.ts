import { AI } from '../AI';
import { ActivityAIPromptObj } from './AIPromptObj/Activity.priompt';
import { ChapterAIPromptObj } from './AIPromptObj/Chapter';
import { LessonAIPromptObj } from './AIPromptObj/Lesson';
import { AIPromptObjResources } from './AIPromptObj/Resources.priompt';
import { AIPromptObjSkills } from './AIPromptObj/Skills';
import {
  UserActivityResultAIPromptObj,
} from './AIPromptObj/UserActivityResult';

export interface AIPromptFormatterConfig {}

export class AIPrompt {
  skills: AIPromptObjSkills;
  lessons: LessonAIPromptObj;
  userActivityResults: UserActivityResultAIPromptObj;
  activities: ActivityAIPromptObj;
  chapters: ChapterAIPromptObj;
  resources: AIPromptObjResources;

  constructor(readonly ai: AI){
    this.skills = new AIPromptObjSkills(this.ai);
    this.lessons = new LessonAIPromptObj(this.ai);
    this.userActivityResults = new UserActivityResultAIPromptObj(this.ai);
    this.activities = new ActivityAIPromptObj(this.ai);
    this.chapters = new ChapterAIPromptObj(this.ai);
    this.resources = new AIPromptObjResources(this.ai);
  }
}