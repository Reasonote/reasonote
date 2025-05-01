import _ from 'lodash';
import {
  z,
  ZodObject,
  ZodTypeAny,
} from 'zod';

//@ts-ignore
import * as Priompt from '@anysphere/priompt';
import { notEmpty } from '@lukebechtel/lab-ts-utils';
import {
  ActivityConfig,
  ActivityGenerateRequest,
  ActivityType,
  ActivityTypesPublic,
  CitationSchema,
} from '@reasonote/core';
import {
  AI_EXPLAINERS,
  aiExplainerFormat,
} from '@reasonote/core-static-prompts';
import {
  AI,
  UnifiedResource,
} from '@reasonote/lib-ai';
import {
  JSONSafeParse,
  partialObjectStreamToArrayGenerator,
  resolveObjectPromises,
} from '@reasonote/lib-utils';

import {
  getGenerateActivityMessages,
} from './ActivityGeneratorV2Prompt.priompt';
import {
  ActivityGeneratorV2ActivityGenerateRequest,
  ActivityGeneratorV2HydratedRequest,
  ActivityRequestHydratedValues,
  NewActivityTypeServer,
  ValidActivityTypeServerHydrated,
} from './types';

// Generation steps:
// 0. Generate Several activities in a stream
    // As activities are yielded by the stream, do the following for each activity:
    // 1. PostGenerate Processing
    // 2. Evaluate (if evaluateConfig is provided)
    // 3. If not valid, Generate again, go back to 1
    // 4. If valid, return




/**
 * Processes an ActivityGenerateRequest and sets defaults.
 */
function processRequest(req: ActivityGenerateRequest): ActivityGenerateRequest {
    return {
        ...req,
        evaluators: {
            // Disable evaluators by default
            enabled: false,
            ...req.evaluators
        },
        postprocessing: {
            // Enable postprocessing by default
            enabled: true,
            ...req.postprocessing
        }
    }
}

export class ActivityGeneratorV2 {
    private readonly activityTypeServers: NewActivityTypeServer[];
    private readonly ai: AI;
    private readonly getHydratedValuesOverride?: (generator: ActivityGeneratorV2, req: ActivityGenerateRequest) => Promise<ActivityRequestHydratedValues>;

    /**
     * Creates a new instance of ActivityGeneratorV2.
     * 
     * @param args - Configuration object for the generator
     * @param args.activityTypeServers - Array of activity type servers that will be used to generate activities
     * @param args.ai - The AI instance to use for generation
     * @param args.getHydratedValuesOverride - Optional function to override the default hydration process.
     *        This allows tests and special cases to provide custom mock resources and context values.
     */
    constructor({
        activityTypeServers,
        ai,
        getHydratedValuesOverride
    }: {
        activityTypeServers: NewActivityTypeServer[],
        ai: AI,
        getHydratedValuesOverride?: (generator: ActivityGeneratorV2, req: ActivityGenerateRequest) => Promise<ActivityRequestHydratedValues>;
    }) {
        this.activityTypeServers = activityTypeServers;
        this.ai = ai;
        this.getHydratedValuesOverride = getHydratedValuesOverride;
    }

    /**
     * Filters and prepares activity type servers based on the requested activity types.
     * This method:
     * 1. Filters the available servers to only include those matching requested types
     * 2. Fetches the generation configuration for each server
     * 3. Enhances each server with its generation config for later use
     * 
     * @param args - Array of activity types to filter servers by (e.g., 'multiple-choice', 'flashcard')
     * @returns A promise resolving to an array of validated and configured activity type servers
     */
    async _getValidActivityTypeServers(args: {activityTypes: ActivityType[], typeConfigs: any}): Promise<ValidActivityTypeServerHydrated[]> {
        return await Promise.all(this.activityTypeServers.filter(server => args.activityTypes.includes(server.type as ActivityType))
            .map(async (server) => {
                //@ts-ignore
                server.genConfig = await server.getGenConfig?.(args, this.ai);
                
                return server as ValidActivityTypeServerHydrated;
            }));
    }

