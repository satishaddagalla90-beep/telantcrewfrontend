import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../atoms/Icon';

export interface CreatableOption {
    value: string;
    label: string;
    isNew?: boolean;
}

export interface CreatableAsyncSelectProps {
    /** Selected value */
    value: CreatableOption | CreatableOption[] | null;
    /** Change handler */
    onChange: (value: CreatableOption | CreatableOption[] | null) => void;
    /** Load options function */
    loadOptions?: (inputValue: string, callback: (options: CreatableOption[]) => void) => void;
    /** Create option handler */
    onCreateOption?: (inputValue: string) => Promise<CreatableOption>;
    /** Multi-select mode */
    isMulti?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Allow clearing selection */
    isClearable?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** No options message */
    noOptionsMessage?: string;
    /** Create option text */
    formatCreateLabel?: (inputValue: string) => string;
}

const CreatableAsyncSelect: React.FC<CreatableAsyncSelectProps> = ({
    value,
    onChange,
    loadOptions,
    onCreateOption,
    isMulti = false,
    isLoading = false,
    placeholder = 'Search or create...',
    isClearable = true,
    disabled = false,
    className = '',
    size = 'md',
    noOptionsMessage = 'No options found',
    formatCreateLabel = (inputValue: string) => `Create "${inputValue}"`,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [options, setOptions] = useState<CreatableOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm min-h-8',
        md: 'px-3 py-2 text-base min-h-10',
        lg: 'px-4 py-3 text-lg min-h-12',
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);

        if (loadOptions) {
            setLoadingOptions(true);
            loadOptions(newValue, (loadedOptions) => {
                setOptions(loadedOptions);
                setLoadingOptions(false);
            });
        }

        setIsOpen(true);
    };

    const handleOptionSelect = (option: CreatableOption) => {
        if (isMulti) {
            const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
            const isAlreadySelected = currentValues.some(v => v.value === option.value);

            if (isAlreadySelected) {
                const newValues = currentValues.filter(v => v.value !== option.value);
                onChange(newValues.length > 0 ? newValues : null);
            } else {
                onChange([...currentValues, option]);
            }
        } else {
            onChange(option);
            setSearchValue(option.label);
            setIsOpen(false);
        }
    };

    const handleCreateOption = async () => {
        if (onCreateOption && searchValue.trim()) {
            try {
                const newOption = await onCreateOption(searchValue.trim());
                handleOptionSelect(newOption);
                setSearchValue('');
            } catch (error) {
                console.error('Failed to create option:', error);
            }
        }
    };

    const handleRemoveValue = (optionToRemove: CreatableOption) => {
        if (isMulti && Array.isArray(value)) {
            const newValues = value.filter(v => v.value !== optionToRemove.value);
            onChange(newValues.length > 0 ? newValues : null);
        }
    };

    const handleClear = () => {
        onChange(null);
        setSearchValue('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const getDisplayValue = () => {
        if (isMulti) return searchValue;
        return value && !Array.isArray(value) ? value.label : searchValue;
    };

    const getSelectedValues = (): CreatableOption[] => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    };

    const canCreateOption = () => {
        return onCreateOption &&
            searchValue.trim() &&
            !options.some(opt => opt.label.toLowerCase() === searchValue.toLowerCase());
    };

    const filteredOptions = options.filter(option =>
        !getSelectedValues().some(selected => selected.value === option.value)
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className={`
                flex flex-wrap items-center w-full border border-gray-300 rounded-lg
                focus-within:ring-2 focus-within:ring-primary-600 focus-within:border-primary-600
                ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                ${sizeClasses[size]}
                transition-colors duration-200
            `}>
                {/* Selected values (for multi-select) */}
                {isMulti && getSelectedValues().map((selectedValue) => (
                    <span
                        key={selectedValue.value}
                        className="inline-flex items-center gap-1 px-2 py-1 m-0.5 text-xs bg-primary-100 text-primary-800 rounded"
                    >
                        {selectedValue.label}
                        <button
                            type="button"
                            onClick={() => handleRemoveValue(selectedValue)}
                            className="text-primary-600 hover:text-primary-800"
                            disabled={disabled}
                        >
                            <Icon name="close" size={12} />
                        </button>
                    </span>
                ))}

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={getDisplayValue()}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={getSelectedValues().length === 0 ? placeholder : ''}
                    disabled={disabled}
                    className="flex-1 min-w-16 bg-transparent border-none outline-none"
                />

                {/* Controls */}
                <div className="flex items-center gap-1 ml-2">
                    {(isLoading || loadingOptions) && (
                        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full" />
                    )}
                    {isClearable && value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Icon name="close" size={14} />
                        </button>
                    )}
                    <Icon
                        name="caret-down"
                        size={14}
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleOptionSelect(option)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                            >
                                {option.label}
                                {option.isNew && (
                                    <span className="ml-2 text-xs text-primary-600">(new)</span>
                                )}
                            </button>
                        ))
                    ) : canCreateOption() ? (
                        <button
                            type="button"
                            onClick={handleCreateOption}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-primary-600"
                        >
                            {formatCreateLabel(searchValue)}
                        </button>
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            {loadingOptions ? 'Loading...' : noOptionsMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreatableAsyncSelect;
