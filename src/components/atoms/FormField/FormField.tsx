import React from 'react';
import Label from '../Label/Label';
import ErrorMessage from '../ErrorMessage/ErrorMessage';

export interface FormFieldProps {
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'url'
    | 'number'
    | 'search'
    | 'date'
    | 'datetime-local';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  min,
  max,
  step,
  className = 'col-span-1',
  disabled,
}) => {
  return (
    <div className={className}>
      <div className="space-y-2">
        <Label required={required} size="sm">
          {label}
        </Label>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          disabled={disabled}
          max={max}
          step={step}
          className={`w-full px-3 py-2 border rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                    ${type === 'date' || type === 'datetime-local' ? 'text-[14.66px]' : 'text-base'}
                    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                `}
        />
        {error && <ErrorMessage message={error} variant="error" size="sm" />}
      </div>
    </div>
  );
};

export default FormField;