    /**
     * Processes an ActivityGenerateRequest and sets defaults.
     */
    async processRequest(req: ActivityGeneratorV2ActivityGenerateRequest): Promise<ActivityGeneratorV2HydratedRequest> {     
        console.log('processRequest', req);
        return await this.hydrateRequest({
            ...processRequest(req),
        });
    }


    /**
     * Fetches and prepares all contextual data needed for activity generation.
     * This includes resources, activity type schemas, output format definitions, and more.
     * 
     * @param ai - The AI instance to use for fetching data
     * @param req - The activity generation request containing parameters and constraints
     * @returns A promise that resolves to an object containing all hydrated values needed for generation:
     *   - validActivityTypeServers: Filtered servers that match the requested activity types
     *   - outputSchema: Zod schema for validating generated activities
     *   - resources: Array of unified resources relevant to the skill/subject
     *   - subjectDefinitionString: Textual description of the subject matter
     *   - fromActivityPrompts: Formatted prompts from existing activities (if specified)
     *   - ctxInjectorsFormatted: Formatted context injectors from the request
     *   - userExplainerString: Formatted user profile information (if available)
     *   - activityConfigsFormatted: Formatted activity configs for reference
     */
    async getHydratedValues(ai: AI, req: ActivityGeneratorV2ActivityGenerateRequest): Promise<ActivityRequestHydratedValues> {
        const parentSkillIds = req.from?.skill?.parentSkillIds;

        // Get list of all skill ids
        const allSkillIds = [...(parentSkillIds ?? []), req.from?.skill?.id].filter(notEmpty);

        // Get textified version of skill name
        const subjectDefinitionString = (await ai.prompt.skills.getSkillPathExplainer({
            skillId: req.from?.skill?.id ?? '',
            parentSkillIds: parentSkillIds
        })).data;

        if (!subjectDefinitionString) {
            throw new Error('Subject definition string is undefined');
        }

        const { user, userSkill, lesson, from, additionalInstructions, ctxInjectors } = req;
        const { skill, activityIds, activityConfigs } = from;

        const {
            validActivityTypeServers,
            outputSchema,
            resources,
            referencesAndChunks,
            ctxInjectorsFormatted,
            userExplainerString,
            fromActivityPrompts,
            activityConfigsFormatted
        } = await resolveObjectPromises({
            validActivityTypeServers: this._getValidActivityTypeServers({
                activityTypes: req.validActivityTypes ?? [...ActivityTypesPublic],
                typeConfigs: req.typeConfigs
            }),
            outputSchema: this.createOutputSchema(req),
            resources: ai.prompt.resources.getAllResources({
                filter: {skillIds: allSkillIds},
                queryTexts: [subjectDefinitionString].filter(notEmpty)
            }),
            referencesAndChunks: ai.prompt.resources.getAllReferencesAndChunks({
                skillIds: allSkillIds,
            }),
            ctxInjectorsFormatted: ai.getCtxStringsFromInvokeConfigs(ctxInjectors ?? []),
            userExplainerString: user ? aiExplainerFormat(AI_EXPLAINERS.USER_PROFILE(user)) : null,
            fromActivityPrompts: activityIds ? new Promise<string[]>(async (resolve) => {
                    const activities = await ai.sb.from('activity').select('*').in('id', activityIds).then((res) => res.data ?? []);
                    const prompts = await Promise.all(activities.map(async (activity) => {
                        const activityConfig = JSONSafeParse(activity?.type_config)?.data;
                        return ai.prompt.activities.formatConfigResult(activityConfig);
                    }));
                    resolve(prompts);
                })
                :
                Promise.resolve<string[]>([]),
            activityConfigsFormatted: await ai.prompt.activities.getActivityConfigsFormatted(req)
        });

        /**
         * Documents that were provided in-request should be merged with the resources fetched from the database.
         */
        const prefetchedResources: UnifiedResource[] = req.from?.documents?.map((doc) => {
            return {
                id: doc.id ?? '',
                type: 'page',
                name: doc.title ?? '',
                source: doc.sourceUrl ?? '',
                content: doc.text
            }
        }) ?? [];

        console.log('referencesAndChunks', referencesAndChunks);

        return {
            validActivityTypeServers,
            outputSchema,
            activityConfigsFormatted,
            resources: [...prefetchedResources, ...resources],
            referencesAndChunks,
            subjectDefinitionString,
            fromActivityPrompts,
            ctxInjectorsFormatted,
            userExplainerString
        }
    }

