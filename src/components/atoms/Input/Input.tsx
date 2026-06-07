import React, { forwardRef } from 'react';

export interface InputProps {
  /** Input type */
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'month';
  /** Input value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  max?: string;
  min?: string;
  /** Readonly state */
  readOnly?: boolean;
  /** Input name */
  name?: string;
  /** Input id */
  id?: string;
  /** Auto complete */
  autoComplete?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** Max length */
  maxLength?: number;
  /** Min length */
  minLength?: number;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Input variant */
  variant?: 'default' | 'error' | 'success';
  /** Additional CSS classes */
  className?: string;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Key down handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Wheel handler */
  onWheel?: (e: React.WheelEvent<HTMLInputElement>) => void;
  /** Input label */
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      value,
      onChange,
      placeholder,
      disabled = false,
      required = false,
      readOnly = false,
      max,
      min,
      name,
      id,
      autoComplete,
      autoFocus = false,
      maxLength,
      minLength,
      size = 'md',
      variant = 'default',
      className = '',
      onBlur,
      onFocus,
      onKeyDown,
      onWheel,
      label,
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const variantClasses = {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
    };

    const baseClasses = `
    w-full
    border
    rounded-md
    shadow-sm
    transition-colors
    focus:outline-none
    focus:ring-2
    focus:ring-opacity-50
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
    ${readOnly ? 'bg-gray-50 cursor-default' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

    return (
      <div>
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          name={name}
          id={id}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          max={max}
          min={min}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onWheel={onWheel}
          className={baseClasses.trim()}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
