// import {sortSubtrees} from "./sortSubtrees"; // Adjust the import path as needed

// // Helper function to compare two arrays of arrays regardless of the order of the inner arrays
// function compareSubtrees(result: string[][], expected: string[][]): boolean {
//   if (result.length !== expected.length) return false;
//   for (let exp of expected) {
//     const expStr = exp.join(',');
//     let matchFound = false;
//     for (let res of result) {
//       if (expStr === res.join(',')) {
//         matchFound = true;
//         break;
//       }
//     }
//     if (!matchFound) return false;
//   }
//   return true;
// }

// describe('sortSubtrees', () => {
//   test('sorts independent subtrees correctly', () => {
//     const paths = [
//       ["B", "C", "D"],
//       ["A", "B"],
//       ["B", "E"],
//       ["Q", "R"]
//     ];
//     const expected = [
//       ["A", "B", "C", "D", "E"], // or ["A", "B", "E", "C", "D"], or any valid topological order
//       ["Q", "R"]
//     ];
//     const result = sortSubtrees(paths);
//     expect(compareSubtrees(result, expected)).toBe(true);
//   });

//   test('handles single-node subtrees correctly', () => {
//     const paths = [
//       ["A"],
//       ["B"]
//     ];
//     const expected = [
//       ["A"],
//       ["B"]
//     ];
//     const result = sortSubtrees(paths);
//     expect(compareSubtrees(result, expected)).toBe(true);
//   });

//   test('handles disconnected paths correctly', () => {
//     const paths = [
//       ["A", "B"],
//       ["C", "D"],
//       ["E", "F"],
//       ["G"]
//     ];
//     const expected = [
//       ["A", "B"],
//       ["C", "D"],
//       ["E", "F"],
//       ["G"]
//     ];
//     const result = sortSubtrees(paths);
//     expect(compareSubtrees(result, expected)).toBe(true);
//   });

//   test('returns an empty array for empty input', () => {
//     const paths: string[][] = [];
//     const expected: string[][] = [];
//     const result = sortSubtrees(paths);
//     expect(compareSubtrees(result, expected)).toBe(true);
//   });

//   test('handles larger and more complex inputs correctly', () => {
//     const paths = [
//       ["A", "B", "C", "D", "E"],
//       ["F", "G", "H"],
//       ["D", "F"],
//     ];
//     const expected = [
//       ["A", "B", "C", "D", "E", "F", "G", "H"],
//     ];
//     const result = sortSubtrees(paths);

//     console.log(result);
//     expect(compareSubtrees(result, expected)).toBe(true);
//   });
// });

export {};
