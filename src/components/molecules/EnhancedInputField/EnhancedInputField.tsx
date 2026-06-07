import React from 'react';
import Input from '../../atoms/Input/Input';
import Label from '../../atoms/Label/Label';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';
import SelectField from '../SelectField/SelectField';
import CreatableAsyncSelect from '../CreatableAsyncSelect/CreatableAsyncSelect';
import type { SelectOption } from '../SelectField/SelectField';
import type { CreatableOption } from '../CreatableAsyncSelect/CreatableAsyncSelect';

export interface EnhancedInputFieldProps {
    /** Field label */
    label?: string;
    /** Field value */
    value?: any;
    /** Change handler */
    onChange?: (value: any) => void;
    /** Blur handler (for input types) */
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Required field */
    required?: boolean;
        /** Maximum value (for date/number inputs) */
    max?: string;
    /** Minimum value (for date/number inputs) */
    min?: string;

    /** Disabled state */
    disabled?: boolean;
    /** Readonly state */
    readOnly?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'month' | 'select' | 'async-select' | 'creatable-select';
    /** Max length */
    maxLength?: number;
    /** Min length */
    minLength?: number;
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
    
    /** Auto complete */
    autoComplete?: string;
    /** Pattern for validation */
    pattern?: string;
    /** Input mode */
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    /** Custom validation function */
    validate?: (value: string) => string | null;
    /** Format display value (e.g., for numbers with commas) */
    formatValue?: (value: string) => string;
    /** Parse input value (e.g., remove commas from numbers) */
    parseValue?: (value: string) => string;
    /** Show loading spinner */
    loading?: boolean;
    /** Text transform */
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    /** Character limit warning threshold (0-1) */
    warningThreshold?: number;

    // Dropdown/Select specific props
    /** Options for select/dropdown */
    options?: SelectOption[];
    /** Load options function for async select */
    loadOptions?: (inputValue: string, callback: (options: SelectOption[]) => void) => void;
    /** Create option function for creatable select */
    onCreateOption?: (inputValue: string) => Promise<CreatableOption>;
    /** Is multi-select */
    isMulti?: boolean;
    /** Is clearable */
    isClearable?: boolean;
    /** Is searchable (for selects) */
    isSearchable?: boolean;
    /** Key down handler */
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const EnhancedInputField: React.FC<EnhancedInputFieldProps> = ({
    label,
    value = '',
    onChange,
    error,
    helpText,
    required = false,
    max, // Add this line
    min, // Add this line
    disabled = false,
    readOnly = false,
    placeholder,
    type = 'text',
    maxLength,
    minLength,
    className = '',
    spacing = 'md',
    name,
    id,
    size = 'md',
    gridCols = 'col-span-1', // Default to 1/4 width
    autoComplete,
    pattern,
    inputMode,
    validate,
    formatValue,
    parseValue,
    loading = false,
    textTransform = 'none',
    warningThreshold = 0.8,
    // Dropdown props
    options = [],
    loadOptions,
    onCreateOption,
    isMulti = false,
    isClearable = true,
    isSearchable = true,
    onBlur,
    onKeyDown
}) => {
    const spacingClasses = {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3'
    };

    const transformClasses = {
        none: '',
        uppercase: 'uppercase',
        lowercase: 'lowercase',
        capitalize: 'capitalize'
    };

    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Display value (formatted if formatter provided)
    const displayValue = formatValue ? formatValue(value) : value;

    // Character limit warnings
    const isNearLimit = maxLength && value.length >= maxLength * warningThreshold;
    const isOverLimit = maxLength && value.length >= maxLength;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        // Apply text transform
        if (textTransform === 'uppercase') {
            newValue = newValue.toUpperCase();
        } else if (textTransform === 'lowercase') {
            newValue = newValue.toLowerCase();
        } else if (textTransform === 'none' && type === 'text' && newValue.length > 0) {
            // Auto-capitalize first character for text inputs when no specific transform is set
            newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
        }

        // Parse value if parser provided
        if (parseValue) {
            newValue = parseValue(newValue);
        }

        onChange?.(newValue);
    };

    const customError = validate ? validate(value) : null;
    const finalError = error || customError;

    const renderInputField = () => {
        // Handle different field types
        switch (type) {
            case 'select':
                return (
                    <SelectField
                        value={value}
                        onChange={onChange || (() => { })}
                        options={options}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                        size={size}
                        isClearable={isClearable}
                        isSearchable={isSearchable}
                        fullWidth
                    />
                );

            case 'async-select':
                return (
                    <SelectField
                        value={value}
                        onChange={onChange || (() => { })}
                        loadOptions={loadOptions}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                        size={size}
                        isAsync
                        isClearable={isClearable}
                        isSearchable={isSearchable}
                        isLoading={loading}
                        fullWidth
                    />
                );

            case 'creatable-select':
                return (
                    <CreatableAsyncSelect
                        value={value}
                        onChange={onChange || (() => { })}
                        loadOptions={loadOptions}
                        onCreateOption={onCreateOption}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                        size={size}
                        isMulti={isMulti}
                        isClearable={isClearable}
                        isLoading={loading}
                    />
                );

            default:
                return (
                    <Input
                        id={inputId}
                        name={name}
                        type={type as 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'month'}
                        value={displayValue}
                        onChange={handleChange}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled || loading}
                        readOnly={readOnly}
                        maxLength={maxLength}
                        minLength={minLength}
                        max={max}
                        min={min}
                        autoComplete={autoComplete}
                        variant={finalError ? 'error' : 'default'}
                        size={size}
                        className={`${transformClasses[textTransform]} ${loading ? 'pr-8' : ''}`}
                    />
                );
        }
    };

    return (
        <div className={`${gridCols} ${spacingClasses[spacing]} ${className}`}>
            {label && (
                <Label
                    htmlFor={inputId}
                    required={required}
                    size={size === 'lg' ? 'base' : 'sm'}
                >
                    {label}
                </Label>
            )}

            <div className="relative">
                {renderInputField()}

                {loading && type !== 'select' && type !== 'async-select' && type !== 'creatable-select' && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-start">
                <div className="flex-1">
                    {helpText && !finalError && (
                        <p className="text-xs text-gray-500">
                            {helpText}
                        </p>
                    )}
                    <ErrorMessage message={finalError || undefined} />
                </div>

                {maxLength && (
                    <div className="flex-shrink-0 ml-4">
                        <span className={`text-xs ${isOverLimit ? 'text-red-500' :
                            isNearLimit ? 'text-yellow-600' :
                                'text-gray-500'
                            }`}>
                            {value.length}/{maxLength}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedInputField;
