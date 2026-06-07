import React from 'react';
import Select from 'react-select';
import { DropdownOption } from '../../../types';

interface SearchDropdownProps {
    label: string;
    value: string | string[];
    onChange: (value: string | string[]) => void;
    options: DropdownOption[];
    loading?: boolean;
    error?: string | null;
    placeholder?: string;
    isMulti?: boolean;
    isClearable?: boolean;
    isSearchable?: boolean;
    onInputChange?: (input: string, action: any) => void;
    required?: boolean;
    disabled?: boolean;
    noOptionsMessage?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
    label,
    value,
    onChange,
    options,
    loading = false,
    error = null,
    placeholder,
    isMulti = false,
    isClearable = true,
    isSearchable = true,
    onInputChange,
    required = false,
    disabled = false,
    noOptionsMessage
}) => {
    const handleChange = (selectedOption: any) => {
        if (isMulti) {
            const values = selectedOption ? selectedOption.map((opt: DropdownOption) => opt.value) : [];
            onChange(values);
        } else {
            onChange(selectedOption ? selectedOption.value : '');
        }
    };

    const getSelectValue = () => {
        if (isMulti) {
            const valueArray = Array.isArray(value) ? value : [value].filter(Boolean);
            return options.filter(opt => valueArray.includes(opt.value));
        } else {
            const stringValue = Array.isArray(value) ? value[0] || '' : value;
            return options.find(opt => opt.value === stringValue) || null;
        }
    };

    const handleInputChange = (input: string, action: any) => {
        if (onInputChange && action.action === 'input-change' && typeof input === 'string') {
            onInputChange(input, action);
        }
    };

    return (
        <div className="flex flex-col">
            <label className="mb-1 font-medium text-sm text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Select
                value={getSelectValue()}
                onChange={handleChange}
                onInputChange={handleInputChange}
                options={options}
                isLoading={loading}
                isDisabled={disabled}
                isClearable={isClearable}
                isSearchable={isSearchable}
                isMulti={isMulti}
                placeholder={placeholder || `Select ${label.toLowerCase()}`}
                classNamePrefix="react-select"
                noOptionsMessage={() => {
                    if (noOptionsMessage) return noOptionsMessage;
                    if (loading) return 'Loading...';
                    return `No ${label.toLowerCase()} found`;
                }}
                styles={{
                    control: (base) => ({
                        ...base,
                        minHeight: '38px',
                        borderColor: error ? '#ef4444' : base.borderColor,
                        '&:hover': {
                            borderColor: error ? '#ef4444' : '#d1d5db'
                        }
                    })
                }}
            />
            {error && (
                <span className="text-red-500 text-xs mt-1">{error}</span>
            )}
        </div>
    );
};

export default SearchDropdown;
