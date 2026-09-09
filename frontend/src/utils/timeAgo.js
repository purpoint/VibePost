const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Short relative timestamp for post headers, e.g. "5 min ago".
 * Falls back to an absolute date once a post is more than a few weeks old,
 * where "31 weeks ago" stops being useful.
 */
export function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 45) return 'just now';
  if (seconds < HOUR) return `${Math.round(seconds / MINUTE)} min ago`;
  if (seconds < DAY) {
    const hours = Math.round(seconds / HOUR);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (seconds < WEEK) {
    const days = Math.round(seconds / DAY);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (seconds < 4 * WEEK) {
    const weeks = Math.round(seconds / WEEK);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

/**
 * Full timestamp for the title attribute, so hovering a relative time reveals
 * exactly when a post was made.
 */
export function fullTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}
