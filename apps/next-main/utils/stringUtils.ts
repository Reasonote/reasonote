// import emojiRegex from "emoji-regex";

export function jaccardSimilarity(string1: string, string2: string) {
  let set1 = new Set(string1.split(""));
  let set2 = new Set(string2.split(""));

  let intersection = new Set([...set1].filter((i) => set2.has(i)));
  let union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}