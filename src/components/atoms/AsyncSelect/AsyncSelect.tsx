import React, { useState, useEffect, useRef } from 'react';
import Icon from '../Icon';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import AddDropdownOptionModal from '../../molecules/AddDropdownOptionModal/AddDropdownOptionModal';

export interface AsyncSelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

export interface AsyncSelectProps {
  /** Selected value */
  value: AsyncSelectOption | null;
  /** Change handler */
  onChange: (option: AsyncSelectOption | null) => void;
  /** Search input handler */
  onInputChange: (value: string) => void;
  /** Options array */
  options: AsyncSelectOption[];
  /** Loading state */
  isLoading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Allow clearing selection */
  isClearable?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  required?: boolean;
  /** Show add button */
  showAddButton?: boolean;
  /** Dropdown type for adding new options */
  dropdownType?: string;
  /** Label for the dropdown type */
  dropdownLabel?: string;
  /** Context for special cases */
  context?: { [key: string]: any };
  /** Callback when new option is added */
  onOptionAdded?: (newOption: AsyncSelectOption) => void;
  /** Error message */
  error?: string;
  /** Focus handler - called when field is focused */
  onFocus?: () => void;
  /** Called when dropdown menu is scrolled to bottom (for infinite scroll) */
  onMenuScrollToBottom?: () => void;
  /** Dropdown menu placement */
  menuPlacement?: 'auto' | 'bottom' | 'top';
}

const AsyncSelect: React.FC<AsyncSelectProps> = ({
  value,
  onChange,
  onInputChange,
  options,
  isLoading = false,
  placeholder = 'Search...',
  isClearable = true,
  disabled = false,
  className = '',
  size = 'md',
  label,
  required,
  showAddButton = false,
  dropdownType,
  dropdownLabel,
  context,
  onOptionAdded,
  error,
  onFocus,
  onMenuScrollToBottom,
  menuPlacement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOptionAdded = (newOption: {
    id: string;
    value: string;
    label: string;
  }) => {
    const asyncOption: AsyncSelectOption = {
      value: newOption.value,
      label: newOption.label,
    };

    // Auto-select the newly added option
    if (onChange) {
      onChange(asyncOption);
    }

    // Notify parent component
    if (onOptionAdded) {
      onOptionAdded(asyncOption);
    }

    setIsModalOpen(false);
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onInputChange(newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option: AsyncSelectOption) => {
    onChange(option);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchValue('');
    onInputChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

const displayValue = searchValue || (value ? String(value.label || '') : '');

  // Filter options based on search value (local filtering)
  const filteredOptions = searchValue
    ? options.filter(option => {
        // Ensure label is a string before calling toLowerCase()
        const label = typeof option.label === 'string' ? option.label : String(option.label || '');
        return label.toLowerCase().includes(searchValue.toLowerCase());
      })
    : options;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              // Call the onFocus handler if provided to trigger data loading
              if (onFocus) {
                onFocus();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full border rounded-lg
              ${error
                ? 'border border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                : 'border border-gray-300 focus:ring-2 focus:ring-primary-600 focus:border-primary-600'}
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              transition-colors duration-200
              pr-10
              ${sizeClasses[size]}
              ${disabled ? 'bg-gray-50' : 'bg-white'}
            `}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full" />
            )}
            {isClearable && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="close" size={14} />
              </button>
            )}
            <Icon
              name="caret-down"
              size={14}
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div
              className={`absolute ${menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[180px] overflow-y-auto`}
              onScroll={e => {
                const target = e.target as HTMLDivElement;
                if (
                  target.scrollHeight - target.scrollTop === target.clientHeight &&
                  typeof onMenuScrollToBottom === 'function'
                ) {
                  onMenuScrollToBottom();
                }
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={`
                      w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors
                      ${value?.value === option.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
                    `}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  {isLoading ? 'Loading...' : 'No options found'}
                </div>
              )}
            </div>
          )}
        </div>
        {showAddButton && dropdownType && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="flex items-center justify-center w-8 h-[38px] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded border"
            title={`Add new ${dropdownLabel || label || 'option'}`}
          >
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2">
          <ErrorMessage message={error} variant="error" size="sm" />
        </div>
      )}

      {showAddButton && dropdownType && (
        <AddDropdownOptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dropdownType={dropdownType}
          dropdownLabel={dropdownLabel || label || 'Option'}
          context={context}
          onSuccess={handleOptionAdded}
        />
      )}
    </div>
  );
};

export default AsyncSelect;
