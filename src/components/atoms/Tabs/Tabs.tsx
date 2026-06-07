import React from 'react';
import Button from '../Button';
import Icon from '../Icon';

export interface TabItem {
    id: string;
    label: string;
    count?: number;
    disabled?: boolean;
}

export interface TabsProps {
    /** Array of tab items */
    tabs: TabItem[];
    /** Active tab ID */
    activeTab: string;
    /** Tab change handler */
    onTabChange: (tabId: string) => void;
    /** Additional CSS classes */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Style variant */
    variant?: 'default' | 'pills' | 'underline';
}

const Tabs: React.FC<TabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className = '',
    size = 'md',
    variant = 'underline',
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-lg',
    };

    const getTabClasses = (tab: TabItem, isActive: boolean) => {
        const baseClasses = `
            ${sizeClasses[size]}
            font-medium transition-all duration-200
            focus:outline-none focus:ring-0
            disabled:opacity-50 disabled:cursor-not-allowed
        `;

        if (variant === 'pills') {
            return `
                ${baseClasses}
                rounded-full
                ${isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
            `;
        }

        if (variant === 'underline') {
            return `
                ${baseClasses}
                rounded-t-lg border-b-2
                ${isActive
                    ? 'border-primary-600 text-primary-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                }
            `;
        }

        // Default variant
        return `
            ${baseClasses}
            rounded-t-lg
            ${isActive
                ? 'bg-white text-gray-900 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
        `;
    };

    const containerClasses = variant === 'underline' || variant === 'default'
        ? 'border-b border-gray-200'
        : '';

    return (
        <div className={`${containerClasses} ${className}`}>
            <nav className={`flex ${variant === 'pills' ? 'space-x-2' : 'space-x-1'}`} aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && onTabChange(tab.id)}
                            disabled={tab.disabled}
                            className={getTabClasses(tab, isActive)}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className="flex items-center gap-2">
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span
                                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${isActive
                                            ? variant === 'pills'
                                                ? 'bg-white bg-opacity-20 text-white'
                                                : 'bg-primary-100 text-primary-700'
                                            : 'bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default Tabs;