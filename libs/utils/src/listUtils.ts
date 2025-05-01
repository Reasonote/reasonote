/**
* Returns true if list1 is a prefix of list2.
* @param list1 The supposed prefix
* @param list2 The list to check.
* @returns True if list1 is a prefix of list2.
*/
export function listIsPrefixOf<T>(list1: T[], list2: T[]): boolean {
 if (list1.length > list2.length){
   return false;
 }
 else {
   return list1.every((val, i) => val === list2[i]);
 }
}