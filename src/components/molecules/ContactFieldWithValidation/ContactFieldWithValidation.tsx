import React, { useCallback } from 'react';
import EnhancedInputField from '../EnhancedInputField/EnhancedInputField';
import { useContactValidation } from '../../../hooks/useContactValidation';
import { FormatUtils } from '../CommonFormFields/CommonFormFields';

interface ContactFieldWithValidationProps {
    value: string;
    type: 'email' | 'phone';
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, error?: string) => void;
    gridCols?: string;
    required?: boolean;
    disabled?: boolean;
    label?: string;
    excludeId?: string;
}

export const ContactFieldWithValidation: React.FC<ContactFieldWithValidationProps> = ({
    value,
    type,
    onChange,
    onValidationChange,
    gridCols = "col-span-1",
    required = true,
    disabled = false,
    label,
    excludeId
}) => {
    const {
        isValidating,
        error,
        isValid,
        handleChange
    } = useContactValidation({
        value,
        type,
        onChange,
        onValidationChange,
        excludeId
    });

    // Wrapper for handle change to include formatting for phone
    const onInputChange = useCallback((val: string) => {
        if (type === 'phone') {
            handleChange(FormatUtils.phoneNumber(val));
        } else {
            handleChange(val);
        }
    }, [handleChange, type]);

    const getInputClassName = () => {
        if (isValidating) return 'border-blue-300';
        if (error) return 'border-red-300 bg-red-50';
        if (isValid) return 'border-green-300 bg-green-50';
        return '';
    };

    const getHelpText = () => {
        if (isValid) return `✓ Valid ${type === 'email' ? 'email' : 'phone number'}`;
        if (type === 'email') return "Format: example@domain.com";
        return "10-digit mobile number";
    };

    return (
        <div className={gridCols}>
            <EnhancedInputField
                label={label || (type === 'email' ? "Email ID" : "Phone No")}
                value={value}
                onChange={onInputChange}
                error={error || undefined}
                required={required}
                loading={isValidating}
                disabled={disabled}
                type={type === 'email' ? 'email' : 'tel'}
                maxLength={type === 'phone' ? 10 : undefined}
                textTransform={type === 'email' ? 'lowercase' : 'none'}
                gridCols=""
                helpText={getHelpText()}
                className={getInputClassName()}
                placeholder={type === 'email' ? "Enter email address" : "Enter phone number"}
            />

            {isValidating && (
                <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                    <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full"></div>
                    {`Checking ${type} availability...`}
                </div>
            )}

            {isValid && (
                <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    {`${type === 'email' ? 'Email' : 'Phone'} is available`}
                </div>
            )}
        </div>
    );
};

export default ContactFieldWithValidation;
