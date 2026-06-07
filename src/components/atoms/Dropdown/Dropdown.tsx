import React from 'react';
import Icon from '../Icon';
import { DropdownOption } from '../../../types';

export interface DropdownProps {
  /** Array of options */
  options: DropdownOption[];
  /** Selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Select name attribute */
  name?: string;
  /** Select ID */
  id?: string;
  /** Show dropdown arrow */
  showArrow?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Label text */
  label?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Download',
  size = 'md',
  disabled = false,
  className = '',
  name,
  id,
  showArrow = true,
  fullWidth = false,
  label,
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const baseClasses = `
        appearance-none border border-gray-300 rounded-lg
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        transition-colors duration-200
        ${disabled ? 'bg-gray-50' : 'bg-white'}
        ${fullWidth ? 'w-full' : ''}
        ${showArrow ? 'pr-10' : ''}
        ${sizeClasses[size]}
        ${className}
    `
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          name={name}
          id={id}
          className={baseClasses}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {showArrow && (
          <Icon
            name="caret-down"
            size={iconSizes[size]}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
};

export default Dropdown;
