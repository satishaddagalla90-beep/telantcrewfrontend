import React from 'react';
import Text from '../../atoms/Text';
import { capitalizeAndSafe } from '../../../utils/textUtils';

interface InfoItemProps {
    label: string;
    value: string | React.ReactNode;
    className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, className = '' }) => {
    // Use shared capitalization utility for string values
    const displayValue = typeof value === 'string' ? (capitalizeAndSafe(value) || 'N/A') : (value || 'N/A');

    return (
        <div className={`space-y-1 ${className}`}>
            <Text size="sm" weight="medium" className="text-sm font-medium text-gray-500">
                {label}:
            </Text>
            <Text size="sm" className="font-medium text-sm text-gray-900">
                {displayValue}
            </Text>
        </div>
    );
};

export default InfoItem;