    /**
     * Hydrates a request by fetching relevant data from various sources.
     * 
     * @param req - The request to hydrate.
     * @returns A promise that resolves to the hydrated request.
     */
    hydrateRequest = async (req: ActivityGeneratorV2ActivityGenerateRequest): Promise<ActivityGeneratorV2HydratedRequest> => {
        const hydrated = this.getHydratedValuesOverride ? await this.getHydratedValuesOverride(this, req) : await this.getHydratedValues(this.ai, req);

        return {
            ...req,
            hydrated
        }
    }

    /**
     * Extends a Zod schema with citation fields.
     * 
     * @param schema - The Zod schema to extend
     * @returns The extended Zod schema
     */
    _extendZodSchemaWithCitationFields(schema: z.ZodObject<any, any, any>): z.ZodObject<any, any, any> {
        return schema.extend({
            citations: z.array(CitationSchema).nullable().describe('If document references are provided, all activities should pull their content from the provided documents, and provide citations to the documents.')
        });
    }

    /**
     * Creates a Zod schema for producing and validating the output of the activity generator.
     * 
     * @param req - The activity generation request containing parameters and constraints
     * @returns A promise that resolves to a Zod schema for validating the output
     */
    async createOutputSchema(req: ActivityGeneratorV2ActivityGenerateRequest): Promise<z.ZodObject<any, any, any>> {
        if (req.sequencing?.sequence) {
            // If we're sequencing, we construct a special output array format.
            const schemas = await Promise.all(req.sequencing.sequence.map(async (seq) => {
                const validActivityTypeServers = await this._getValidActivityTypeServers({
                    activityTypes: seq.activityTypes ?? [...ActivityTypesPublic],
                    typeConfigs: req.typeConfigs
                });
                return validActivityTypeServers.map((server) => this._extendZodSchemaWithCitationFields(server.genConfig?.schema.required({type: true})));
            }));

            //@ts-ignore
            return z.object({
                activities: z.tuple((
                    schemas.map((schemaList) => 
                        schemaList.length > 1 ?     
                            z.union(schemaList as [any, any, ...any[]]) : 
                            schemaList[0]
                    ) as any as [ZodTypeAny, ...ZodTypeAny[]]
                ))
            });
        }
        else {
            // If we're not sequencing, we just need the schema for the first activity type
            const validActivityTypeServers = await this._getValidActivityTypeServers({
                activityTypes: req.validActivityTypes ?? [...ActivityTypesPublic],
                typeConfigs: req.typeConfigs
            });
            const schemas = validActivityTypeServers.map((server) => this._extendZodSchemaWithCitationFields(server.genConfig?.schema));
            
            if (schemas.length === 0) {
                throw new Error('No activity type servers found');
            }

            //@ts-ignore
            const activityTypeSchema = schemas.length === 1 ? 
                schemas[0] 
                : 
                z.union(schemas as [ZodObject<any, any, any>, ZodObject<any, any, any>, ...ZodObject<any, any, any>[]]);

            // If we have a specified number of activities, we need to create an object with keys 1, 2, 3, etc.
            if (notEmpty(req.numActivities)) {
                
                return z.object({
                    activities: z.object(Object.fromEntries(Array.from({length: req.numActivities}, (_, i) => [i + 1, activityTypeSchema])))
                });
            }
            else {
                //@ts-ignore
                return z.object({
                    activities: z.array(activityTypeSchema)
                });
            }
        }
    }

