import React from 'react';
import Icon, { IconName } from '../../atoms/Icon';
import Text from '../../atoms/Text';

interface InfoItem {
    icon: IconName;
    value: string | React.ReactNode;
}

interface InfoGroupProps {
    items: InfoItem[];
    className?: string;
}

const InfoGroup: React.FC<InfoGroupProps> = ({ items, className = '' }) => {
    return (
        <div className={`d-flex align-items-center gap-3 flex-wrap small ${className}`}>
            {items.map((item, index) => (
                <div key={index} className="d-flex align-items-center gap-1">
                    <Icon name={item.icon} size={16} color="currentColor" />
                    <Text variant="small">{item.value}</Text>
                </div>
            ))}
        </div>
    );
};

export default InfoGroup;