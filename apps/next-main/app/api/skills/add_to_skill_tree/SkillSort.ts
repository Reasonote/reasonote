export interface OutputSkill {
    skillName: string;
    level: string;
    pathTo: string[];
}

// Now, we may have gotten several intermediate skills.
// export function sortSkills(skills: OutputSkill[]): OutputSkill[] {
//     // Create a map to hold skills by their unique path for easy lookup.
//     const skillMap: Map<string, OutputSkill> = new Map();
//     skills.forEach(skill => {
//       const pathKey = skill.pathTo.join(">");
//       skillMap.set(pathKey, skill);
//     });
  
//     // Helper function to find a skill's prerequisite path.
//     function findPrerequisitePath(skill: OutputSkill): string {
//       if (skill.pathTo.length <= 1) return "";
//       // Remove the last part of the path to get the prerequisite's path.
//       return skill.pathTo.slice(0, skill.pathTo.length - 1).join(">");
//     }
  
//     // Topological sort using DFS.
//     const sortedSkills: OutputSkill[] = [];
//     const visited: Set<string> = new Set();
//     const tempMark: Set<string> = new Set();
  
//     function visit(skillPath: string): boolean {
//       if (tempMark.has(skillPath)) return false; // Cycle detected.
//       if (visited.has(skillPath)) return true; // Already processed.
  
//       tempMark.add(skillPath);
//       const skill = skillMap.get(skillPath);
//       if (skill) {
//         const prerequisitePath = findPrerequisitePath(skill);
//         if (prerequisitePath && !visit(prerequisitePath)) return false; // Cycle in prerequisites.
  
//         sortedSkills.push(skill); // Add this skill after its prerequisites.
//       }
//       tempMark.delete(skillPath);
//       visited.add(skillPath);
  
//       return true;
//     }
  
//     // Iterate over all skills to start DFS from each, ensuring all are processed.
//     for (const skill of skills) {
//       const pathKey = skill.pathTo.join(">");
//       if (!visit(pathKey)) throw new Error("Cycle detected in skill dependencies.");
//     }
  
//     return sortedSkills;
//   }

// export function sortSkills(skills: OutputSkill[]): OutputSkill[] {
//     const graph = new Map<string, string[]>();
//     const inDegree = new Map<string, number>();
//     const result: OutputSkill[] = [];
  
//     // Build the graph and initialize inDegree
//     for (const skill of skills) {
//       const skillName = skill.skillName;
//       const dependencies = skill.pathTo.slice(0, -1);
  
//       if (!graph.has(skillName)) {
//         graph.set(skillName, []);
//         inDegree.set(skillName, 0);
//       }
  
//       for (const dependency of dependencies) {
//         if (!graph.has(dependency)) {
//           graph.set(dependency, []);
//           inDegree.set(dependency, 0);
//         }
//         graph.get(dependency)!.push(skillName);
//         inDegree.set(skillName, inDegree.get(skillName)! + 1);
//       }
//     }
  
//     // Find skills with no dependencies (inDegree = 0)
//     const queue: string[] = [];
//     for (const [skillName, degree] of inDegree.entries()) {
//       if (degree === 0) {
//         queue.push(skillName);
//       }
//     }
  
//     // Process skills with no dependencies
//     while (queue.length > 0) {
//       const skillName = queue.shift()!;
//       const skill = skills.find((skill) => skill.skillName === skillName)!;
//       result.push(skill);
  
//       // Reduce inDegree of dependent skills
//       for (const dependent of graph.get(skillName)!) {
//         inDegree.set(dependent, inDegree.get(dependent)! - 1);
//         if (inDegree.get(dependent) === 0) {
//           queue.push(dependent);
//         }
//       }
//     }
  
//     // Check for cycles
//     if (result.length !== skills.length) {
//       throw new Error("Cycle detected in skill dependencies.");
//     }
  
//     return result;
// }

// export function sortSkills(skills: OutputSkill[]): OutputSkill[] {
//     const graph = new Map<string, string[]>();
//     const result: OutputSkill[] = [];
//     const visited = new Set<string>();
  
//     // Build the graph
//     for (const skill of skills) {
//       const skillName = skill.skillName;
//       graph.set(skillName, []);
//     }
  
