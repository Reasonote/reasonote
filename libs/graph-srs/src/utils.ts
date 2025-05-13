export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export function msToDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}

export function msToHours(ms: number): number {
  return ms / (60 * 60 * 1000);
}

export function msToMinutes(ms: number): number {
  return ms / (60 * 1000);
}

export function msToSeconds(ms: number): number {
  return ms / 1000;
}