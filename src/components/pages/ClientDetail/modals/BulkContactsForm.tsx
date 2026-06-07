import React, { useState, useEffect } from 'react';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import { ContactFormData, generateDisplayName } from '../helper';

interface BulkContactsFormProps {
  initialData: ContactFormData[];
  onDataChange: (data: ContactFormData[]) => void;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean) => void;
}

export const BulkContactsForm: React.FC<BulkContactsFormProps> = ({
  initialData,
  onDataChange,
  errors = {},
  onValidationChange,
}) => {
  const [contacts, setContacts] = useState<ContactFormData[]>(initialData);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setContacts(initialData);
  }, [initialData]);

  useEffect(() => {
    setLocalErrors(errors);
  }, [errors]);

  useEffect(() => {
    const isValid = Object.keys(localErrors).length === 0;
    onValidationChange?.(isValid);
  }, [localErrors, onValidationChange]);

  const handleContactChange = (index: number, field: keyof ContactFormData, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };

    // Auto-update display name when first name or last name changes
    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      const { firstName, middleName, lastName } = updatedContacts[index];
      updatedContacts[index].displayName = generateDisplayName(
        firstName || '',
        middleName || '',
        lastName || ''
      );
    }

    setContacts(updatedContacts);
    onDataChange(updatedContacts);

    // Clear error for this field
    const errorKey = `${index}_${field}`;
    if (localErrors[errorKey]) {
      const newErrors = { ...localErrors };
      delete newErrors[errorKey];
      setLocalErrors(newErrors);
    }
  };

  const handleAddContact = () => {
    const newContact: ContactFormData = {
      id: Math.random().toString(),
      firstName: '',
      middleName: '',
      lastName: '',
      displayName: '',
      phone: '',
      email: '',
      designation: '',
      division: '',
    };
    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    onDataChange(updatedContacts);
  };

  const handleRemoveContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
    onDataChange(updatedContacts);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div key={contact.id || index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-900 font-semibold">Contact {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveContact(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Icon name="trash" size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EnhancedInputField
                label="First Name"
                value={contact.firstName || ''}
                onChange={(value) => handleContactChange(index, 'firstName', value)}
                placeholder="Enter first name"
                error={localErrors[`${index}_firstName`]}
                required
              />
              <EnhancedInputField
                label="Middle Name"
                value={contact.middleName || ''}
                onChange={(value) => handleContactChange(index, 'middleName', value)}
                placeholder="Enter middle name"
              />
              <EnhancedInputField
                label="Last Name"
                value={contact.lastName || ''}
                onChange={(value) => handleContactChange(index, 'lastName', value)}
                placeholder="Enter last name"
                error={localErrors[`${index}_lastName`]}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInputField
                label="Display Name"
                value={contact.displayName || ''}
                onChange={(value) => handleContactChange(index, 'displayName', value)}
                placeholder="Auto-generated from name"
                disabled
                readOnly
              />
              <EnhancedInputField
                label="Phone"
                value={contact.phone || ''}
                onChange={(value) => handleContactChange(index, 'phone', value)}
                placeholder="Enter phone number"
                error={localErrors[`${index}_phone`]}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EnhancedInputField
                label="Email"
                value={contact.email || ''}
                onChange={(value) => handleContactChange(index, 'email', value)}
                type="email"
                placeholder="Enter email"
                error={localErrors[`${index}_email`]}
                required
              />
              <EnhancedInputField
                label="Designation"
                value={contact.designation || ''}
                onChange={(value) => handleContactChange(index, 'designation', value)}
                placeholder="Enter designation"
                error={localErrors[`${index}_designation`]}
                required
              />
              <EnhancedInputField
                label="Division"
                value={contact.division || ''}
                onChange={(value) => handleContactChange(index, 'division', value)}
                placeholder="Enter division"
                error={localErrors[`${index}_division`]}
                required
              />
            </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={handleAddContact}
        className="w-full"
      >
        <Icon name="plus" size={16} className="mr-2" />
        Add Contact
      </Button>
    </div>
  );
};

export default BulkContactsForm;
