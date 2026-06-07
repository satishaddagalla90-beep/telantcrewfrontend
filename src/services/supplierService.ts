// Supplier API Service
import { API_ENDPOINTS } from '../utils/api/endpoints';
import { apiCall } from '../utils/api';

/**
 * Generates a new supplier ID with a timestamp-based approach
 * @returns A new supplier ID in the format SUP-YYYYMMDD-HHMMSS-XXX
 */
export const generateNewSupplierId = (): string => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    
    // Take last 3 digits of milliseconds for XXX part
    const xxx = milliseconds.slice(-3);
    
    return `SUP-${year}${month}${day}-${hours}${minutes}${seconds}-${xxx}`;
  } catch (error) {
    console.error('Error generating supplier ID:', error);
    // Ultimate fallback: Simple random ID
    const randomId = Math.floor(100000 + Math.random() * 900000);
    return `SUP-${randomId}`;
  }
};

/**
 * Fetches the last supplier ID from the API (if endpoint exists)
 * @returns Promise containing the last supplier ID or null if not available
 */
export const fetchLastSupplierId = async (): Promise<string | null> => {
  try {
    // Attempt to fetch from API endpoint if it exists
    const response = await apiCall<{ last_supplier_id: string }>(
      '/supplier/last_supplier_id',
      {
        method: 'GET',
      }
    );

    if (response.data) {
      return response.data.last_supplier_id || null;
    }
    
    // If response is not ok, return null to trigger fallback
    return null;
  } catch (error) {
    console.warn('Supplier ID endpoint not available, using fallback generation');
    return null;
  }
};

/**
 * Gets the current supplier ID - tries to fetch from API, falls back to generation
 * @returns Promise containing a supplier ID
 */
export const getCurrentSupplierId = async (): Promise<string> => {
  try {
    // Try to get last supplier ID from API
    const lastSupplierId = await fetchLastSupplierId();
    
    // If we got a valid ID from API, use it
    if (lastSupplierId) {
      return lastSupplierId;
    }
    
    // Otherwise, generate a new ID
    return generateNewSupplierId();
  } catch (error) {
    console.error('Error getting current supplier ID, using fallback:', error);
    return generateNewSupplierId();
  }
};

/**
 * Returns the last supplier ID as-is without incrementing
 * @param lastSupplierId - The last supplier ID
 * @returns The same supplier ID
 */
export const generateNextFromExistingId = (lastSupplierId: string): string => {
  // Simply return the last supplier ID as-is without incrementing
  return lastSupplierId;
};