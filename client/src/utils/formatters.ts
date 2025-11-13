// src/utils/formatters.ts
// Format helpers cho Dashboard

/**
 * Format duration (có thể là string hoặc object với milliseconds)
 */
export function formatDuration(duration: string | object | null | undefined): string {
  if (typeof duration === 'string') {
    return duration;
  }
  if (typeof duration === 'object' && duration !== null) {
    if ('milliseconds' in duration) {
      const ms = (duration as any).milliseconds;
      return `${Math.round(ms / 1000)}s`;
    }
  }
  return String(duration ?? "-");
}

/**
 * Format percentage với null check
 */
export function formatPercent(
  value: number | string | null | undefined, 
  decimals: number = 2
): string {
  if (value === null || value === undefined) {
    return "-";
  }
  const num = Number(value);
  if (isNaN(num)) {
    return "-";
  }
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format date string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "-";
  }
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (isNaN(value)) {
    return "-";
  }
  return value.toLocaleString('en-US');
}

