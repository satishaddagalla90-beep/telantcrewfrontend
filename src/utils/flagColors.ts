/**
 * Flag color utilities for consistent flag color mapping across the application
 */

import { dropdownAPI } from './api/dropdowns';

// Color palette used for dynamic flag color assignment
const FLAG_COLOR_PALETTE = [
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

// Default color map for common flag names
const DEFAULT_COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  green: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  yellow: '#f59e0b',
  orange: '#f97316',
  purple: '#8b5cf6',
  violet: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  gray: '#9CA3AF',
  grey: '#9CA3AF',
  black: '#000000',
  white: '#ffffff',
  brown: '#92400e',
};

/**
 * Derive color from flag name by checking for color keywords
 */
export const deriveColorFromName = (name?: string): string | undefined => {
  if (!name) return undefined;

  const trimmed = name.trim();

  // If name is already a hex code
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();

  // Direct match
  if (DEFAULT_COLOR_MAP[lower]) return DEFAULT_COLOR_MAP[lower];

  // Try to extract color word from compound names e.g., 'Flag - Red' or 'Red Flag'
  const parts = lower.split(/[^a-zA-Z]+/).filter(Boolean);
  for (const part of parts) {
    if (DEFAULT_COLOR_MAP[part]) return DEFAULT_COLOR_MAP[part];
  }

  return undefined;
};

/**
 * Simple color mapping for cases where no backend metadata is available
 * (Used in DetailHeader and other simple flag displays)
 */
export const getSimpleFlagColor = (flagName?: string): string => {
  if (!flagName) return '#9CA3AF'; // Default gray

  const derivedColor = deriveColorFromName(flagName);
  return derivedColor || '#ef4444'; // Default to red if no match found
};

/**
 * Fetch flag metadata from backend and create comprehensive color map
 * (Used in Applicants list and other components that need full flag metadata)
 */
export const createFlagColorMap = async (): Promise<Record<string, string>> => {
  try {
    // fetchCandidateDropdown returns [{ id, value, label }]
    const options = await dropdownAPI.fetchCandidateDropdown('Flags');
    if (!options) return {};

    const map: Record<string, string> = {};

    options.forEach((opt, idx) => {
      // Prefer backend-provided color if present
      let optColor = (opt as any).color as string | undefined;

      // Next, try to derive a color from the label/value if it contains a color word
      if (!optColor) {
        optColor =
          deriveColorFromName(opt.label) ||
          deriveColorFromName((opt as any).value);
      }

      // Fallback to palette
      if (!optColor) {
        optColor = FLAG_COLOR_PALETTE[idx % FLAG_COLOR_PALETTE.length];
      }

      // Include multiple possible keys: id, value, label - backend or candidate may use any
      if (opt.id) map[opt.id] = optColor;
      if ((opt as any).value) map[(opt as any).value] = optColor;
      if (opt.label) map[opt.label] = optColor;
    });

    return map;
  } catch (err) {
    console.error('Failed to fetch flags metadata:', err);
    return {};
  }
};

/**
 * Get flag color from a pre-built color map (for use with createFlagColorMap)
 */
export const getFlagColorFromMap = (
  flagName?: string,
  colorMap: Record<string, string> = {}
): string => {
  if (!flagName) return '#9CA3AF'; // Default gray

  return colorMap[flagName] || '#9CA3AF'; // Fallback gray
};
