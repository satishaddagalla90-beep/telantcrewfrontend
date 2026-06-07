import React from 'react';
import Icon from '../../atoms/Icon';
import Badge from '../../atoms/Badge';
import { IconName } from '../../atoms/Icon/Icon';

export interface IconAction {
    icon: IconName;
    onClick?: () => void;
    badge?: {
        count?: number;
        dot?: boolean;
        variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    };
    'aria-label'?: string;
}

export interface IconGroupProps {
    actions: IconAction[];
    size?: number;
    color?: string;
    className?: string;
}

const IconGroup: React.FC<IconGroupProps> = ({
    actions,
    size = 20,
    color = '#6B7280',
    className = '',
}) => {
    return (
        <div className={`flex items-center space-x-4 ${className}`}>
            {actions.map((action, index) => (
                <div key={index} className="relative">
                    <Icon
                        name={action.icon}
                        size={size}
                        color={color}
                        onClick={action.onClick}
                        aria-label={action['aria-label']}
                        className={action.onClick ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}
                    />
                    {action.badge && (
                        <Badge
                            variant={action.badge.variant || 'danger'}
                            dot={action.badge.dot}
                            size="sm"
                        >
                            {action.badge.count}
                        </Badge>
                    )}
                </div>
            ))}
        </div>
    );
};

export default IconGroup;
