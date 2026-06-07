import React from 'react';
import Text from '../../atoms/Text';
import Button from '../../atoms/Button';
import Icon, { IconName } from '../../atoms/Icon';
import Badge from '../../atoms/Badge';

interface ActivityLog {
    id: string;
    type: string;
    action: string;
    description: string;
    timestamp: string;
    user: string;
    icon: IconName;
}

interface ActivityLogsProps {
    logs: ActivityLog[];
    onViewAll?: () => void;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({
    logs,
    onViewAll
}) => {
    const getActivityTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'permission':
                return 'warning';
            case 'activation':
                return 'success';
            case 'deactivation':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Text variant="h4" className="text-lg font-semibold text-gray-900">
                    Activity Log
                </Text>
                {onViewAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onViewAll}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        View All
                    </Button>
                )}
            </div>

            {/* Activity Items */}
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Icon name={log.icon} className="w-4 h-4 text-gray-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <Text className="text-sm font-medium text-gray-900 mb-1">
                                        {log.action}
                                    </Text>
                                    <Text className="text-sm text-gray-600 mb-2">
                                        {log.description}
                                    </Text>
                                    <div className="flex items-center space-x-2">
                                        <Text className="text-xs text-gray-500">
                                            {log.timestamp} • {log.user}
                                        </Text>
                                    </div>
                                </div>
                                <Badge
                                    variant={getActivityTypeColor(log.type)}
                                    size="sm"
                                    className="ml-2"
                                >
                                    {log.type}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {logs.length === 0 && (
                <div className="text-center py-8">
                    <Icon name="history" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <Text className="text-gray-500">No recent activity</Text>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
