import React from 'react';

export interface NumberRangeInputProps {
    /** Minimum value */
    minValue: string | null;
    /** Maximum value */
    maxValue: string | null;
    /** Change handlers */
    onMinChange: (value: string | null) => void;
    onMaxChange: (value: string | null) => void;
    /** Placeholder texts */
    minPlaceholder?: string;
    maxPlaceholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
}

const NumberRangeInput: React.FC<NumberRangeInputProps> = ({
    minValue,
    maxValue,
    onMinChange,
    onMaxChange,
    minPlaceholder = 'Min',
    maxPlaceholder = 'Max',
    disabled = false,
    size = 'md',
    className = '',
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
    };

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onMinChange(value || null);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onMaxChange(value || null);
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <input
                type="number"
                value={minValue || ''}
                onChange={handleMinChange}
                placeholder={minPlaceholder}
                disabled={disabled}
                className={`
                    flex-1 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-primary-600 focus:border-primary-600
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                    transition-colors duration-200
                    ${sizeClasses[size]}
                    ${disabled ? 'bg-gray-50' : 'bg-white'}
                `}
            />
            <span className="text-gray-500 font-medium">to</span>
            <input
                type="number"
                value={maxValue || ''}
                onChange={handleMaxChange}
                placeholder={maxPlaceholder}
                disabled={disabled}
                className={`
                    flex-1 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-primary-600 focus:border-primary-600
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                    transition-colors duration-200
                    ${sizeClasses[size]}
                    ${disabled ? 'bg-gray-50' : 'bg-white'}
                `}
            />
        </div>
    );
};

export default NumberRangeInput;