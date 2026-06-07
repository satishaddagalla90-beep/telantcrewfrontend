import React from 'react';
import EnhancedInputField from '../EnhancedInputField/EnhancedInputField';
import { usePanValidation } from '../../../hooks/usePanValidation';

interface PanFieldWithValidationProps {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, error?: string) => void;
    gridCols?: string;
    required?: boolean;
    disabled?: boolean;
}

export const PanFieldWithValidation: React.FC<PanFieldWithValidationProps> = ({
    value,
    onChange,
    onValidationChange,
    gridCols = "col-span-1",
    required = true,
    disabled = false
}) => {
    const {
        isValidating,
        error,
        isValid,
        handleChange
    } = usePanValidation({
        value,
        onChange,
        onValidationChange
    });

    // Determine input state styling
    const getInputClassName = () => {
        if (isValidating) return 'border-blue-300';
        if (error) return 'border-red-300 bg-red-50';
        if (isValid && value.length === 10) return 'border-green-300 bg-green-50';
        return '';
    };

    return (
        <div className={gridCols}>
            <EnhancedInputField
                label="PAN No"
                value={value}
                onChange={handleChange}
                error={error || undefined}
                required={required}
                loading={isValidating}
                disabled={disabled}
                maxLength={10}
                textTransform="uppercase"
                gridCols=""
                helpText={
                    isValid ? 
                    "✓ Valid PAN number" : 
                    "Format: ABCDE1234F (will be validated automatically)"
                }
                pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
                className={getInputClassName()}
                placeholder="Enter PAN number"
            />
            
            {/* Additional status indicators */}
            {isValidating && (
                <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                    <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full"></div>
                    Checking PAN availability...
                </div>
            )}
            
            {isValid && value.length === 10 && (
                <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    PAN number is valid and available
                </div>
            )}
        </div>
    );
};

export default PanFieldWithValidation;