    /**
     * Selects the activities from the output based on whether sequencing is enabled.
     * 
     * @param output - The output from the activity generator
     * @param isSequencing - Whether sequencing is enabled
     * @returns An array of ActivityConfig objects
     */
    selectArrayFromOutput(output: any, isSequencing: boolean, numActivities?: number): ActivityConfig[] {
        // Currently these are the same... but they may not always be so
        if (isSequencing) {
            return output.activities;
        }
        else {
            if (notEmpty(numActivities)) {
                if (output.activities){
                    // Convert the output from object with keys 1, 2, 3, etc. to an array, sorted by the key
                    return Object
                        .entries(output.activities)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([key, value]: any) => value);
                }
                else {
                    return [];
                }
            }
            else {
                return output.activities;
            }
        }
    }

    /**
     * Generates activities based on the provided request.
     * 
     * @param _req - The activity generation request containing parameters and constraints
     * @returns An async generator that yields ActivityConfig objects
     */
    async* generateActivities(_req: ActivityGeneratorV2ActivityGenerateRequest): AsyncGenerator<ActivityConfig> {
        const req = await this.processRequest(_req);

        /**
         * Type servers which are valid for this request.
         */
        const validActivityTypeServers = req.hydrated.validActivityTypeServers;

        /**
         * The schema for the output of the generator.
         */
        const outputSchema = req.hydrated.outputSchema;

        // console.log('OUTPUT SCHEMA', JSON.stringify(recursiveZodToJsonSchema(outputSchema), null, 2));

        // Generate all system prompts
        const MESSAGES = await getGenerateActivityMessages(this.ai, req);

        console.debug('MESSAGES', JSON.stringify(MESSAGES, null, 2));

        // Perform the generation
        const res = await this.ai.streamGenObject({
            model: 'openai:gpt-4o-mini',
            schema: outputSchema,
            messages: MESSAGES,
            // TODO: spread other args
            providerArgs: {
                structuredOutputs: true,
            },
            mode: 'json',
        });


        // Convert the stream to an array generator of items
        const activityArrayGenerator = await partialObjectStreamToArrayGenerator(res.partialObjectStream, (chunk) => {
            return this.selectArrayFromOutput(chunk, req.sequencing?.sequence ? true : false, req.numActivities);
        });

        /**
         * Helper function to get the postprocessing config for an activity at a specific index
         */
        const getPostprocessingConfigForActivity = (activityIndex: number) => {
            // If we have sequencing and there's a config for this index, use it
            if (req.sequencing?.sequence && req.sequencing.sequence[activityIndex]?.postprocessing) {
                return req.sequencing.sequence[activityIndex].postprocessing;
            }
            // Otherwise use the default from the request
            return req.postprocessing;
        };

        type BadCitation = {citation: {docId: string, startText: string, endText: string}, reason: string};

        /**
         * Helper function to postprocess an activity config.
         */
        const microPostprocessActivityConfig = (config: ActivityConfig, activityTypeServer: ValidActivityTypeServerHydrated): {config: ActivityConfig, badCitations: BadCitation[]} => {
            var retConfig = {
                ...config,
                citations: config.citations ?? []
            }

            //@ts-ignore
            retConfig = this._extendZodSchemaWithCitationFields(activityTypeServer.genConfig.schema).parse(retConfig);

            // Create empty citations list
            var badCitations: BadCitation[] = [];

            // Resolve citation ids correctly based on request.hydrated.resources.
            // Sometimes the AI will use the document title, or the url.
            // If this happens, we need to replace the docId it gave us with the correct id.
            retConfig.citations = retConfig.citations?.map((citation) => {
                // Try to find the correct resource by id
                const bestEffortResource = (
                    req.hydrated.resources.find((resource) => resource.id === citation.docId) 
                    ??
                    req.hydrated.resources.find((resource) => resource.entityId === citation.docId)
                    ??
                    req.hydrated.resources.find((resource) => resource.name === citation.docId)
                    ??
                    req.hydrated.resources.find((resource) => resource.source === citation.docId)
                );
                const bestEffortReference = (
                    req.hydrated.referencesAndChunks.references.find((reference) => reference.id === citation.docId)
                    ??
                    req.hydrated.referencesAndChunks.chunks.find((chunk) => chunk.id === citation.docId)
                );
                
                if (bestEffortResource || bestEffortReference) {
                    const citationId = bestEffortResource?.id ?? bestEffortReference?.docId;
                    const bestEffort = bestEffortResource ?? bestEffortReference;
                    if (!citationId) {
                        console.warn(`Resource ${bestEffort?.name} has no id`);
                        badCitations.push({citation, reason: `Resource ${bestEffort?.name} has no id`});
                        return null;
                    }

                    // Now, we must validate that the startText and endText are actually in the resource.
                    // If not, we push an error to let the user know that the citation is invalid.
                    const resourceText = bestEffort?.content;
                    if (!resourceText?.includes(citation.startText)) {
                        console.warn(`Start text "${citation.startText}" not found in resource ${bestEffort?.name}`);
                        badCitations.push({citation, reason: `Start text "${citation.startText}" not found in resource ${bestEffort?.name}`});
                        return null;
                    }
                    if (!resourceText?.includes(citation.endText)) {
                        console.warn(`End text "${citation.endText}" not found in resource ${bestEffort?.name}`);
                        badCitations.push({citation, reason: `End text "${citation.endText}" not found in resource ${bestEffort?.name}`});
                        return null;
                    }
                
                    return {
                        ...citation,
                        docId: citationId as string
                    }
                }
                else {
                    console.warn(`Could not find resource for citation ${citation.docId}`);
                    badCitations.push({citation, reason: `Could not find resource for citation ${citation.docId}`});
                    return null;
                }
            }).filter(notEmpty);

            return {
                config: retConfig,
                badCitations
            };
        }

        /**
         * Helper function to get the evaluators config for an activity at a specific index
         */
        const getEvaluatorsConfigForActivity = (activityIndex: number) => {
            // If we have sequencing and there's a config for this index, use it
            if (req.sequencing?.sequence && req.sequencing.sequence[activityIndex]?.evaluators) {
                return req.sequencing.sequence[activityIndex].evaluators;
            }
            // Otherwise use the default from the request
            return req.evaluators;
        };

        /**
         * Helper function to get additional instructions for an activity at a specific index
         */
        const getAdditionalInstructionsForActivity = (activityIndex: number) => {
            const sequenceInstructions = req.sequencing?.sequence?.[activityIndex]?.additionalInstructions;
            const defaultInstructions = req.additionalInstructions;
            
            if (sequenceInstructions && defaultInstructions) {
                return `${defaultInstructions}\n\n${sequenceInstructions}`;
            }
            
            return sequenceInstructions || defaultInstructions;
        };

        // Iterate over async generator
        let activityIndex = 0;
        for await (const act of activityArrayGenerator) {
            var activity = act;

            var feedback: any[] = [];

            // Get the configuration for this specific activity based on its position in the sequence
            const postprocessingConfig = getPostprocessingConfigForActivity(activityIndex);
            const evaluatorsConfig = getEvaluatorsConfigForActivity(activityIndex);
            const additionalInstructions = getAdditionalInstructionsForActivity(activityIndex);

            // Find the activity type server
            const activityTypeServer = validActivityTypeServers.find((server) => server.type === activity.type);
            // If the activity type is not in the valid activity types, skip it
            if (!activityTypeServer) {  
                console.warn(`Activity type "${activity.type}" is not in the valid activity types: ${req.validActivityTypes?.map((type) => `"${type}"`).join(', ')}`);
                activityIndex++;
                continue;
            }

            // Postprocess the activity config
            const microPostprocessResult = microPostprocessActivityConfig(activity, activityTypeServer);
            activity = microPostprocessResult.config;
            const badCitations = microPostprocessResult.badCitations;

            try {
                // Use the activity-specific evaluators config for maxEvalLoops
                const maxIters = Math.max(1, evaluatorsConfig?.maxEvalLoops ?? 1);

                for (let i = 0; i < maxIters; i++) {   
                    //console.log(`ACTIVITY (ITERATION ${i})`, activity);

                    // console.log('postProcessConfig', activityTypeServer?.postProcessConfig, postprocessingConfig?.enabled !== false);

                    // First, run postGeneration - use the activity-specific postprocessing config
                    if (activityTypeServer?.postProcessConfig && postprocessingConfig?.enabled !== false) {
                        try {
                            activity = await activityTypeServer.postProcessConfig({
                                request: {
                                    ...req,
                                    additionalInstructions: additionalInstructions
                                }, 
                                ai: this.ai, 
                                config: activity
                            });
                            //console.log(`POST_GENERATION_ACTIVITY (ITERATION ${i})`, activity);
                        } catch (e) {
                            console.error(`Error in post generation for activity type "${activity.type}":`, e);
                        }
                    }

                    // Next, run the evaluation - use the activity-specific evaluators config
                    if (activityTypeServer?.evaluateConfig && evaluatorsConfig?.enabled === true) {
                        //console.log(`EVALUATING_ACTIVITY (ITERATION ${i})`, activity);
                        const evaluateResponse = await activityTypeServer.evaluateConfig({
                            config: activity,
                            ai: this.ai, 
                            request: {
                                ...req,
                                additionalInstructions: additionalInstructions
                            },
                        });

                        //console.log(`EVALUATION_RESPONSE (ITERATION ${i})`, evaluateResponse);

                        const {isValid, feedback: thisFeedback} = evaluateResponse;
                        feedback = [...feedback, ...(thisFeedback ? [thisFeedback] : [])];
                        
                        if (!isValid) { 
                            // console.warn(`Activity type "${activity.type}" is not valid:`, JSON.stringify({activity, thisFeedback}, null, 2));
                            
                            // Try generating another activity of this type
                            const res = await this.ai.genObject({
                                schema: z.object({
                                    activity: this._extendZodSchemaWithCitationFields(activityTypeServer.genConfig.schema)
                                }),
                                messages: [
                                    ...MESSAGES,
                                    {
                                        role: 'assistant',
                                        content: `
                                            [...other activities...]

                                            <ACTIVITY_TO_FIX>
                                                ${JSON.stringify(activity)}
                                            </ACTIVITY_TO_FIX>

                                            [...other activities...]
                                        `
                                    },
                                    {
                                        role: 'user',
                                        content: `
                                            That activity was not valid, here is some feedback:

                                            <FEEDBACK>
                                                ${JSON.stringify(thisFeedback)}
                                            </FEEDBACK>

                                            Please generate a fixed version of the activity.
                                        `
                                    }
                                ],
                                // TODO: spread other args
                                providerArgs: {
                                    structuredOutputs: true,
                                },
                                mode: 'json',
                            }) 

                            //console.log(`FIXED_ACTIVITY (ITERATION ${i})`, res.object.activity);

                            // Postprocess the activity config
                            const microPostprocessResult = microPostprocessActivityConfig(res.object.activity as any, activityTypeServer);
                            activity = microPostprocessResult.config;
                            const badCitations = microPostprocessResult.badCitations;
                        }
                        else {
                            break;
                        }
                    }
                }

                //console.log(`FINAL_ACTIVITY`, activity);

                yield activity;
                activityIndex++;
            }
            catch (e: any) {
                console.error(`Error in activity generation for activity type "${activity.type}":`, e);
                activityIndex++;
                continue;
            }
        }
    }
}