import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatPercent(rate) {
  if (rate === null || rate === undefined) return '0%';
  return `${(rate * 100).toFixed(2)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, 'MMM d');
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    return format(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, 'MMM d, yyyy h:mm a');
  } catch {
    return dateStr;
  }
}
