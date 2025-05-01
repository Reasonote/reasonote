import {
  type ClassValue,
  clsx,
} from "clsx";
import path from "path";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the directory name two levels up from the current file
export const NEXT_ROOT_DIR = path.join(__dirname, "..", "..");
