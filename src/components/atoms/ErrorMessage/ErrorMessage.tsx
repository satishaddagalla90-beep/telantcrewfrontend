import React from 'react';
import Icon from '../Icon';
import Text from '../Text';

export interface ErrorMessageProps {
    /** Error message to display */
    message?: string;
    /** Show error icon */
    showIcon?: boolean;
    /** Error variant for styling */
    variant?: 'error' | 'warning' | 'info';
    /** Size of the error message */
    size?: 'xs' | 'sm' | 'base' | 'lg';
    /** Additional CSS classes */
    className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message,
    showIcon = false,
    variant = 'error',
    size = 'sm',
    className = ''
}) => {
    if (!message) return null;

    const variantClasses = {
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600'
    };

    const iconColors = {
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600'
    };

    const iconNames = {
        error: 'info' as const,
        warning: 'info' as const,
        info: 'info' as const
    };

    return (
        <div className={`flex items-start gap-1 ${className}`}>
            {showIcon && (
                <Icon
                    name={iconNames[variant]}
                    size={14}
                    className={`mt-0.5 flex-shrink-0 ${iconColors[variant]}`}
                />
            )}
            <Text size={size} className={variantClasses[variant]}>
                {message}
            </Text>
        </div>
    );
};

export default ErrorMessage;
