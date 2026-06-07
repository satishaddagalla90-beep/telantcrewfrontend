import React from 'react';
import Text from '../../atoms/Text';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  headingIcon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  variant = 'default',
  className = '',
  headingIcon
}) => {
  const baseClasses = 'rounded-lg p-6 text-start';

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-300',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes}>
      {(title || subtitle) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && (
              <Text variant="h3" size="lg" weight="semibold" className="mb-1">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="p" size="sm" color="muted">
                {subtitle}
              </Text>
            )}
          </div>
          {headingIcon && (
            <div className="ml-2 flex-shrink-0 flex items-start">
              {headingIcon}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card; 