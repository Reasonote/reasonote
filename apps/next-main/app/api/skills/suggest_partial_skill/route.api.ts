import {
  SkillDetails,
  SupabaseDocDB,
} from "@reasonote/lib-ai";
import {SupabaseClient} from "@supabase/supabase-js";

import {makeServerApiHandlerV3} from "../../helpers/serverApiHandlerV3";
import {SuggestPartialSkillRoute} from "./routeSchema";

// Incrase wait time next.js
export const maxDuration = 90;


// Get embedding type from environment or use default
const EMBEDDING_TYPE = process.env.EMBEDDING_TYPE || 'openai/text-embedding-3-small';

/**
 * Stores skill data in the database
 * @param supabase Supabase client
 * @param skillDetails Skill details to store
 * @param userId User ID
 * @param documentIds Document IDs associated with the skill
 * @param userInput Original user input
 * @returns Object containing the created skill and partial skill IDs
 */
async function storeSkillData(
  supabase: SupabaseClient,
  skillDetails: SkillDetails,
  userId: string,
  documentIds: string[],
  userInput?: string
): Promise<{ skillId: string; partialSkillId: string }> {
  // Create the skill
  const { data: skill, error: skillError } = await supabase
    .from('skill')
    .insert({
      _name: skillDetails.skillName,
      _description: skillDetails.description,
      emoji: skillDetails.emoji,
    })
    .select()
    .single();

  if (skillError || !skill) {
    throw new Error(`Error creating skill: ${skillError?.message || 'Unknown error'}`);
  }

  // Store the user_skill relationship
  const { error: userSkillError } = await supabase
    .from('user_skill')
    .upsert({
      rsn_user: userId,
      skill: skill.id,
      self_assigned_level: skillDetails.level,
      interest_reasons: skillDetails.goals,
    }, {
      onConflict: 'rsn_user, skill',
    });

  if (userSkillError) {
    throw new Error(`Error creating user_skill: ${userSkillError.message}`);
  }

  // Store the partial skill with original user input
  const { data: partialSkillInfo, error: partialSkillError } = await supabase
    .from('partial_skill')
    .insert({
      user_input: userInput || '',
      skill_name: skillDetails.skillName,
      skill_description: skillDetails.description,
      user_level: skillDetails.level,
      goals: skillDetails.goals,
      created_by: userId,
      pages: documentIds,
      emoji: skillDetails.emoji,
      skill_id: skill.id,
    })
    .select()
    .single();

  if (partialSkillError || !partialSkillInfo) {
    throw new Error(`Error storing partial skill: ${partialSkillError?.message || 'Unknown error'}`);
  }

  return {
    skillId: skill.id,
    partialSkillId: partialSkillInfo.id,
  };
}

export const { POST } = makeServerApiHandlerV3({
  route: SuggestPartialSkillRoute,
  handler: async (ctx) => {
    const { ai, parsedReq, supabase, logger, user } = ctx;
    const { userInput, documents } = parsedReq;

    if (!user?.rsnUserId) {
      throw new Error("User not authenticated");
    }

    try {
      // Create a SupabaseDocDB instance
      const docDB = new SupabaseDocDB({
        ai,
        supabase,
        chunkSize: 500,
        overlapSize: 100,
        maxVectorWaitAttempts: 10,
        vectorWaitDelayMs: 1000
      });

      // Extract document IDs for filtering
      const documentIds: string[] = documents?.map(doc => {
        const pageId = doc.resourceId || '';
        
        // Ensure page IDs have the correct prefix if they don't already
        if (pageId && !pageId.startsWith('rsnpage_') && !pageId.startsWith('snip_')) {
          // Default to rsnpage_ prefix if the type is not specified or is unclear
          return `rsnpage_${pageId}`;
        }
        
        return pageId;
      }) || [];
      
      const validDocumentIds = documentIds.filter(id => id); // Filter out empty strings

      // Wait for vector ingestion if documents are provided
      if (documents && documents.length > 0) {
        const startTime = Date.now();
        logger.info(`Waiting for vector ingestion for ${validDocumentIds.length} documents using ${EMBEDDING_TYPE}...`);

        const vectorsReady = await docDB.waitForVectors(validDocumentIds);

        const elapsedTime = Date.now() - startTime;
        if (!vectorsReady) {
          logger.warn(`Vector ingestion timed out after ${elapsedTime}ms, proceeding with available vectors`);
        } else {
          logger.info(`Vector ingestion completed successfully in ${elapsedTime}ms`);
        }
      }

      // Create a filter that only includes the provided document IDs
      const docDBFilter = validDocumentIds.length > 0
        ? { documentIds: validDocumentIds }
        : {};

      // console.log('documents', documents);

      // console.log('parsedReq', parsedReq);

      // throw new Error('test');

      // If there is no userInput, and the documents are all empty, throw an error
      if (!userInput && (!documents || documents.length === 0 || documents.every(doc => !doc.resourceId))) {
        throw new Error("No user input provided and no documents provided");
      }
      
      // Enhance user input if both userInput and documents are provided
      const enhancedUserInput = userInput && documents && documents.length > 0
        ? `Based on these documents, I want to learn about: ${userInput}`
        : userInput;

      // Generate skill details with hierarchical analysis
      const result = await ai.suggestSkill({
        userInput: enhancedUserInput,
        docDB,
        docDBFilter,
        maxDocTokens: 10000
      });

      // Store the generated skill in the database
      const storedData = await storeSkillData(
        supabase,
        result.skillDetails,
        user.rsnUserId,
        validDocumentIds,
        userInput
      );

      return storedData;
    } catch (error) {
      logger.error('Error processing skill suggestion:', error);
      throw error;
    }
  }
}); 