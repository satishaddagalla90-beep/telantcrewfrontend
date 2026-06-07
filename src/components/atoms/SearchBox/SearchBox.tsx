import React from 'react';
import Icon from '../Icon';

export interface SearchBoxProps {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Show clear button */
  showClearButton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Input name attribute */
  name?: string;
  /** Input ID */
  id?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  size = 'md',
  disabled = false,
  showClearButton = true,
  className = '',
  name,
  id,
}) => {
  const sizeClasses = {
    sm: 'pl-8 pr-8 py-1.5 text-sm',
    md: 'pl-9 pr-10 py-2 text-base',
    lg: 'pl-10 pr-11 py-3 text-lg',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const iconPositions = {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-3.5',
  };

  const clearPositions = {
    sm: 'right-2',
    md: 'right-2.5',
    lg: 'right-3',
  };

  const handleClear = () => {
    if (!disabled) {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <Icon
        name="search"
        size={iconSizes[size]}
        className={`absolute ${iconPositions[size]} top-1/2 transform -translate-y-1/2 text-gray-400`}
      />

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        id={id}
        className={`
                    w-full border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-primary-600 focus:border-primary-600
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                    transition-colors duration-200
                    ${sizeClasses[size]}
                    ${disabled ? 'bg-gray-50' : 'bg-white'}
                `}
      />

      {/* Clear Button */}
      {showClearButton && value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={`
                        absolute ${clearPositions[size]} top-1/2 transform -translate-y-1/2
                        text-gray-400 hover:text-gray-600
                        transition-colors duration-200
                        focus:outline-none focus:text-gray-600
                    `}
          aria-label="Clear search"
        >
          <Icon name="close" size={iconSizes[size]} />
        </button>
      )}
    </div>
  );
};

export default SearchBox;