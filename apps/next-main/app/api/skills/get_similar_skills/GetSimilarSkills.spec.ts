// import fs from "fs/promises";
// import path from "path";

// import {Database} from "@reasonote/lib-sdk";
// import {notEmpty} from "@reasonote/lib-utils";
// import {SupabaseClient} from "@supabase/supabase-js";

// import {testSignupBetaUser} from "../../_common/testing/signupBetaUser";
// import {getApiEnv} from "../../helpers/apiEnv";
// import {
//   DatasetSkillEntryWithIds,
//   skillListing,
//   SkillTypeEnum,
// } from "./_testing/dataset";
// import {GetSimilarSkillsRoute} from "./routeSchema";

// var DATASET_WITH_IDS: DatasetSkillEntryWithIds[] = [];

// async function getCtx(){
//   const apiEnv = getApiEnv();

//   // Create beta user
//   const betaUser = await testSignupBetaUser();

//   // TODO: make an abstraction around this for the default admin user, etc.
//   const sb = new SupabaseClient<Database>(
//     apiEnv.NEXT_PUBLIC_SUPABASE_URL,
//     apiEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
//   );
  
//   const results = await sb.auth.signInWithPassword({
//     email: betaUser.email,
//     password: betaUser.password,
//   });

//   const token = results.data.session?.access_token;

//   if (!token) {
//     throw new Error("Failed to get token");
//   }

//   return {
//     sb,
//     token
//   }
// }

// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////

// beforeAll(async () => {
//   const {sb, token} = await getCtx()

//   // TODO: for each dataset entry, insert those skills and store their ids.
//   await Promise.all(skillListing.map(async (entry) => {
//     const skillOne = entry.skillOne;
//     const skillTwo = entry.skillTwo;

//     const skillInsert = await sb.from('skill').insert([
//       {
//         _name: skillOne.name,
//         _description: skillOne.description,
//       },
//       {
//         _name: skillTwo.name,
//         _description: skillTwo.description,
//       }
//     ]).select('*')

//     if (skillInsert.error){
//       throw new Error(`Failed to insert skill!`)
//     }

//     const skillOneId = skillInsert.data[0].id
//     const skillTwoId = skillInsert.data[1].id

//     DATASET_WITH_IDS.push({
//       skillOne: {
//         ...skillOne,
//         id: skillOneId,
//       },
//       skillTwo: {
//         ...skillTwo,
//         id: skillTwoId,
//       },
//       type: entry.type,
//     })
//   }));
// }, 60000);


// afterAll(async () => {
//   // Clear out the dataset.
//   const {sb} = await getCtx();

//   // Delete all the ids in dataset with ids.

//   const res1 = await sb.from('skill').delete()
//     .in('id', DATASET_WITH_IDS.map((entry) => entry.skillOne.id));

//   const res2 = await sb.from('skill').delete()
//     .in('id', DATASET_WITH_IDS.map((entry) => entry.skillTwo.id));
  
//   if (res1.error){
//     console.error(`Failed to delete skills!`, res1.error)
//   }
//   if (res2.error){
//     console.error(`Failed to delete skills!`, res2.error)
//   }
// }, 60000)


// test("GetSimilarSkills", async () => {
//   const {sb, token} = await getCtx()

//   // Run all similarities
//   const results = await Promise.all(DATASET_WITH_IDS.map(async (entry) => {
//     const skillOne = entry.skillOne;
//     const skillTwo = entry.skillTwo;

//     const res = await GetSimilarSkillsRoute.call(
//       {
//         skill: {
//           type: 'skill',
//           id: skillOne.id,
//         },
//         // This is overkill,
//         // but it handles the case where the db already has a lot of entries.
//         matchCount: 10_000,
//         nameMatchThreshold: .9,
//         // descriptionMatchThreshold: .9,
//       },
//       {
//         baseUrl: "http://localhost:3456",
//         headers: {
//           Authorization: token,
//         },
//       }
//     );

//     return {
//       entry,
//       res
//     }
//   }))

//   // Check all similarities
//   const finalTestresults = results.map((result) => {
//     const entry = result.entry;
//     const res = result.res;

//     const similarSkills = res.data?.similarSkills;


//     var issues: string[] = [];



//     if (entry.type === SkillTypeEnum.ShouldBeIdentical){
//       if (!similarSkills || similarSkills.length === 0){
//         issues.push(`No similar skills found!`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       const skillTwoSimilarity = similarSkills.find((sim) => sim.id === entry.skillTwo.id);

//       if (!skillTwoSimilarity){
//         issues.push(`Skill two similarity not found!`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       const nameSimilarity = skillTwoSimilarity.nameSimilarity;
//       const descriptionSimilarity = skillTwoSimilarity.descriptionSimilarity;

//       if (!nameSimilarity){
//         issues.push(`Name similarity not found!`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       if (nameSimilarity < 0.94){
//         issues.push(`Skill two name similarity (${nameSimilarity}) too low for supposedly identical entry`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       if (descriptionSimilarity && descriptionSimilarity < 0.9){
//         issues.push(`Skill two description similarity (${descriptionSimilarity}) too low for supposedly identical entry`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       return;
//     }
//     else if (entry.type === SkillTypeEnum.ShouldBeSimilar){

//     }
//     else if (entry.type === SkillTypeEnum.ShouldBeDifferent){
//       if (!similarSkills || similarSkills.length === 0){
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       const skillTwoSimilarity = similarSkills.find((sim) => sim.id === entry.skillTwo.id);

//       if (!skillTwoSimilarity){
//         // This is good!
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       const nameSimilarity = skillTwoSimilarity.nameSimilarity;
//       const descriptionSimilarity = skillTwoSimilarity.descriptionSimilarity;

//       if (!nameSimilarity){
//         issues.push(`Name similarity not found!`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       if (nameSimilarity > 0.95){
//         issues.push(`Skill two name similarity (${nameSimilarity}) too high for supposedly different entry!`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       if (descriptionSimilarity && descriptionSimilarity > 0.9){
//         issues.push(`Skill two description similarity (${descriptionSimilarity}) too high for supposedly different entry!`)
//         return {
//           entry,
//           res,
//           issues,
//         }
//       }

//       return;
//     }
//     else {
//       throw new Error(`Type ${entry.type} not yet implemented.`)
//     }
//   })
  
//   // get current file location
//   const dirname = __dirname;
//   const testArtifactDir = path.join(dirname, '_testing', '.test-artifacts');
//   await fs.mkdir(testArtifactDir, {recursive: true});
//   await fs.writeFile(path.join(testArtifactDir, 'output.json'), JSON.stringify(finalTestresults, null, 2), 'utf8');

//   // Get list of all issues found, along with the skill1 & skill2 names
//   const issues = finalTestresults.filter(notEmpty).map((result) => {
//     return {
//       issues: result.issues,
//       skillOne: result.entry.skillOne,
//       skillTwo: result.entry.skillTwo,
//       type: result.entry.type,
//     }
//   }).filter((result) => result.issues.length > 0);

//   // Write out the issues
//   expect(issues).toEqual([]);  
// }, 60000);

export {};
