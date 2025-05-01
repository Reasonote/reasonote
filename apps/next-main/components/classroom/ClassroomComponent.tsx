"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import _ from "lodash";
import {useSearchParams} from "next/navigation";
import posthog from "posthog-js";
import {z} from "zod";

import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {
  FillSubskillTreeRoute,
  FillSubskillTreeRouteResponse,
} from "@/app/api/skills/fill_subskill_tree/routeSchema";
import {useIsOverLicenseLimit} from "@/clientOnly/hooks/useIsOverLicenseLimit";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {useSkillTree} from "@/clientOnly/hooks/useSkillTree";
import {useUserSkillData} from "@/clientOnly/hooks/useUserSkillData";
import {useApolloClient} from "@apollo/client";
import {
  notEmpty,
  trimAllLines,
} from "@lukebechtel/lab-ts-utils";
import {ActivityResult} from "@reasonote/activity-definitions";
import {
  SuggestLessonsTool,
  UpdateUserSkillTool,
} from "@reasonote/lib-ai";
import {
  CoreMessageWithId,
  DeepPartial,
  getToolCallPartsFromMessages,
} from "@reasonote/lib-ai-common";
import {
  createLessonFlatMutDoc,
  getLessonFlatQueryDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";
import {uuidv4} from "@reasonote/lib-utils";
import {
  useAsyncEffect,
  useStateWithRef,
} from "@reasonote/lib-utils-frontend";

import {useSupabase} from "../supabase/SupabaseProvider";
import {streamGenObjectWithRetry} from "./ClassroomAI";
import {ClassroomBots} from "./ClassroomBots";
import {ToolCallStateMap} from "./ClassroomChatMessages";
import {ClassroomComponentDumb} from "./ClassroomComponentDumb";
import {LessonStub} from "./schema";

const randomSubjects = [
  "Organic Chemistry",
  "The Human Brain",
  "Machine Learning",
  "Poetry"
];


function patchMessages(oldMessages: DeepPartial<CoreMessageWithId>[], partialNewMessages: DeepPartial<CoreMessageWithId>[]): DeepPartial<CoreMessageWithId>[] {
  const partialNewMessagesWithIds = partialNewMessages
    .filter(notEmpty)
    .filter((msg) => !!msg.id);
  
  return [
    ...oldMessages.map((msg) => {
      const matchingNewMessage = partialNewMessagesWithIds.find((newMsg) => newMsg?.id === msg.id);
        if (matchingNewMessage) {
          return {
          ...matchingNewMessage,
        } as CoreMessageWithId;
      }
      return msg;
    }),
    ...partialNewMessagesWithIds.filter((msg) => !oldMessages.some((oldMsg) => oldMsg?.id === msg?.id)).filter(notEmpty) as CoreMessageWithId[]
  ];
}

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// THE PAGE
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export default function ClassroomComponent({phrase, skillId: propSkillId, courseId, documents,}: {phrase?: string, skillId?: string, courseId?: string, documents?: {title?: string, content?: string, file?: File}[]}) {
  const [phraseState, setPhraseState] = useState<string>(phrase || '');
  const [toolCallState, setToolCallState] = useState<ToolCallStateMap>({});
  const {sb} = useSupabase();
  
  // New state to hold the derived skillId
  const [derivedSkillId, setDerivedSkillId] = useState<string | undefined>(propSkillId);

  // Effect to fetch course root skill when courseId changes
  useAsyncEffect(async () => {
    if (courseId) {
      try {
        const {data: courseData} = await sb.from('course')
          .select('root_skill')
          .eq('id', courseId)
          .single()
          .throwOnError();
          
        if (courseData) {
          setDerivedSkillId(courseData.root_skill ?? propSkillId);
        }
      } catch (error) {
        console.error("Error fetching course root skill:", error);
      }
    }
  }, [courseId, propSkillId]);

  // Replace all instances of skillId with derivedSkillId
  const {data: isOverLimit, loading: isOverLimitLoading, refetch: refetchIsOverLimit} = useIsOverLicenseLimit('lessons_generated');

  // Search params
  const searchParams = useSearchParams();
  const devMode = searchParams?.get('dev') === 'true';

  useEffect(() => {
    posthog.capture('classroom_view', {
      skill_id: derivedSkillId,
      course_id: courseId,
    }, {send_instantly: true});
  }, [derivedSkillId, courseId]);



  /**
   * gathering-context: The bot is gathering context to build the lesson.
   * lesson-active: The bot is actively trying to teach the user a lesson.
   * showing-results: The bot is showing the user the results of the lesson.
   */
  const [status, setStatus, statusRef] = useStateWithRef<"info" | "pick-lesson">("info");
  const [bot, setBot] = useState(ClassroomBots[Math.floor(Math.random() * ClassroomBots.length)]);

  const [chatIdGenerating, setChatIdGenerating, chatIdGeneratingRef] = useStateWithRef<string | null>(null);

  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);

  const [userMessage, setUserMessage] = useState("");
  const [isGenerating, setIsGenerating, isGeneratingRef] = useStateWithRef(false);

  const [messages, setMessages] = useState<(DeepPartial<CoreMessageWithId>)[]>([]);

  const createdLessonsRef = useRef<any[]>([]);
  const [lessonIds, setLessonIds] = useState<(string)[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const ac = useApolloClient();
  const rsnUserId = useRsnUserId();

  

  const [skillIdState, setSkillIdState] = useState<string | null>(null);

  // Update this line to use derivedSkillId
  const usingSkillId = derivedSkillId || skillIdState;
  const skill = useSkillFlatFragLoader(usingSkillId);

  const [skillTreeResult, setSkillTreeResult] = useState<FillSubskillTreeRouteResponse | null>(null);
  const {refetch: refetchSkillTree} = useSkillTree({id: derivedSkillId ?? ''});
  const [currentTab, setCurrentTab] = useState<'lesson' | 'skill-tree'>('skill-tree');

  const { data: userSkill, updateUserSkill, loading: isUserSkillLoading, refetch: refetchUserSkill } = useUserSkillData(derivedSkillId);

  const [showLessonPanel, setShowLessonPanel] = useState(false);

  /** The last set of lessons that were delivered to the user */
  const [chatGenerationInfo, setChatGenerationInfo] = useState<{id: string, startTime: number, lessonIdsOutput: string[]}[]>([]);

  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [generatedLessonCount, setGeneratedLessonCount] = useState(0);

  const [seenLessonCount, setSeenLessonCount] = useState(0);

  const { data: subscriptionData } = useReasonoteLicense();

  /**
   * If we don't have a skill tree result, we need to fetch it.
   */
  useAsyncEffect(async () => {
    if (!skillTreeResult){
      var theSkillId: string | null = usingSkillId;
      if (!theSkillId && phraseState?.trim?.().length > 0){
        console.log("Adding skill", phraseState, 'skill id was not found.');
        // First, get the skill id
        theSkillId = (await AddtoUserSkillSetRoute.call({
          addSkills: [{name: phraseState}],
        })).data?.skillIds?.[0] ?? null;
        
        if (!theSkillId){
          return;
        }

        setSkillIdState(theSkillId);
      }
      
      if (!theSkillId){
        return;
      }

      // Then, add the skill to the skill tree
      const res = await FillSubskillTreeRoute.call({
        skill: {
          id: theSkillId
        },
      });

      if (!res.data){
        console.error("No data returned from FillSubskillTreeRoute");
        return;
      }

      setSkillTreeResult(res.data);
      refetchSkillTree();
    }
  }, [phraseState, usingSkillId]);

  useEffect(() => {
    if (notEmpty(skill.data) && (!phraseState || phraseState.trim().length < 1)){
      setPhraseState(skill.data.name);
    }
  }, [skill.data, phraseState]);

  const onLessonFullyYielded = useCallback(async (lessonYield: {type: 'create', lesson: LessonStub} | {type: 'existing', lessonId: string}, chatId: string) => {
    var newLessonId: string | null = null;

    if (lessonYield.type === 'existing'){
      if (lessonYield.lessonId.length > 0){
        // Check if this lesson exists in our list of completed lessons
        const existingLesson = createdLessonsRef.current.find((oldLesson) => oldLesson === lessonYield.lessonId);
        if (existingLesson){
          newLessonId = existingLesson.id;
        }
      }
    }
    else {
      const lessonStub = lessonYield.lesson;

      // 0. Check our list of createdLessons, stored in a ref.
      //    Do we have a lesson that matches this?
      //    If so, we can skip this step.
      if (createdLessonsRef.current.some((oldLesson) => JSON.stringify(oldLesson) === JSON.stringify(lessonStub))){
        return;
      }

      // Add this lesson to the list of completed lessons
      createdLessonsRef.current.push(lessonStub);
  
      // Create lesson in backend
      const result = await ac.mutate({
        mutation: createLessonFlatMutDoc,
        variables: {
            objects: [{
                name: lessonStub.name,
                icon: lessonStub.emoji,
                summary: lessonStub.description,
                rootSkill: derivedSkillId,
                forUser: rsnUserId,
                lessonType: 'concepts-practice-review' as const,
            }]
        },
        refetchQueries: [
          {
            query: getLessonFlatQueryDoc,
            variables: { filter: { rootSkill: { eq: derivedSkillId } } }
          }
        ]
      });

      const newId = result.data?.insertIntoLessonCollection?.records?.[0].id;
      if (!newId){
        console.error("No lesson id returned from createLessonFlatMutDoc");
        return;
      }
  
      newLessonId = newId;

      
    }

    if (!newLessonId){
      console.error("No lesson id found");
      return;
    }

    // Add lesson to chat generation info
    setChatGenerationInfo((old) => {
      const chatGenerationInfo = old.find((info) => info.id === chatId);
      if (chatGenerationInfo && newLessonId) {
        chatGenerationInfo.lessonIdsOutput.push(newLessonId);
      }
      return old;
    });
  }, [derivedSkillId, ac, rsnUserId]);

  const pushUserMessage = useCallback((message: string) => {
    setMessages((old) => [...old, {
      id: uuidv4(),
      role: "user",
      content: message
    }]);
  }, [setMessages]);

  const contextChatCall = useCallback(async (userMessage?: string) => {
    if (isUserSkillLoading){
      console.warn("userSkill not loaded, not running contextChatCall");
      return;
    }

    if (!phraseState || phraseState.trim().length < 2){
      console.warn(`phrase is too short: "${phraseState}", not running contextChatCall`);
      return;
    }

    if (isGeneratingRef.current){
      console.warn("Already generating, not running contextChatCall");
      return;
    }

    console.log("Chatbot Seeing userSkill:", userSkill);

    const chatIdGenerating = uuidv4();
    setChatIdGenerating(chatIdGenerating);
    setChatGenerationInfo((old) => [
      ...old,
      {
        id: chatIdGenerating,
        startTime: Date.now(),
        lessonIdsOutput: []
      }
    ]);
    
    try {
      setIsGenerating(true);
      setHasSentFirstMessage(true);

      const startTime = Date.now();

      const newMessages = [...messages];
      if (userMessage) {
        newMessages.push({
          id: uuidv4(),
          role: "user",
          content: userMessage
        });
      }
      // If there isn't a user message at the end of our messages, we return
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role !== "user") {
        console.warn('Last message was not user message, returning');
        return;
      }

      setMessages(newMessages);

      const res = await streamGenObjectWithRetry({
        sb,
        userId: rsnUserId ?? '',
        skillId: usingSkillId ?? '',
        courseId: courseId ?? null,
        // TODO: this isn't quite accurate.
        messages: newMessages as CoreMessageWithId[],
        phraseState,
        userSkill: userSkill as any,
        bot,
        // status: statusRef.current ?? "info",
        documents: documents ?? [],
        onPartialObject: (partialMessageLog) => {
          setMessages((old) => patchMessages(old, partialMessageLog.filter(notEmpty)));

          // TODO: probably need to worry about
          const allToolCalls = partialMessageLog ? getToolCallPartsFromMessages(partialMessageLog.filter(notEmpty) as CoreMessageWithId[]) : [];

          if (allToolCalls.some((toolCall) => toolCall.toolName.toLowerCase() === 'suggestlessons')) {
              setIsGeneratingLessons(true);
              setGeneratedLessonCount(0);
          }

          const lessons = (allToolCalls.find((toolCall) => toolCall.toolName.toLowerCase() === 'suggestlessons')?.args as z.infer<SuggestLessonsTool['args']>);
          if (Array.isArray(lessons) && lessons.length > 0) {
            setIsGeneratingLessons(false);
            setGeneratedLessonCount(lessons.length);
          }
  
          if (lessons) {
            if (Array.isArray(lessons) && lessons.length > 0) {
              // Don't include the last one, because it is still being written.
              // We handle it after the stream is finished.
              lessons.slice(0, -1)
                .filter(notEmpty)
                .forEach((lesson) => {
                  onLessonFullyYielded(lesson as any, chatIdGenerating);
                });
            }
          }
        }
      });

      if (!res) {
        console.error("No response from streamGenObject");
        return;
      }

      setMessages((old) => patchMessages(old, res.object.filter(notEmpty)));

      const allToolCalls = res.object ? getToolCallPartsFromMessages(res.object.filter(notEmpty) as CoreMessageWithId[]) : [];
      const updateUserSkillToolCall = allToolCalls.find((toolCall) => toolCall.toolName.toLowerCase() === 'updateuserskill');

      console.log("allToolCalls", allToolCalls);
      console.log("updateUserSkillToolCall", updateUserSkillToolCall);
      if (updateUserSkillToolCall) {
        const updatesToUserSkill = updateUserSkillToolCall.args as z.infer<UpdateUserSkillTool['args']>;
        if (updatesToUserSkill) {
          // Call the API to update the user_skill in the database.
          // Only do this if they've added:
          // - interest_reasons
          // - self_assigned_level
          // - specifics

          // Track interest reasons update
          if (updatesToUserSkill.interest_reasons) {
            posthog.capture('classroom_interest_reasons_updated', {
              skillId: usingSkillId
            }, {
              send_instantly: true,
            });
          }

          // Track skill level update
          if (updatesToUserSkill.self_assigned_level) {
            posthog.capture('classroom_skill_level_updated', {
              skillId: usingSkillId
            }, {
              send_instantly: true,
            });
          }

          // Track specifics update
          if (updatesToUserSkill.specifics) {
            posthog.capture('classroom_specifics_updated', {
              skillId: usingSkillId
            }, {
              send_instantly: true,
            });
          }

          console.log("updatesToUserSkill", updatesToUserSkill);

          // Call the API to update the user_skill in the database
          if (updatesToUserSkill.interest_reasons || 
              updatesToUserSkill.self_assigned_level || 
              updatesToUserSkill.specifics) {
            updateUserSkill(derivedSkillId, updatesToUserSkill);
            refetchUserSkill();
          }
        }
      }

      const suggestLessonsToolCall = allToolCalls.find((toolCall) => toolCall.toolName.toLowerCase() === 'suggestlessons');
      if (suggestLessonsToolCall) {
        const lessons = (suggestLessonsToolCall.args as z.infer<SuggestLessonsTool['args']>);
        if (Array.isArray(lessons) && lessons.length > 0) {
          setGeneratedLessonCount(lessons.length);
          setIsGeneratingLessons(false);

          // Just the last lesson
          const lastLesson = lessons.slice(-1)[0];
          if (lastLesson) {
            // Last lesson should now be fully defined.
            await onLessonFullyYielded(lastLesson as any, chatIdGenerating);
          }
        }
      }
    }
    catch (e) {
      console.error("Error in contextChatCall", e);
    }
    finally {
      // TODO: still necessary?
      // set messages one more time to fix any tool calls that failed
      // setMessages((old) => rewriteMessagesWithFakeToolCalls(old));
      setIsGenerating(false);
      setIsGeneratingLessons(false);
    }
  }, [messages, userSkill, bot, phraseState, derivedSkillId, updateUserSkill, isUserSkillLoading, onLessonFullyYielded]);

  const onPickLesson = useCallback(async (lessonId: string | null) => {
    if (lessonId) {
      setSelectedLessonId(lessonId);
      // 
      pushUserMessage(trimAllLines(`
        <ActionUserPickedLesson lessonId="${lessonId}" />
      `))
    }
    else {
      setSelectedLessonId(null);
      contextChatCall(trimAllLines(`
        <ActionUserLeftLesson />
      `))
    }
  }, [pushUserMessage, selectedLessonId]);

  useEffect(() => {
    // Whenever we select a new lesson, 
    refetchIsOverLimit();
  }, [selectedLessonId])

  const onCreateLesson = useCallback(async (skillId: string) => {
    // Get the skill name
    const res = await ac.query({
      query: getSkillFlatQueryDoc,
      variables: { filter: { id: { eq: skillId } } }
    });

    const skillName = res.data?.skillCollection?.edges?.[0]?.node?.name;

    contextChatCall(trimAllLines(`
      <ActionUserRequestedNewLesson skillId="${skillId}" topicName="${skillName}" />
    `))
  }, [contextChatCall]);

  const onActivityComplete = useCallback((res: ActivityResult) => {
    // Add message to the end of the conversation to indicate the activity is complete.
    setMessages((old) => [...old, {
      id: uuidv4(),
      role: "user",
      content: `<ActionActivityCompleted activityResult="${JSON.stringify(res)}" />`
    }]);
  }, [contextChatCall]);

  const onLessonComplete = useCallback(() => {
    contextChatCall(trimAllLines(`
      <ActionUserCompletedLesson lessonId="${selectedLessonId}" />
    `))
  }, [contextChatCall, selectedLessonId]);

  useEffect(() => {
    if (!hasSentFirstMessage){
      contextChatCall()
    }
  }, [hasSentFirstMessage, phraseState, isUserSkillLoading])

  // Track when status changes
  useEffect(() => {
    if (status === 'info') {
      posthog.capture('classroom_info_phase_started', {
        skillId: usingSkillId
      }, {
        send_instantly: true,
      });
    } else if (status === 'pick-lesson') {
      posthog.capture('classroom_lesson_selection_phase_started', {
        skillId: usingSkillId
      }, {
        send_instantly: true,
      });
    } else if (status === 'teaching') {
      posthog.capture('classroom_teaching_phase_started', {
        skillId: usingSkillId
      }, {
        send_instantly: true,
      });
    }
  }, [status, usingSkillId]);

  // Track when users leave/abandon the classroom
  useEffect(() => {
    const sessionStartTime = Date.now();
    
    const handleBeforeUnload = () => {
      posthog.capture('classroom_session_ended', {
        sessionDuration: Date.now() - sessionStartTime
      }, {
        send_instantly: true,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  const handleViewLessons = useCallback(() => {
    setSeenLessonCount(generatedLessonCount);
    setCurrentTab('lesson');
  }, [generatedLessonCount]);

  const handleTabChange = useCallback((tab: 'lesson' | 'skill-tree') => {
    if (tab === 'lesson') {
      setSeenLessonCount(generatedLessonCount);
    }
    setCurrentTab(tab);
  }, [generatedLessonCount]);

  const sharedProps = {
    messages,
    isGenerating,
    contextChatCall,
    bot,
    userMessage,
    setUserMessage,
    toolCallState,
    setToolCallState,
    showLessonPanel,
    setShowLessonPanel,
    currentTab,
    setCurrentTab: handleTabChange,
    selectedLessonId,
    onPickLesson,
    onActivityComplete,
    onLessonComplete,
    usingSkillId,
    courseId: courseId ?? null,
    skillTreeResult,
    // The chat generation info that is most recent
    lastLessonIdGroup: chatGenerationInfo
      .sort((a, b) => b.startTime - a.startTime)
      .at(0)?.lessonIdsOutput ?? null,
    isGeneratingLessons,
    lessonCount: generatedLessonCount - seenLessonCount,
    onViewLessons: handleViewLessons,
    onCreateLesson,
  };

  return (
    <ClassroomComponentDumb
      {...sharedProps}
      isOverLimit={!!isOverLimit}
      licenseType={subscriptionData?.currentPlan?.type}
    />
  );
}