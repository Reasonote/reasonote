import {z} from "zod";

import {
  ReasonoteLicensePlan,
  ReasonoteLicensePlans,
  ReasonoteLicenseType,
} from "@reasonote/core";

import {__RsnClientModel__} from "./__RsnClientModel__";

export class LicenseClientModel extends __RsnClientModel__ {
    async getLicensesFromDb(): Promise<{
        type: ReasonoteLicenseType,
        planEnd?: string,
        planStart: string,
    }[]> {
        // Get user and sysdata in parallel
        const [userResponse, sysData] = await Promise.all([
            this.client.sb.auth.getUser(),
            this.client.sb.from('rsn_user_sysdata').select('*').eq('auth_id', (await this.client.sb.auth.getUser()).data.user?.id ?? '').single()
        ]);
        
        const user = userResponse.data.user;
        
        var licenses: {
            type: ReasonoteLicenseType,
            planEnd?: string,
            planStart: string,
        }[] = [];

        // If we don't have a user, we're anonymous.
        if (!user) return [{
            type: 'Reasonote-Anonymous', 
            planStart: Date.now().toString()
        }];

        // If we're anonymous, we're anonymous.
        if (user.is_anonymous) return [{
            type: 'Reasonote-Anonymous', 
            planStart: user.created_at
        }];

        // Load special licenses from sysdata
        // Sysdata.data should be object with key of license type and value of true or false depending on if the user has that license
        const parsedSysData = z.union([z.record(z.string(), z.boolean()), z.null(), z.undefined()]).safeParse(sysData.data?.extra_license_info ?? {});
        if (parsedSysData.success) {
            // Any keys which are true from sysdata
            const licenseTypes = Object.entries(parsedSysData.data ?? {})
                .filter(([_, value]) => value === true)
                .map(([key]) => key as ReasonoteLicenseType);
            
            licenses = licenseTypes
            // Only types we have configured.
                .filter((type) => ReasonoteLicensePlans[type])
                .map((type) => ({
                    type,
                    planStart: Date.now().toString()
             }));
        }

        // If we're admin, that's the only license we care about.
        if (licenses.find((l) => l.type === 'Reasonote-Admin') || licenses.find((l) => l.type === 'Reasonote-QA')) {
            return licenses;
        }

        // Load stripe licenses and continue processing in parallel
        const stripeLicensePromise = this.client.sb
            .rpc("get_user_stripe_subs_short")
            .then(({ data, error }) => {
                if (error) {
                    console.error(error);
                    return [];
                }

                const typesRet = z
                    .array(z.string())
                    .safeParse(data?.map((d: any) => d.stripe_product_lookup_key));
                
                if (!typesRet.success) {
                    console.warn(`Failed to get types from database for user ${user?.id} ${user?.email}, defaulting to Reasonote-Free`);
                    return [{
                        type: 'Reasonote-Free' as ReasonoteLicenseType,
                        planStart: Date.now().toString()
                    }];
                }
                
                return typesRet.data.map((type) => ({
                    type: type as ReasonoteLicenseType,
                    planStart: data.find((d: any) => d.stripe_product_lookup_key === type)?.current_period_start ?? Date.now().toString(),
                    planEnd: data.find((d: any) => d.stripe_product_lookup_key === type)?.current_period_end ?? Date.now().toString()
                }));
            });

        // Add stripe licenses to our existing licenses
        const stripeLicenses = await stripeLicensePromise;
        licenses.push(...stripeLicenses);

        if (licenses.length === 0) {
            console.warn(`No licenses found for user ${user?.id} ${user?.email}, defaulting to Reasonote-Free`);
            licenses.push({
                type: 'Reasonote-Free',
                planStart: Date.now().toString()
            });
        }

        return licenses;
    }

    async getMainlicenseType(): Promise<ReasonoteLicenseType> {
        const Licenses = await this.getLicensesFromDb();

        return Licenses[0].type;
    }

    async getCurrentLicense(): Promise<ReasonoteLicensePlan> {
        const planType = await this.getMainlicenseType();

        return ReasonoteLicensePlans[planType];
    }

    async getFeatureUsage() {
        // Get userId and calculate dates in parallel
        const [userId, now] = await Promise.all([
            this.client.currentUserId(),
            Promise.resolve(new Date())
        ]);

        const dayStart = new Date(now.setHours(0,0,0,0)).toISOString();
        const dayEnd = new Date(now.setHours(23,59,59,999)).toISOString();

        // Create base query parameters that are shared
        const baseQuery = {
            userId: userId ?? '',
            dayStart,
            dayEnd
        };

        // Define all queries upfront
        const queries = {
            lessons: this.client.sb
                .from('user_lesson_result')
                .select('*', { count: 'exact', head: true })
                .eq('_user', baseQuery.userId)
                .gte('created_date', baseQuery.dayStart)
                .lte('created_date', baseQuery.dayEnd),
            
            podcasts: this.client.sb
                .from('podcast')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', baseQuery.userId)
                .gte('created_date', baseQuery.dayStart)
                .lte('created_date', baseQuery.dayEnd),
            
            practice: this.client.sb
                .from('user_activity_result')
                .select('*', { count: 'exact', head: true })
                .eq('_user', baseQuery.userId)
                .gte('created_date', baseQuery.dayStart)
                .lte('created_date', baseQuery.dayEnd)
        };

        // Execute all queries in parallel
        const [lessonRes, podcastRes, practiceRes] = await Promise.all([
            queries.lessons,
            queries.podcasts,
            queries.practice
        ]);

        // Process results
        const counts = {
            lessons: lessonRes.error ? (console.error('Error getting lesson count', lessonRes.error), 0) : (lessonRes.count ?? 0),
            podcasts: podcastRes.error ? (console.error('Error getting podcast count', podcastRes.error), 0) : (podcastRes.count ?? 0),
            practice: practiceRes.error ? (console.error('Error getting practice session count', practiceRes.error), 0) : (practiceRes.count ?? 0)
        };

        return {
            lessons_generated: {
                periodStart: dayStart,
                periodEnd: dayEnd,
                numberInPeriod: counts.lessons
            },
            podcasts_generated: {
                periodStart: dayStart,
                periodEnd: dayEnd,
                numberInPeriod: counts.podcasts
            },
            practice_activities: {
                periodStart: dayStart,
                periodEnd: dayEnd,
                numberInPeriod: counts.practice
            }
        };
    }
} 