// import {createServerClient} from "@/app/api/_testUtils/serverSupabaseClient";

// import {ActivityGenerateRoute} from "../routeSchema";

// const supabase = createServerClient();

// describe('ActivityGenerateRoute: Term-Matching', () => {
//     it('Should generate a term-matching activity', async () => {
//         const input = {
//             activityTypes: ['term-matching' as const],
//             from: {
//                 documents: [
//                     {
//                         text: "1. Multiple Choice\n\nEdit\n\nTrading something for something else - no currency involved\ndemand\nbarter\ngoods\nmarket\n2. Multiple Choice\n\nEdit\n\n30 seconds\n1 point\nTools we use to make products\ncapital resources\nhuman resources\nnatural resources\nentrepreneurs"
//                     }
//                 ]
//             }
//         };

//         await testActivityGeneration(input, (activity) => {
//             expect(activity._type).toBe('term-matching');
//             expect(activity.type_config).toBeDefined();
//             expect(activity.type_config?.['termPairs']).toBeDefined();
            
//             const termPairs = activity.type_config?.['termPairs'];
//             expect(Array.isArray(termPairs)).toBe(true);
//             expect(termPairs.length).toBeGreaterThan(0);

//             const expectedTerms = ['barter', 'goods', 'capital resources', 'human resources', 'natural resources', 'entrepreneurs', 'demand', 'market'].map(term => term.toLowerCase().trim());
//             const foundTerms = termPairs.map((pair: any) => pair.term.toLowerCase().trim());

//             // At least three of the expected terms should be found in the generated terms
//             const foundTermsCount = foundTerms.filter((term: string) => expectedTerms.includes(term)).length;

//             expect(foundTermsCount).toBeGreaterThanOrEqual(3);
//         });
//     });
// });

// // Test fixture for easier activity generation and validation
// const testActivityGeneration = async (
//     input: any,
//     validateFn: (activity: any) => void
// ) => {
//     // Log in
//     const loginResult = await supabase.auth.signInWithPassword({
//         email: 'system@reasonote.com',
//         password: 'rootchangeme'
//     });

//     const token = loginResult.data?.session?.access_token;

//     if (!token) throw new Error('No token returned from login');

//     // Call the API route
//     const result = await ActivityGenerateRoute.call(input, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//         baseUrl: 'http://localhost:3456'
//     });

//     if (!result.data) throw new Error('No data returned from ActivityGenerateRoute');

//     // Check if activityIds were returned
//     expect(result.data.activityIds).toBeDefined();
//     expect(result.data.activityIds.length).toBeGreaterThan(0);

//     // Fetch the generated activity from Supabase
//     const { data, error } = await supabase
//         .from('activity')
//         .select('*')
//         .in('id', result.data.activityIds);

//         if (error) throw error;

//     // Run the custom validation function
//     validateFn(data[0]);
// };

export {};
