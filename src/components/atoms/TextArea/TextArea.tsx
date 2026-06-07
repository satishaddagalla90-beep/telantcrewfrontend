import React, { forwardRef } from 'react';

export interface TextAreaProps {
    /** TextArea value */
    value?: string;
    /** Change handler */
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Required field */
    required?: boolean;
    /** Readonly state */
    readOnly?: boolean;
    /** TextArea name */
    name?: string;
    /** TextArea id */
    id?: string;
    /** Auto focus */
    autoFocus?: boolean;
    /** Max length */
    maxLength?: number;
    /** Min length */
    minLength?: number;
    /** Number of rows */
    rows?: number;
    /** Number of columns */
    cols?: number;
    /** TextArea size */
    size?: 'sm' | 'md' | 'lg';
    /** TextArea variant */
    variant?: 'default' | 'error' | 'success';
    /** Additional CSS classes */
    className?: string;
    /** Blur handler */
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    /** Focus handler */
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    /** Resize behavior */
    resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
    value,
    onChange,
    placeholder,
    disabled = false,
    required = false,
    readOnly = false,
    name,
    id,
    autoFocus = false,
    maxLength,
    minLength,
    rows = 4,
    cols,
    size = 'md',
    variant = 'default',
    className = '',
    onBlur,
    onFocus,
    resize = 'vertical'
}, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let newValue = e.target.value;
        
        // Auto-capitalize first character if there's content
        if (newValue.length > 0) {
            newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
        }
        
        // Update the event target value
        e.target.value = newValue;
        
        onChange?.(e);
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg'
    };

    const variantClasses = {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
    };

    const resizeClasses = {
        none: 'resize-none',
        both: 'resize',
        horizontal: 'resize-x',
        vertical: 'resize-y'
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
    ${resizeClasses[resize]}
    ${className}
  `;

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            readOnly={readOnly}
            name={name}
            id={id}
            autoFocus={autoFocus}
            maxLength={maxLength}
            minLength={minLength}
            rows={rows}
            cols={cols}
            onBlur={onBlur}
            onFocus={onFocus}
            className={baseClasses.trim()}
        />
    );
});

TextArea.displayName = 'TextArea';

export default TextArea;
