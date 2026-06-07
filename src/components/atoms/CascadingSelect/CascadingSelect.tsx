import React, { useState } from 'react';
import Select from 'react-select';
import { DropdownOption } from '../../../types';
import Icon from '../Icon/Icon';
import AddDropdownOptionModal from '../../molecules/AddDropdownOptionModal/AddDropdownOptionModal';

interface CascadingSelectOption {
  id: string;
  value: string; // Will store the ID
  label: string; // Will display the name
}

interface CascadingSelectProps {
  label: string;
  value: string; // The selected ID
  onChange: (id: string) => void; // Returns the ID
  options: any[]; // Raw API options with id, name fields
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showAddButton?: boolean;
  dropdownType?: string;
  dropdownLabel?: string;
  context?: { [key: string]: any };
  onOptionAdded?: (newOption: CascadingSelectOption) => void;
}

const CascadingSelect: React.FC<CascadingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  isLoading = false,
  error = null,
  placeholder,
  disabled = false,
  required = false,
  showAddButton = false,
  dropdownType,
  dropdownLabel,
  context,
  onOptionAdded,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transform raw API options to select options
  const selectOptions: CascadingSelectOption[] = options.map((option: any) => ({
    id: option.id,
    value: option.id, // Store ID as value
    label: option.label || option.name, // Display name as label
  }));

  // Find the selected option by ID
  const selectedOption = selectOptions.find(opt => opt.value === value) || null;

  const handleOptionAdded = (newOption: {
    id: string;
    value: string;
    label: string;
  }) => {
    const cascadingOption: CascadingSelectOption = {
      id: newOption.id,
      value: newOption.id, // Store ID as value
      label: newOption.label,
    };

    // Auto-select the newly added option directly (like AsyncSelect)
    onChange(newOption.id);

    // Notify parent component to refresh options
    if (onOptionAdded) {
      onOptionAdded(cascadingOption);
    }

    setIsModalOpen(false);
  };

  const handleChange = (selectedOption: CascadingSelectOption | null) => {
    // Always return the ID (stored in value)
    onChange(selectedOption ? selectedOption.value : '');
  };

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-sm text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={selectedOption}
            onChange={handleChange}
            options={selectOptions}
            isLoading={isLoading}
            isDisabled={disabled}
            isClearable={true}
            isSearchable={true}
            placeholder={placeholder || `Select ${label.toLowerCase()}`}
            classNamePrefix="react-select"
            noOptionsMessage={() => {
              if (isLoading) return 'Loading...';
              return `No ${label.toLowerCase()} found`;
            }}
            styles={{
              control: base => ({
                ...base,
                minHeight: '38px',
                borderColor: error ? '#ef4444' : base.borderColor,
                '&:hover': {
                  borderColor: error ? '#ef4444' : '#d1d5db',
                },
              }),
            }}
          />
        </div>
        {showAddButton && dropdownType && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="flex items-center justify-center w-8 h-[38px] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded border"
            title={`Add new ${dropdownLabel || label.toLowerCase()}`}
          >
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}

      {showAddButton && dropdownType && (
        <AddDropdownOptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dropdownType={dropdownType}
          dropdownLabel={dropdownLabel || label}
          context={context}
          onSuccess={handleOptionAdded}
        />
      )}
    </div>
  );
};

export default CascadingSelect;
