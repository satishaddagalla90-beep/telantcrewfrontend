import React from 'react';
import AsyncSelect from '../../atoms/AsyncSelect/AsyncSelect';
import Dropdown from '../../atoms/Dropdown/Dropdown';
import { EnhancedInputFieldProps } from '../EnhancedInputField/EnhancedInputField';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectFieldProps extends Omit<EnhancedInputFieldProps, 'value' | 'onChange' | 'type'> {
    /** Field value - can be single value or array for multi-select */
    value: string | string[] | SelectOption | SelectOption[] | null;
    /** Change handler */
    onChange: (value: any) => void;
    /** Options array (for static select) */
    options?: SelectOption[];
    /** Load options function (for async select) */
    loadOptions?: (inputValue: string, callback: (options: SelectOption[]) => void) => void;
    /** Is multi-select */
    isMulti?: boolean;
    /** Is creatable (allows creating new options) */
    isCreatable?: boolean;
    /** Is searchable */
    isSearchable?: boolean;
    /** Is async (loads options dynamically) */
    isAsync?: boolean;
    /** Is clearable */
    isClearable?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Loading state */
    isLoading?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Full width */
    fullWidth?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
    label,
    value,
    onChange,
    options = [],
    loadOptions,
    isMulti = false,
    isCreatable = false,
    isSearchable = true,
    isAsync = false,
    isClearable = true,
    placeholder = 'Select...',
    isLoading = false,
    required = false,
    disabled = false,
    error,
    helpText,
    size = 'md',
    fullWidth = true,
    className = '',
    ...props
}) => {
    const handleChange = (newValue: any) => {
        // Extract value from option object if it's an object
        if (newValue && typeof newValue === 'object' && 'value' in newValue) {
            onChange(newValue.value);
        } else {
            onChange(newValue);
        }
    };

    const handleAsyncInputChange = (inputValue: string) => {
        if (loadOptions) {
            loadOptions(inputValue, () => { });
        }
    };

    // Convert value to format expected by AsyncSelect
    const getAsyncSelectValue = () => {
        if (!value) return null;
        if (typeof value === 'string') {
            const option = options.find(opt => opt.value === value);
            return option || { value, label: value };
        }
        if (typeof value === 'object' && 'value' in value) {
            return value as SelectOption;
        }
        return null;
    };

    // Convert value to format expected by Dropdown
    const getDropdownValue = () => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && 'value' in value) {
            return (value as SelectOption).value;
        }
        return '';
    };

    const renderField = () => {
        if (isAsync || isSearchable) {
            return (
                <AsyncSelect
                    value={getAsyncSelectValue()}
                    onChange={handleChange}
                    onInputChange={handleAsyncInputChange}
                    options={options}
                    isLoading={isLoading}
                    placeholder={placeholder}
                    isClearable={isClearable}
                    disabled={disabled}
                    size={size}
                    className={fullWidth ? 'w-full' : ''}
                />
            );
        }

        return (
            <Dropdown
                value={getDropdownValue()}
                onChange={handleChange}
                options={options}
                placeholder={placeholder}
                size={size}
                disabled={disabled}
                fullWidth={fullWidth}
            />
        );
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {renderField()}
            </div>

            {helpText && !error && (
                <p className="text-sm text-gray-500">{helpText}</p>
            )}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default SelectField;
