import React from 'react';

export interface BadgeProps {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    dot = false,
    position = 'top-right',
    className = '',

}) => {
    const variantClasses = {
        primary: 'bg-[#007AC1] text-white',
        secondary: 'bg-violet-600 text-white',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
        danger: 'bg-red-500 text-white',
        info: 'bg-[#007AC1] text-white',
    };

    const sizeClasses = dot
        ? {
            sm: 'w-2 h-2',
            md: 'w-3 h-3',
            lg: 'w-4 h-4',
        }
        : {
            sm: 'px-1.5 py-0.5 text-xs min-w-[1rem] h-4',
            md: 'px-2 py-1 text-xs min-w-[1.25rem] h-5',
            lg: 'px-2.5 py-1 text-sm min-w-[1.5rem] h-6',
        };

    const positionClasses = {
        'top-right': '-top-1 -right-1',
        'top-left': '-top-1 -left-1',
        'bottom-right': '-bottom-1 -right-1',
        'bottom-left': '-bottom-1 -left-1',
    };

    const baseClasses = `
    ${positionClasses[position]}
    ${variantClasses[variant]} 
    ${sizeClasses[size]}
    rounded-full
    flex items-center justify-center
    font-medium
    border-2 border-white
    ${className}
  `;

    if (dot) {
        return <span className={baseClasses} />;
    }

    return (
        <span className={baseClasses}>
            {children}
        </span>
    );
};

export default Badge;
