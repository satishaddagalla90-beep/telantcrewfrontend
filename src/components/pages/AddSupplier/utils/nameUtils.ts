/**
 * Utility functions for handling names in forms
 * Provides consistent display name generation across the application
 */

/**
 * Generates a display name by combining first name, middle name, and last name
 * Filters out empty or whitespace-only values
 * 
 * @param firstName - First name
 * @param middleName - Middle name (optional)
 * @param lastName - Last name (optional)
 * @returns Combined display name string
 * 
 * @example
 * generateDisplayName('John', 'Michael', 'Doe') // 'John Michael Doe'
 * generateDisplayName('John', '', 'Doe') // 'John Doe'
 * generateDisplayName('John', null, 'Doe') // 'John Doe'
 * generateDisplayName('John', undefined, '') // 'John'
 */
export function generateDisplayName(
  firstName: string, 
  middleName?: string | null, 
  lastName?: string | null
): string {
  return [firstName, middleName, lastName]
    .filter(name => name && name.trim())
    .join(' ');
}

/**
 * Checks if any of the name fields have changed that would require updating the display name
 * 
 * @param fieldName - The field that changed
 * @returns boolean indicating if display name should be updated
 */
export function shouldUpdateDisplayName(fieldName: string): boolean {
  return ['firstName', 'middleName', 'lastName'].includes(fieldName);
}

/**
 * Interface for objects that have name fields
 */
export interface NameFields {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  displayName?: string;
}

/**
 * Updates an object with a new display name based on its name fields
 * 
 * @param obj - Object with name fields
 * @returns Updated object with new display name
 */
export function updateDisplayName<T extends NameFields>(obj: T): T {
  return {
    ...obj,
    displayName: generateDisplayName(obj.firstName, obj.middleName, obj.lastName)
  };
}