/**
 * Example usage and tests for the name utilities
 * This file demonstrates how to use the name utility functions
 */

import { generateDisplayName, shouldUpdateDisplayName, updateDisplayName, NameFields } from './nameUtils';

// Example usage in a form component
export function exampleUsage() {
  // Basic display name generation
  console.log(generateDisplayName('John', 'Michael', 'Doe')); // 'John Michael Doe'
  console.log(generateDisplayName('John', '', 'Doe')); // 'John Doe'
  console.log(generateDisplayName('John', null, 'Doe')); // 'John Doe'
  console.log(generateDisplayName('John', undefined, '')); // 'John'
  console.log(generateDisplayName('', '', '')); // ''

  // Check if field changes should trigger display name update
  console.log(shouldUpdateDisplayName('firstName')); // true
  console.log(shouldUpdateDisplayName('middleName')); // true
  console.log(shouldUpdateDisplayName('lastName')); // true
  console.log(shouldUpdateDisplayName('email')); // false
  console.log(shouldUpdateDisplayName('phone')); // false

  // Update an object with display name
  const contact: NameFields = {
    firstName: 'Jane',
    middleName: 'Elizabeth',
    lastName: 'Smith',
    displayName: 'Old Name'
  };

  const updatedContact = updateDisplayName(contact);
  console.log(updatedContact.displayName); // 'Jane Elizabeth Smith'
}

// Example of how this would be used in a form component
export function handleFormFieldChange(
  formData: any, 
  fieldName: string, 
  value: any, 
  contactIndex?: number
) {
  // Clone the form data
  const updated = { ...formData };

  if (contactIndex !== undefined) {
    // Updating a contact field
    const contacts = [...updated.contacts];
    contacts[contactIndex] = { ...contacts[contactIndex], [fieldName]: value };

    // Auto-update display name if it's a name field
    if (shouldUpdateDisplayName(fieldName)) {
      const contact = contacts[contactIndex];
      contact.displayName = generateDisplayName(
        contact.firstName,
        contact.middleName,
        contact.lastName
      );
    }

    updated.contacts = contacts;
  } else {
    // Updating a top-level field
    updated[fieldName] = value;
  }

  return updated;
}