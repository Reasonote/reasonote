// import {
//   OutputSkill,
//   sortSkills,
// } from "./SkillSort";

// describe('Skill Sorting Algorithm', () => {
//   test('sorts skills with simple dependencies correctly', () => {
//     const skills: OutputSkill[] = [
//       { skillName: "Addition", level: "INTRO", pathTo: ["Math"] },
//       { skillName: "Adding three numbers", level: "INTRO", pathTo: ["Math", "Addition"] },
//       { skillName: "Math", level: "INTRO", pathTo: []}
//     ];

//     const expectedOrder = ["Math", "Addition", "Adding three numbers"];
//     const sortedSkills = sortSkills(skills).map(skill => skill.skillName);

//     expect(sortedSkills).toEqual(expectedOrder);
//   });

//   test('sorts complex dependencies correctly', () => {
//     const skills: OutputSkill[] = [
//       { skillName: "Lebesgue Integration", level: "MASTER", pathTo: ["Math", "Calculus"] },
//       { skillName: "Multivariable Calculus", level: "ADVANCED", pathTo: ["Math", "Calculus"] },
//       { skillName: "Calculus", level: "ADVANCED", pathTo: ["Math"] },
//     ];

//     const expectedOrder = ["Calculus", "Multivariable Calculus", "Lebesgue Integration"];
//     const sortedSkills = sortSkills(skills).map(skill => skill.skillName);

//     console.log(sortedSkills);

//     expect(sortedSkills).toEqual(expectedOrder);
//   });

//   test('throws error on cycle detection', () => {
//     const skillsWithCycle: OutputSkill[] = [
//       { skillName: "Calculus", level: "ADVANCED", pathTo: ["Math", "Multivariable Calculus"] },
//       { skillName: "Multivariable Calculus", level: "ADVANCED", pathTo: ["Math", "Calculus"] }
//     ];

//     expect(() => sortSkills(skillsWithCycle)).toThrow("Cycle detected in skill dependencies.");
//   });

//   test('handles single skill without dependencies correctly', () => {
//     const singleSkill: OutputSkill[] = [
//       { skillName: "Mathematics", level: "INTRO", pathTo: ["Math"] }
//     ];

//     const sortedSkills = sortSkills(singleSkill).map(skill => skill.skillName);
//     expect(sortedSkills).toEqual(["Mathematics"]);
//   });
// });

export {};
