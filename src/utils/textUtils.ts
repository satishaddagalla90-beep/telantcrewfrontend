/**
 * Capitalizes the first letter of each word in a string and handles edge cases
 * @param str - The string to capitalize
 * @returns Capitalized string or empty string for invalid inputs
 */
export const capitalizeAndSafe = (str: string | null | undefined | number | any): string => {
  // Convert to string first and handle null/undefined cases
  const stringValue = str == null ? '' : String(str);

  if (!stringValue || stringValue.trim() === '' || stringValue.toLowerCase() === 'n/a') return '';
  return stringValue
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Safe value function that returns a fallback for null/undefined/empty values
 * @param value - The value to check
 * @param fallback - The fallback value to return
 * @returns The original value or fallback
 */
export const safeValue = (value: any, fallback: string = ''): string => {
  if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'n/a' || value === 'null') {
    return fallback;
  }
  return String(value);
};

/**
 * Formats phone numbers with space between country code and number
 * @param phone - The phone number to format
 * @param countryCodes - Array of country code objects with value and label
 * @returns Formatted phone number or original if no match
 */
export const formatPhoneNumber = (phone: string, countryCodes: Array<{ value: string; label: string }> = []): string => {
  if (!phone || phone === '-' || phone === 'N/A') return phone;

  // Try to match against known country codes (sorted by length, longest first)
  const sortedCodes = [...countryCodes].sort((a, b) => b.value.length - a.value.length);
  
  for (const code of sortedCodes) {
    const codeValue = code.value.replace(/^[\+\s]+/, '+'); // Normalize to +XX format
    if (phone.startsWith(codeValue)) {
      const remainingPhone = phone.substring(codeValue.length).trim();
      return `${codeValue} ${remainingPhone}`;
    }
  }

  // Fallback: try to split at 1-3 digit country code (if no match in codes)
  const phoneMatch = phone.match(/^(\+\d{1,3})(.+)$/);
  if (phoneMatch) {
    const countryCode = phoneMatch[1];
    const phoneNumber = phoneMatch[2].trim();
    return `${countryCode} ${phoneNumber}`;
  }

  return phone;
};
