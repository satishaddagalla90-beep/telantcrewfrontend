import React from 'react';
import Input, { InputProps } from '../../atoms/Input';
import Label, { LabelProps } from '../../atoms/Label';
import ErrorMessage, { ErrorMessageProps } from '../../atoms/ErrorMessage';

export interface FormFieldProps {
    /** Field label */
    label?: string;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Container class */
    className?: string;
    /** Spacing between elements */
    spacing?: 'sm' | 'md' | 'lg';

    // Input props
    inputProps?: Omit<InputProps, 'variant'>;

    // Label props
    labelProps?: Omit<LabelProps, 'htmlFor' | 'children'>;

    // Error message props
    errorProps?: Omit<ErrorMessageProps, 'message'>;
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    helpText,
    className = '',
    spacing = 'md',
    inputProps = {},
    labelProps = {},
    errorProps = {}
}) => {
    const spacingClasses = {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3'
    };

    const inputId = inputProps.id || `field-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`${spacingClasses[spacing]} ${className} text-start`}>
            {label && (
                <Label
                    htmlFor={inputId}
                    {...labelProps}
                >
                    {label}
                </Label>
            )}

            <Input
                id={inputId}
                variant={error ? 'error' : 'default'}
                {...inputProps}
            />

            {helpText && !error && (
                <p className="text-xs text-gray-500">
                    {helpText}
                </p>
            )}

            <ErrorMessage
                message={error}
                {...errorProps}
            />
        </div>
    );
};

export default FormField;
