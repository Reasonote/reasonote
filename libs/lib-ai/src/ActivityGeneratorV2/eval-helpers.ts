import {
  mkdirSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { z } from 'zod';

import { ActivityConfig } from '@reasonote/core';

import { ActivityTypeServerV2 } from '../';
import { AI } from '../AI';
import {
  DomainPromptLibrary,
} from '../AIChat/ChatStream/Agent/CtxInjectors/DomainCtxInjector';
import { createDefaultStubAI } from '../DefaultStubAI';

// Base evaluation interface that all activity types will extend
export interface BaseActivityEvaluation<T extends ActivityConfig> {
    activity: T;
    metrics: {
        relevance: number;      // How relevant is it to the subject and goals?
        appropriateness: number; // Is it appropriate for the user's level?
        engagement: number;     // How engaging is the activity?
        effectiveness: number;  // How effective is it pedagogically?
        quality: number;        // How well-structured is the activity?
    };
    notes: {
        relevance: string;
        appropriateness: string;
        engagement: string;
        effectiveness: string;
        quality: string;
    };
}

// Base evaluation schema that all activity types will extend
export const BaseEvaluationSchema = z.object({
    scores: z.object({
        relevance: z.number(),
        appropriateness: z.number(),
        engagement: z.number(),
        effectiveness: z.number(),
        quality: z.number(),
    }),
    notes: z.object({
        relevance: z.string(),
        appropriateness: z.string(),
        engagement: z.string(),
        effectiveness: z.string(),
        quality: z.string(),
    }),
});

// Base evaluation function that can be extended for specific activity types
export async function evaluateBaseActivity<T extends ActivityConfig>(
    activity: T,
    subject: string,
    ai: AI,
    activityType: string,
    activitySpecificQualityCriteria: string[]
): Promise<BaseActivityEvaluation<T>> {
    const evaluation = await ai.genObject({
        prompt: `
        <TASK>
            Evaluate this ${activityType} activity for the subject "${subject}" based on the following metrics.
            For each metric, provide a score from 1-10 and a detailed explanation of your rating.
            Be critical and specific in your evaluation.
        </TASK>

        <Activity type="${activity.type}">
            ${JSON.stringify(activity, null, 2)}
        </Activity>

        <METRICS>
            1. Relevance (1-10)
               - How relevant is it to the subject that the user is interested in studying?
               - How relevant is it to help them achieve their goals?
               - Does it cover important concepts or just trivia?
               - Does the question target a key concept or fact for this subject?

            2. Appropriateness (1-10)
               - Is this an appropriate question to ask the user at this time?
               - Based on the level that they have shown.
               - Is it too easy or too difficult?
               - Does it build on previous knowledge appropriately?

            3. Engagement (1-10)
               - How engaging is the activity?
               - Will it maintain the user's interest?
               - Is it thought-provoking or just memorization?
               - Does it encourage deeper thinking?

            4. Pedagogical Effectiveness (1-10)
               - How effective will this activity be in helping the user achieve their goals?
               - Does answering this activity show knowledge of the subject?
               - Does it promote understanding or just recall?
               - Will it help with long-term retention?

            5. Activity-Specific Quality (1-10)
               ${activitySpecificQualityCriteria.map(criterion => `- ${criterion}`).join('\n')}
        </METRICS>

        <OUTPUT_FORMAT>
            Provide your evaluation in the following format:
            {
                "scores": {
                    "relevance": number (1-10),
                    "appropriateness": number (1-10),
                    "engagement": number (1-10),
                    "effectiveness": number (1-10),
                    "quality": number (1-10)
                },
                "notes": {
                    "relevance": "detailed explanation",
                    "appropriateness": "detailed explanation",
                    "engagement": "detailed explanation",
                    "effectiveness": "detailed explanation",
                    "quality": "detailed explanation"
                }
            }
        </OUTPUT_FORMAT>
        `,
        schema: BaseEvaluationSchema,
        mode: 'json',
        model: 'openai:gpt-4o-mini',
        providerArgs: {
            structuredOutputs: true,
        },
    });

    return {
        activity,
        metrics: evaluation.object.scores,
        notes: evaluation.object.notes,
    };
}

// Shared interfaces for evaluation reports
export interface SubjectEvaluation<T extends ActivityConfig> {
    subject: string;
    activities: BaseActivityEvaluation<T>[];
    averageScore: number;
}

export interface DomainEvaluation<T extends ActivityConfig> {
    domain: string;
    subjects: SubjectEvaluation<T>[];
    averageScore: number;
}

export interface EvaluationReport<T extends ActivityConfig> {
    domains: DomainEvaluation<T>[];
    overallAverageScore: number;
    metricsSummary: {
        relevance: { average: number; distribution: Record<string, number> };
        appropriateness: { average: number; distribution: Record<string, number> };
        engagement: { average: number; distribution: Record<string, number> };
        effectiveness: { average: number; distribution: Record<string, number> };
        quality: { average: number; distribution: Record<string, number> };
    };
}

// Helper function to generate and evaluate a single activity
async function generateAndEvaluateActivity(
    subject: string,
    ai: AI,
    server: ActivityTypeServerV2,
    activityType: string,
    activitySpecificQualityCriteria: string[]
): Promise<BaseActivityEvaluation<ActivityConfig> | null> {
    const activity = await server.generate({
        from: {
            skill: {
                name: subject,
            },
        },
        numActivities: 1,
        ctxInjectors: [
            {
                name: 'Domain',
                config: {
                    subjectName: subject,
                    specificity: 'activityGeneration'
                }
            }
        ],
    }, ai);

    if (!activity.success) {
        console.log(`Failed to generate activity for subject: ${subject}`);
        return null;
    }

    return evaluateBaseActivity(
        activity.data,
        subject,
        ai,
        activityType,
        activitySpecificQualityCriteria
    );
}

// Helper function to evaluate a subject
async function evaluateSubject(
    subject: string,
    ai: AI,
    server: ActivityTypeServerV2,
    activityType: string,
    activitySpecificQualityCriteria: string[],
): Promise<SubjectEvaluation<ActivityConfig>> {
    const evaluation = await generateAndEvaluateActivity(
        subject,
        ai,
        server,
        activityType,
        activitySpecificQualityCriteria
    );

    if (!evaluation) {
        return {
            subject,
            activities: [],
            averageScore: 0
        };
    }

    const subjectScore = Object.values(evaluation.metrics).reduce((a, b) => a + b, 0) / 5;

    return {
        subject,
        activities: [evaluation],
        averageScore: subjectScore
    };
}

// Helper function to evaluate a domain
async function evaluateDomain(
    subjectsPerDomain: number,
    domain: string,
    ai: AI,
    server: ActivityTypeServerV2,
    activityType: string,
    activitySpecificQualityCriteria: string[]
): Promise<DomainEvaluation<ActivityConfig>> {
    const subjects = DomainPromptLibrary[domain].specificExamples
    const subjectEvaluations: SubjectEvaluation<ActivityConfig>[] = [];
    let domainTotalScore = 0;
    let domainTotalSubjects = 0;

    for (const subject of subjects) {
        const subjectEvaluation = await evaluateSubject(
            subject,
            ai,
            server,
            activityType,
            activitySpecificQualityCriteria,
        );

        if (subjectEvaluation.activities.length > 0) {
            subjectEvaluations.push(subjectEvaluation);
            domainTotalScore += subjectEvaluation.averageScore;
            domainTotalSubjects++;
        }
    }

    const domainAverage = domainTotalSubjects > 0 ? domainTotalScore / domainTotalSubjects : 0;

    return {
        domain,
        subjects: subjectEvaluations,
        averageScore: domainAverage
    };
}

// Helper function to calculate metrics summary
function calculateMetricsSummary<T extends ActivityConfig>(
    allEvaluations: BaseActivityEvaluation<T>[]
): EvaluationReport<T>['metricsSummary'] {
    const metricsSummary = {
        relevance: { average: 0, distribution: {} },
        appropriateness: { average: 0, distribution: {} },
        engagement: { average: 0, distribution: {} },
        effectiveness: { average: 0, distribution: {} },
        quality: { average: 0, distribution: {} }
    };

    const metricKeys = ['relevance', 'appropriateness', 'engagement', 'effectiveness', 'quality'] as const;

    for (const metric of metricKeys) {
        const scores = allEvaluations.map(e => e.metrics[metric]);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;

        const distribution: Record<string, number> = {};
        scores.forEach(score => {
            const key = Math.round(score).toString();
            distribution[key] = (distribution[key] || 0) + 1;
        });

        Object.keys(distribution).forEach(key => {
            distribution[key] = (distribution[key] / scores.length) * 100;
        });

        metricsSummary[metric] = {
            average,
            distribution
        };
    }

    return metricsSummary;
}

export async function runEvaluation(
    ai: AI,
    server: ActivityTypeServerV2,
    activityType: string,
    activitySpecificQualityCriteria: string[],
    subjectsPerDomain: number = 3,
): Promise<EvaluationReport<ActivityConfig>> {
    const domains = Object.keys(DomainPromptLibrary);
    const domainEvaluations: DomainEvaluation<ActivityConfig>[] = [];
    let totalScore = 0;
    let totalDomains = 0;
    const allEvaluations: BaseActivityEvaluation<ActivityConfig>[] = [];

    for (const domain of domains) {
        const domainEvaluation = await evaluateDomain(
            subjectsPerDomain,
            domain,
            ai,
            server,
            activityType,
            activitySpecificQualityCriteria
        );

        if (domainEvaluation.subjects.length > 0) {
            domainEvaluations.push(domainEvaluation);
            totalScore += domainEvaluation.averageScore;
            totalDomains++;

            // Collect all evaluations for metrics summary
            domainEvaluation.subjects.forEach(subject => {
                allEvaluations.push(...subject.activities);
            });
        }
    }

    const overallAverageScore = totalDomains > 0 ? totalScore / totalDomains : 0;
    const metricsSummary = calculateMetricsSummary(allEvaluations);

    const report: EvaluationReport<ActivityConfig> = {
        domains: domainEvaluations,
        overallAverageScore,
        metricsSummary
    };

    // Create evaluation results directory if it doesn't exist - in public directory
    const resultsDir = join(__dirname, `../../../../apps/next-main/public/evaluation-results/${activityType}`);
    mkdirSync(resultsDir, { recursive: true });

    // Save the report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `evaluation-${timestamp}.json`;
    const filepath = join(resultsDir, filename);

    writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`Evaluation report saved to: ${filepath}`);

    return report;
}

