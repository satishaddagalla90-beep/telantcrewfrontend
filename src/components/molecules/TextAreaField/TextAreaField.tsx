import React from 'react';
import FormField from '../FormField/FormField';
import TextArea from '../../atoms/TextArea/TextArea';
import Label from '../../atoms/Label/Label';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';

export interface TextAreaFieldProps {
    /** Field label */
    label?: string;
    /** Field value */
    value?: string;
    /** Change handler */
    onChange?: (value: string) => void;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Required field */
    required?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Number of rows */
    rows?: number;
    /** Max length */
    maxLength?: number;
    /** Show character count */
    showCharacterCount?: boolean;
    /** Container class */
    className?: string;
    /** Spacing between elements */
    spacing?: 'sm' | 'md' | 'lg';
    /** Field name */
    name?: string;
    /** Field id */
    id?: string;
    /** Field size */
    size?: 'sm' | 'md' | 'lg';
    /** Grid column classes (for responsive layouts) */
    gridCols?: string;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
    label,
    value = '',
    onChange,
    error,
    helpText,
    required = false,
    disabled = false,
    placeholder,
    rows = 4,
    maxLength,
    showCharacterCount = false,
    className = '',
    spacing = 'md',
    name,
    id,
    size = 'md',
    gridCols = 'col-span-12' // Default to full width
}) => {
    const spacingClasses = {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3'
    };

    const inputId = id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const isOverLimit = maxLength ? value.length >= maxLength : false;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e.target.value);
    };

    return (
        <div className={`${gridCols} ${spacingClasses[spacing]} ${className}`}>
            {label && (
                <Label
                    htmlFor={inputId}
                    required={required}
                    disabled={disabled}
                    size={size === 'lg' ? 'base' : 'sm'}
                >
                    {label}
                </Label>
            )}

            <TextArea
                id={inputId}
                name={name}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                variant={error ? 'error' : 'default'}
                size={size}
            />

            <div className="flex justify-between items-start">
                <div className="flex-1">
                    {helpText && !error && (
                        <p className="text-xs text-gray-500">
                            {helpText}
                        </p>
                    )}
                    <ErrorMessage message={error} />
                </div>

                {showCharacterCount && maxLength && (
                    <div className="flex-shrink-0 ml-4">
                        <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                            {value.length}/{maxLength} characters
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextAreaField;
