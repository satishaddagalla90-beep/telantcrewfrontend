import React, { useState, useEffect } from 'react';
import SearchDropdown from '../../../molecules/SearchDropdown';
import { OwnershipFormData } from '../helper';

interface OwnershipFormProps {
  initialData: OwnershipFormData;
  onDataChange: (data: OwnershipFormData) => void;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean) => void;
}

// Mock ownership options - in real app, fetch from API
const ownershipOptions = [
  { value: 'Sona Shabnam', label: 'Sona Shabnam' },
  { value: 'John Doe', label: 'John Doe' },
  { value: 'Jane Smith', label: 'Jane Smith' },
  { value: 'Michael Johnson', label: 'Michael Johnson' },
  { value: 'Emily Davis', label: 'Emily Davis' },
];

export const OwnershipForm: React.FC<OwnershipFormProps> = ({
  initialData,
  onDataChange,
  errors = {},
  onValidationChange,
}) => {
  const [data, setData] = useState<OwnershipFormData>(initialData);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setLocalErrors(errors);
  }, [errors]);

  useEffect(() => {
    const isValid = Object.keys(localErrors).length === 0;
    onValidationChange?.(isValid);
  }, [localErrors, onValidationChange]);

  const handleChange = (value: any) => {
    const updatedData = { ownership: value };
    setData(updatedData);
    onDataChange(updatedData);

    // Clear error
    if (localErrors.ownership) {
      const newErrors = { ...localErrors };
      delete newErrors.ownership;
      setLocalErrors(newErrors);
    }
  };

  return (
    <div className="p-6">
      <SearchDropdown
        label="Client Ownership"
        value={data.ownership}
        onChange={handleChange}
        options={ownershipOptions}
        placeholder="Select Client Owners"
        required
        isMulti
        isSearchable
        isClearable
        error={localErrors.ownership}
      />
      <p className="mt-2 text-sm text-gray-500">
        Select one or more people responsible for this client
      </p>
    </div>
  );
};

export default OwnershipForm;
