import React from 'react';
import Text from '../Text';

export interface LabelProps {
    /** Label text */
    children: React.ReactNode;
    /** For attribute to associate with input */
    htmlFor?: string;
    /** Required field indicator */
    required?: boolean;
    /** Disable the label */
    disabled?: boolean;
    /** Size of the label */
    size?: 'sm' | 'base' | 'lg';
    /** Additional CSS classes */
    className?: string;
}

const Label: React.FC<LabelProps> = ({
    children,
    htmlFor,
    required = false,
    disabled = false,
    size = 'sm',
    className = ''
}) => {
    return (
        <label
            htmlFor={htmlFor}
            className={`
        block font-medium transition-colors
        ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}
        ${className}
      `}
        >
            <Text
                size={size}
                className={`${disabled ? 'text-gray-400' : '!text-gray-700'} !font-medium`}
            >
                {children}
                {required && (
                    <span className="text-red-500 ml-1" aria-label="required">
                        *
                    </span>
                )}
            </Text>
        </label>
    );
};

export default Label;
