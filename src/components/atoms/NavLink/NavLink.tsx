import React from 'react';
import { NavLink as RouterNavLink, NavLinkProps as RouterNavLinkProps } from 'react-router-dom';

export interface NavLinkProps extends Partial<Omit<RouterNavLinkProps, 'className'>> {
    children: React.ReactNode;
    href?: string;
    to?: string;
    isActive?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    className?: string;
    disabled?: boolean;
    variant?: 'default' | 'navbar' | 'navbar-light';
    external?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
    children,
    href,
    to,
    isActive,
    onClick,
    className = '',
    disabled = false,
    variant = 'default',
    external = false,
    ...props
}) => {
    const baseClasses = 'transition-colors duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0';

    const variantClasses = {
        default: 'px-3 py-2 rounded-md text-sm font-medium',
        navbar: 'px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-white',
        'navbar-light': 'px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary-600',
    };

    const stateClasses = {
        default: isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        navbar: isActive
            ? 'text-white border-white'
            : 'text-white/90 hover:text-white',
        'navbar-light': isActive
            ? 'text-primary-600 border-primary-600'
            : 'text-gray-700 hover:text-primary-600',
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        if (onClick) {
            onClick(e);
        }
    };

    const combinedClassName = `${baseClasses} ${variantClasses[variant]} ${stateClasses[variant]} ${disabledClasses} ${className}`;

    // If href is provided, use regular anchor tag
    if (href) {
        return (
            <a
                href={href}
                className={combinedClassName}
                onClick={handleClick}
                {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                {...(props as any)}
            >
                {children}
            </a>
        );
    }

    // Use react-router NavLink if to prop is provided
    if (to) {
        return (
            <RouterNavLink
                to={to}
                className={({ isActive: routerIsActive }) =>
                    `${baseClasses} ${variantClasses[variant]} ${routerIsActive || isActive
                        ? stateClasses[variant].includes('bg-primary-600')
                            ? 'bg-primary-600 text-white'
                            : variant === 'navbar'
                                ? 'text-white border-white'
                                : 'text-primary-600 border-primary-600'
                        : stateClasses[variant]
                    } ${disabledClasses} ${className}`
                }
                onClick={handleClick}
                {...props}
            >
                {children}
            </RouterNavLink>
        );
    }

    // Fallback to button
    return (
        <button
            className={combinedClassName}
            onClick={handleClick}
            disabled={disabled}
            type="button"
        >
            {children}
        </button>
    );
};

export default NavLink;
