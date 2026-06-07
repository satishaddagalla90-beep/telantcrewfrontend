import React from 'react';
import Icon, { IconName } from '../Icon/Icon';

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  'aria-label'?: string;
  id?: string;
  name?: string;
  value?: string;
  tabIndex?: number;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  fullWidth?: boolean;
  as?: React.ElementType; // Allows using different HTML elements or components
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  title,
  'aria-label': ariaLabel,
  id,
  name,
  value,
  tabIndex,
  icon,
  iconPosition = 'left',
  iconOnly = false,
  fullWidth = false,
  as: Component = 'button',
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-600 shadow-sm',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-600 bg-transparent',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 bg-transparent',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-600 hover:border-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600 hover:border-red-700',
    success: 'bg-green-600 hover:bg-green-700 text-white border border-green-600 hover:border-green-700',
  };

  const sizeClasses = {
    xs: iconOnly ? 'p-1.5' : 'px-2.5 py-1.5 text-xs',
    sm: iconOnly ? 'p-2' : 'px-3 py-1.5 text-sm',
    md: iconOnly ? 'p-2.5' : 'px-4 py-2 text-base',
    lg: iconOnly ? 'p-3' : 'px-6 py-3 text-lg',
    xl: iconOnly ? 'p-4' : 'px-8 py-4 text-xl',
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  };

  const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${sizeClasses[size]} 
    ${disabledClasses} 
    ${widthClasses} 
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || (iconPosition !== position)) return null;

    return (
      <Icon
        name={icon}
        size={iconSizes[size]}
        className={loading ? 'opacity-50' : ''}
      />
    );
  };

  const renderLoadingSpinner = () => {
    if (!loading) return null;

    return (
      <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${size === 'xs' ? 'w-3 h-3' :
        size === 'sm' ? 'w-4 h-4' :
          size === 'md' ? 'w-4 h-4' :
            size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'
        }`} />
    );
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel || (iconOnly && icon ? `${icon} button` : undefined)}
      id={id}
      name={name}
      value={value}
      tabIndex={tabIndex}
    >
      {loading && renderLoadingSpinner()}
      {!loading && renderIcon('left')}
      {children}
      {!loading && renderIcon('right')}
    </button>
  );
};

export default Button;