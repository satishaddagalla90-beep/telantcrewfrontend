import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DateInput.css';

export interface DateInputProps {
  /** Label text */
  label?: string;
  /** Current value as string (MM YYYY or DD MM YYYY format) */
  value?: string;
  /** Change handler - receives formatted string */
  onChange?: (value: string) => void;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Mode: 'month' for MM YYYY, 'date' for DD MM YYYY */
  mode?: 'month' | 'date';
  /** Placeholder text */
  placeholder?: string;
  /** Minimum date as string (YYYY-MM-DD format) */
  min?: string;
  /** Maximum date as string (YYYY-MM-DD format) */
  max?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Error state */
  error?: string;
  /** Required field */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DateInput - A cross-browser date picker component that works in Firefox
 * Supports month-only (MM YYYY) and full date (DD MM YYYY) selection
 * Maintains the same output format as native inputs
 */
const DateInput: React.FC<DateInputProps> = ({
  label,
  value = '',
  onChange,
  onBlur,
  mode = 'month',
  placeholder,
  min,
  max,
  disabled = false,
  readOnly = false,
  error,
  required = false,
  className = '',
}) => {
  // Parse input value to Date object
  const parseValue = (val: string): Date | null => {
    if (!val) return null;
    
    if (mode === 'month') {
      // Handle YYYY-MM format (from native month input)
      const [year, month] = val.split('-').map(Number);
      if (year && month) {
        return new Date(year, month - 1, 1);
      }
    } else {
      // Handle DD MM YYYY or YYYY-MM-DD format
      const parts = val.split(/[-\s/]/);
      if (parts.length === 3) {
        // Try YYYY-MM-DD first (ISO format)
        if (parts[0].length === 4) {
          const [year, month, day] = parts.map(Number);
          return new Date(year, month - 1, day);
        }
        // Then DD MM YYYY
        const [day, month, year] = parts.map(Number);
        if (year && month && day) {
          return new Date(year, month - 1, day);
        }
      }
    }
    
    return null;
  };

  // Format Date object to output string
  const formatValue = (date: Date | null): string => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (mode === 'month') {
      // Return YYYY-MM format (matches native month input)
      return `${year}-${month}`;
    } else {
      // Return YYYY-MM-DD format (matches native date input)
      return `${year}-${month}-${day}`;
    }
  };

  const selectedDate = parseValue(value);
  const minDate = min ? parseValue(min) || undefined : undefined;
  const maxDate = max ? parseValue(max) || undefined : undefined;

  const handleChange = (date: Date | null) => {
    const formatted = formatValue(date);
    onChange?.(formatted);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
  };

  // Base input classes matching FormField.tsx
  const inputClasses = `
    w-full px-3 py-2 border rounded-md text-[14.66px] h-[42px]
    focus:outline-none ring-1 ring-transparent focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="w-full">
      <div className="">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        onBlur={handleBlur}
        dateFormat={mode === 'month' ? 'MM/yyyy' : 'dd/MM/yyyy'}
        showMonthYearPicker={mode === 'month'}
        showFullMonthYearPicker={mode === 'month'}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        readOnly={readOnly}
        placeholderText={placeholder}
        className={inputClasses}
        calendarClassName="date-input-calendar"
        required={required}
        autoComplete="off"
      />
      </div>
    </div>
  );
};

export default DateInput;