export interface ActivityTestConfig {
    name: string;
    server: ActivityTypeServerV2;
    qualityCriteria: string[];
    minimumScoreThreshold: number;
}

export function createActivityEvaluationTests(config: ActivityTestConfig) {
    describe(`Activity Evaluations - ${config.name}`, () => {
        let report: EvaluationReport<ActivityConfig>;
        
        // Run the evaluation once before all tests
        beforeAll(async () => {
            report = await runEvaluation(
                createDefaultStubAI(), 
                config.server, 
                config.name, 
                config.qualityCriteria
            );
        }, 1000000);
        
        it('should meet minimum overall score threshold', () => {
            expect(report.overallAverageScore).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
        });
        
        // Create separate test cases for each domain
        describe('Domains', () => {
            it('should have at least one domain with evaluations', () => {
                expect(report.domains.length).toBeGreaterThan(0);
            });
            
            // Dynamically create tests for each domain
            report?.domains?.forEach((domain: DomainEvaluation<any>) => {
                describe(`Domain: ${domain.domain}`, () => {
                    it('should meet minimum domain score threshold', () => {
                        expect(domain.averageScore).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                    });
                    
                    // Create separate test cases for each subject
                    domain.subjects.forEach((subject: SubjectEvaluation<any>) => {
                        describe(`Subject: ${subject.subject}`, () => {
                            // Test subject-level metrics
                            it('should meet minimum overall score threshold', () => {
                                expect(subject.averageScore).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                            });
                            
                            // Test individual activities
                            subject.activities.forEach((activity: BaseActivityEvaluation<any>, index: number) => {
                                it(`should meet minimum metric thresholds for activity ${index + 1}`, () => {
                                    expect(activity.metrics.relevance).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                                    expect(activity.metrics.appropriateness).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                                    expect(activity.metrics.engagement).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                                    expect(activity.metrics.effectiveness).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                                    expect(activity.metrics.quality).toBeGreaterThanOrEqual(config.minimumScoreThreshold);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}