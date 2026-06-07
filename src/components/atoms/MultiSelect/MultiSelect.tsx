import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  required?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className = '',
  size = 'md',
  label,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemoveValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getSelectedLabels = () => {
    return options
      .filter((opt) => value.includes(opt.value))
      .map((opt) => opt.label);
  };

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-3 px-4',
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div ref={containerRef} className="relative">
        <div
          onClick={handleToggle}
          className={`
            w-full border rounded-md bg-white cursor-pointer
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-500'}
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
            ${sizeClasses[size]}
            transition-all duration-200
          `}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex flex-wrap gap-1 min-h-[20px]">
              {value.length === 0 ? (
                <span className="text-gray-400">{placeholder}</span>
              ) : (
                getSelectedLabels().map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    {label}
                    <button
                      onClick={(e) => handleRemoveValue(value[index], e)}
                      className="hover:text-blue-900"
                      disabled={disabled}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {value.length > 0 && !disabled && (
                <button
                  onClick={handleClearAll}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
              <Icon
                name={isOpen ? 'caret-up' : 'caret-down'}
                size={16}
                className="text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleOptionToggle(option.value)}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center justify-between
                      ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
                      transition-colors duration-150
                    `}
                  >
                    <span className="text-sm">{option.label}</span>
                    {isSelected && (
                      <Icon name="check" size={16} className="text-blue-600" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
