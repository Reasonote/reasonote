import { DateTime } from "luxon";

export function formatTimeAgo(dateStr: string): string {
  const dt = DateTime.fromISO(dateStr);
  const diff = dt.diffNow().negate();

  if (diff.as('seconds') < 60) {
    return 'Just now';
  } else if (diff.as('minutes') < 60) {
    const mins = Math.floor(diff.as('minutes'));
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diff.as('hours') < 24) {
    const hrs = Math.floor(diff.as('hours'));
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  } else if (diff.as('days') < 7) {
    const days = Math.floor(diff.as('days'));
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (diff.as('weeks') < 4) {
    const weeks = Math.floor(diff.as('weeks'));
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diff.as('months') < 12) {
    const months = Math.floor(diff.as('months'));
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diff.as('years'));
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
} 