//     for (const skill of skills) {
//       const skillName = skill.skillName;
//       const dependencies = skill.pathTo.slice(0, -1);
  
//       for (const dependency of dependencies) {
//         graph.get(dependency)!.push(skillName);
//       }
//     }
  
//     // Perform DFS topological sorting
//     function dfs(skillName: string) {
//       if (visited.has(skillName)) {
//         throw new Error("Cycle detected in skill dependencies.");
//       }
  
//       if (!graph.has(skillName)) {
//         return;
//       }
  
//       visited.add(skillName);
  
//       for (const dependent of graph.get(skillName)!) {
//         dfs(dependent);
//       }
  
//       const skill = skills.find((skill) => skill.skillName === skillName)!;
//       result.push(skill);
//     }
  
//     for (const skill of skills) {
//       if (!visited.has(skill.skillName)) {
//         dfs(skill.skillName);
//       }
//     }
  
//     return result.reverse();
// }
  

// export function sortSkills(skills: OutputSkill[]): OutputSkill[] {
//     const graph = new Map<string, string[]>();
//     const result: OutputSkill[] = [];
//     const visited = new Set<string>();
  
//     // Build the graph
//     for (const skill of skills) {
//       const skillName = skill.skillName;
//       graph.set(skillName, []);
  
//       const dependencies = skill.pathTo.slice(0, -1);
//       for (const dependency of dependencies) {
//         if (!graph.has(dependency)) {
//           graph.set(dependency, []);
//         }
//         graph.get(dependency)!.push(skillName);
//       }
//     }
  
//     // Perform DFS topological sorting
//     function dfs(skillName: string) {
//       if (visited.has(skillName)) {
//         throw new Error("Cycle detected in skill dependencies.");
//       }
  
//       if (!graph.has(skillName)) {
//         const skill = skills.find((skill) => skill.skillName === skillName)!;
//         result.push(skill);
//         return;
//       }
  
//       visited.add(skillName);
  
//       for (const dependent of graph.get(skillName)!) {
//         dfs(dependent);
//       }
  
//       const skill = skills.find((skill) => skill.skillName === skillName)!;
//       result.push(skill);
//     }
  
//     for (const skill of skills) {
//       if (!visited.has(skill.skillName)) {
//         dfs(skill.skillName);
//       }
//     }
  
//     return result;
//   }

export function sortSkills(inputSkills: OutputSkill[]): OutputSkill[] {
    const skills = [...inputSkills]; // Clone to avoid mutating the input array
    const graph = new Map<string, string[]>();
    const result: OutputSkill[] = [];
    const inDegree = new Map<string, number>();
  
    // Initialize
    for (const skill of skills) {
      if (!graph.has(skill.skillName)) {
        graph.set(skill.skillName, []);
        inDegree.set(skill.skillName, 0);
      }
    }

    // First pass to ensure all skills and their referenced skills exist
    for (const skill of skills) {
        for (const dep of skill.pathTo) {
            if (!graph.has(dep)) {
              graph.set(dep, []);
              inDegree.set(dep, 0);
              // Add missing skill as a new skill (with default properties or based on some criteria)
              skills.push({ skillName: dep, level: "NEW", pathTo: [] });
            }
        }
    }
  
    // Second pass to build the graph now that we are sure all skills exist
    for (const skill of skills) {
      const dependencies = skill.pathTo;
      for (const dependency of dependencies) {
        graph.get(dependency)?.push(skill.skillName);
        inDegree.set(skill.skillName, (inDegree.get(skill.skillName) || 0) + 1);
      }
    }
  
    // Kahn's Algorithm for Topological Sorting
    const queue: string[] = [];
    for (const [skillName, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(skillName);
      }
    }
  
    while (queue.length > 0) {
      const current = queue.shift();
      const currentSkill = skills.find(skill => skill.skillName === current);
      result.push(currentSkill || { skillName: current!, level: "NEW", pathTo: [] });
  
      const dependents = graph.get(current!) || [];
      for (const dependent of dependents) {
        inDegree.set(dependent, inDegree.get(dependent)! - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      }
    }
  

    console.log(JSON.stringify({result, skills}, null, 2))

    // Cycle detection check
    if (result.length !== skills.length) {
      throw new Error("Cycle detected in skill dependencies.");
    }
  
    return result;
  }