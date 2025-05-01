import { z } from "zod";

export const ReasonoteLicenseTypes = ['Reasonote-Anonymous', 'Reasonote-Free', 'Reasonote-Basic', 'Reasonote-Pro', 'Reasonote-Admin', 'Reasonote-QA'] as const;
export const ReasonoteLicenseTypeSchema = z.union([
    z.enum(ReasonoteLicenseTypes),
    z.string()
]);
export type ReasonoteLicenseType = z.infer<typeof ReasonoteLicenseTypeSchema>;

export const ReasonoteLicenseSchema = z.object({
  type: ReasonoteLicenseTypeSchema,
  name: z.string(),
  upsell: z.object({
    upsellToType: ReasonoteLicenseTypeSchema,
    upsellPath: z.string(),
    upsellText: z.string()
  }).optional()
});

export interface ReasonoteFeature {
  id: string;
  name: string;
  description?: string;
  limit?: {
    period: 'day' | 'week' | 'month' | 'year';
    perPeriod: number;
    isUnlimitedPerPeriod?: boolean;
    isUnlimitedTotal?: boolean;
    total?: number;
  };
}

export interface ReasonoteLicensePlan {
    type: ReasonoteLicenseType;
    name: string;
    price: number | null;
    features: {
        [key: string]: ReasonoteFeature;
    };
    upsell?: {
        upsellToType: ReasonoteLicenseType;
        upsellPath: string;
        upsellText: string;
        upsellDescription?: string;
        upsellLookupKey?: string;
    };
}

export const ReasonoteLicensePlans: Record<ReasonoteLicenseType, ReasonoteLicensePlan> = {
    'Reasonote-Anonymous': {
        type: 'Reasonote-Anonymous',
        name: 'Anonymous',
        price: null,
        features: {
            lessons_generated: {
                id: 'lessons_generated',
                name: 'AI Lessons',
                limit: { period: 'day', perPeriod: 1 }
            },
            podcasts_generated: {
                id: 'podcasts_generated',
                name: 'AI Podcasts',
                limit: { period: 'day', perPeriod: 1 }
            },
            practice_activities: {
                id: 'practice_activities',
                name: 'Practice Activities',
                limit: { period: 'day', perPeriod: 10 }
            }
        },
        upsell: {
            upsellToType: 'Reasonote-Free',
            upsellPath: '/app/login',
            upsellText: 'Create Free Account',
            upsellDescription: 'Create an account to increase your daily limits and unlock more features'
        }
    },
    'Reasonote-Free': {
        type: 'Reasonote-Free',
        name: 'Free',
        price: null,
        features: {
            lessons_generated: {
                id: 'lessons_generated',
                name: 'AI Lessons',
                limit: { period: 'day', perPeriod: 5 }
            },
            podcasts_generated: {
                id: 'podcasts_generated',
                name: 'AI Podcasts',
                limit: { period: 'day', perPeriod: 5 }
            },
            practice_activities: {
                id: 'practice_activities',
                name: 'Practice Activities',
                limit: { period: 'day', perPeriod: 50 }
            }
        },
        upsell: {
            upsellToType: 'Reasonote-Basic',
            upsellPath: '/app/upgrade?plan=basic',
            upsellText: 'Upgrade to Basic',
            upsellDescription: 'Get premium features, higher limits, and more',
            upsellLookupKey: process.env.NEXT_PUBLIC_REASONOTE_BASIC_MONTHLY_DEFAULT_LOOKUP_KEY!
        }
    },
    'Reasonote-Basic': {
        type: 'Reasonote-Basic',
        name: 'Basic',
        price: 14.99,
        features: {
            lessons_generated: {
                id: 'lessons_generated',
                name: 'AI Lessons',
                limit: { period: 'day', perPeriod: 30 }
            },
            podcasts_generated: {
                id: 'podcasts_generated',
                name: 'AI Podcasts',
                limit: { period: 'day', perPeriod: 25 }
            },
            practice_activities: {
                id: 'practice_activities',
                name: 'Practice Activities',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            priority_support: {
                id: 'priority_support',
                name: 'Priority Support'
            },
            practice_mode: {
                id: 'practice_mode',
                name: 'Practice Mode'
            }
        },
        upsell: {
            upsellToType: 'Reasonote-Pro',
            upsellPath: '/app/upgrade?plan=pro',
            upsellText: 'Upgrade to Pro'
        }
    },
    'Reasonote-Pro': {
        type: 'Reasonote-Pro',
        name: 'Pro',
        price: 24.99,
        features: {
            lessons_generated: {
                id: 'lessons_generated',
                name: 'AI Lessons',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            podcasts_generated: {
                    id: 'podcasts_generated',
                name: 'AI Podcasts',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            practice_activities: {
                id: 'practice_activities',
                name: 'Practice Activities',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            priority_support: {
                id: 'priority_support',
                name: 'Priority Support'
            },
            practice_mode: {
                id: 'practice_mode',
                name: 'Practice Mode'
            },
            customization: {
                id: 'customization',
                name: 'Advanced Customization'
            }
        }
    },
    'Reasonote-Admin': {
        type: 'Reasonote-Admin',
        name: 'Admin',
        price: null,
        features: {
            lessons_generated: {
                id: 'lessons_generated',
                name: 'AI Lessons',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            podcasts_generated: {
                id: 'podcasts_generated',
                name: 'AI Podcasts',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            practice_activities: {
                id: 'practice_activities',
                name: 'Practice Activities',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            }
        }
    },
    'Reasonote-QA': {
        type: 'Reasonote-QA',
        name: 'QA',
        price: null,
        features: {
            lessons_generated: {
                id: 'lessons_generated',
                name: 'AI Lessons',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            podcasts_generated: {
                id: 'podcasts_generated',
                name: 'AI Podcasts',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            },
            practice_activities: {
                id: 'practice_activities',
                name: 'Practice Activities',
                limit: { period: 'day', perPeriod: Infinity, isUnlimitedPerPeriod: true }
            }
        }
    }
};

export interface ReasonoteFeatureDescription {
  id: string;
  name: string;
  description: string;
  icon: string | React.ComponentType;
  illustration?: string;
}

export const ReasonoteFeatureDescriptions: Record<string, ReasonoteFeatureDescription> = {
  lessons_generated: {
    id: 'lessons_generated',
    name: 'AI Lessons',
    description: 'Master concepts faster with our AI-powered learning system',
    icon: 'School',
    illustration: '/images/illustrations/step_to_the_sun.svg'
  },
  podcasts_generated: {
    id: 'podcasts_generated',
    name: 'AI Podcasts',
    description: 'Listen to AI-generated podcasts on your chosen topics',
    icon: 'Mic',
    illustration: '/images/illustrations/audio_conversation.svg'
  },
  practice_activities: {
    id: 'practice_activities',
    name: 'Practice Activities',
    description: 'Engage with interactive learning activities',
    icon: 'DirectionsRun',
    illustration: '/images/illustrations/undraw_environmental_study_re_q4q8.svg'
  },
  practice_mode: {
    id: 'practice_mode',
    name: 'Practice Mode',
    description: 'Enter a state of focused learning with our adaptive system',
    icon: 'Waves',
    illustration: '/images/illustrations/undraw_focus_sey6.svg'
  },
  priority_support: {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Get faster responses to your questions and issues',
    icon: 'Star',
    illustration: '/images/illustrations/true_friends.svg'
  },
  customization: {
    id: 'customization',
    name: 'Advanced Customization',
    description: 'Customize your learning experience to your needs',
    icon: 'Settings',
    illustration: '/images/illustrations/undraw_settings_re_b08x.svg'
  }
};