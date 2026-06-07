export type DateInput = Date | string | number | null | undefined;

const uiDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const toValidDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatUIDate = (value: DateInput, fallback = 'N/A'): string => {
  const date = toValidDate(value);
  if (!date) return fallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const formatUIDateTime = (
  value: DateInput,
  fallback = 'N/A'
): string => {
  const date = toValidDate(value);
  if (!date) return fallback;
  return `${formatUIDate(date, fallback)} ${uiDateTimeFormatter.format(date)}`;
};

/**
 * Formats a date string specifically for Month Year display (e.g. "Mar 2025")
 * Handles formats like MM/YYYY, YYYY-MM, and standard ISO dates.
 */
export const formatMonthYear = (value: string | null | undefined, fallback = 'N/A'): string => {
  if (!value || value === 'Unknown' || value.trim() === '') return fallback;

  let date: Date | null = null;

  // Handle MM/YYYY format
  const mmYyyyMatch = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    const month = parseInt(mmYyyyMatch[1], 10) - 1;
    const year = parseInt(mmYyyyMatch[2], 10);
    date = new Date(year, month, 1);
  }

  // Handle YYYY-MM format
  const yyyyMmMatch = value.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMmMatch) {
    const year = parseInt(yyyyMmMatch[1], 10);
    const month = parseInt(yyyyMmMatch[2], 10) - 1;
    date = new Date(year, month, 1);
  }

  // Fallback to native parsing if not already parsed
  if (!date || isNaN(date.getTime())) {
    date = new Date(value);
  }

  if (!date || isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};
