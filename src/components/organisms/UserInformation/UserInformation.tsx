import React from 'react';
import Text from '../../atoms/Text';
import InfoItem from '../../molecules/InfoItem';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';

interface UserInformationProps {
    data: {
        phone?: string | number;
        email?: string;
        department: string;
        location: string;
        reporting_to: string;
        join_date: string;
    };
    onEdit?: () => void;
    canEdit?: boolean;
}

const UserInformation: React.FC<UserInformationProps> = ({
    data,
    onEdit,
    canEdit = false
}) => {
    const userInfoItems = [
        {
            label: 'Phone',
            value: data.phone,
        },
        {
            label: 'Email ID',
            value: data.email,
        },
        {
            label: 'Date of Joining',
            value: data.join_date,
        },
        {
            label: 'Department',
            value: data.department
        },
        {
            label: 'Location',
            value: data.location
        },
        {
            label: 'Reporting To',
            value: data.reporting_to
        }
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Text variant="h4" className="text-lg font-semibold text-gray-900">
                    User Information
                </Text>
                {canEdit && onEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <Icon name="edit" className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {userInfoItems.map((item, index) => (
                    <InfoItem
                        key={index}
                        label={item.label}
                        value={item.value}
                        className="pb-3 border-b border-gray-100 last:border-b-0 last:pb-0"
                    />
                ))}
            </div>
        </div>
    );
};

export default UserInformation;
