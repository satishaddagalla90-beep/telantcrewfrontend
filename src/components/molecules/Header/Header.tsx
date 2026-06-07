import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Text from '../../atoms/Text';
import Button from '../../atoms/Button';
import { IconName } from '../../atoms/Icon';

export interface HeaderProps {
    /** Static title to display (overrides localStorage title) */
    title?: string;
    /** Show New Record/Add button */
    showNewRecordButton?: boolean;
    /** Show Cancel button */
    showCancelButton?: boolean;
    /** Show Back button */
    showBackButton?: boolean;
    /** Custom button text for new record button */
    newRecordButtonText?: string;
    /** Icon for new record button */
    newRecordButtonIcon?: IconName;
    /** Custom handlers */
    onNewRecord?: () => void;
    onCancel?: () => void;
    onBack?: () => void;
    /** Navigation paths */
    newRecordPath?: string;
    cancelPath?: string;
    /** Auto-refresh interval for localStorage (0 to disable) */
    refreshInterval?: number;
    /** Additional CSS classes */
    className?: string;
    /** Disable the new record button */
    disableNewRecord?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    title: staticTitle,
    showNewRecordButton = false,
    showCancelButton = false,
    showBackButton = false,
    newRecordButtonText = '+ New Record',
    newRecordButtonIcon = 'plus',
    onNewRecord,
    onCancel,
    onBack,
    newRecordPath = '/businessinformation',
    cancelPath = '/applicants',
    refreshInterval = 2000,
    className = '',
    disableNewRecord = false,
}) => {
    const navigate = useNavigate();
    const [clientName, setClientName] = useState<string | null>(localStorage.getItem('clientName'));
    const [clientCode, setClientCode] = useState<string | null>(localStorage.getItem('clientCode'));

    // Auto-refresh localStorage values (only if no static title and refreshInterval > 0)
    useEffect(() => {
        if (staticTitle || refreshInterval === 0) return;

        const interval = setInterval(() => {
            setClientName(localStorage.getItem('clientName'));
            setClientCode(localStorage.getItem('clientCode'));
        }, refreshInterval);

        return () => clearInterval(interval); // Cleanup on unmount
    }, [refreshInterval, staticTitle]);

    const handleNewRecord = () => {
        // Remove specific items from localStorage
        localStorage.removeItem('clientName');
        localStorage.removeItem('clientCode');
        localStorage.removeItem('candidateFormData');

        if (onNewRecord) {
            onNewRecord();
        } else {
            navigate(newRecordPath);
        }
    };

    const handleCancel = () => {
        localStorage.removeItem('clientName');
        localStorage.removeItem('candidate_id');
        localStorage.removeItem('candidate_picture');
        localStorage.removeItem('candidateFormData');

        if (onCancel) {
            onCancel();
        } else {
            navigate(cancelPath);
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    // Generate dynamic title: use static title if provided, otherwise localStorage-based
    const displayTitle = staticTitle || (clientName && clientCode ? `${clientName} - ${clientCode}` : '');

    return (
        <header className={`bg-white border-b border-gray-200 px-6 py-3 ${className}`}>
            <div className="flex items-center justify-between">
                {/* Dynamic Title */}
                <Text
                    variant="h2"
                    size="xl"
                    weight="bold"
                    className="text-gray-900"
                >
                    {displayTitle || ' '}
                </Text>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    {showNewRecordButton && (
                        <Button
                            variant="primary"
                            size="sm"
                            icon={newRecordButtonIcon}
                            iconPosition="left"
                            onClick={handleNewRecord}
                            disabled={disableNewRecord}
                            title={disableNewRecord ? 'Feature not available' : undefined}
                        >
                            {newRecordButtonText}
                        </Button>
                    )}

                    {showBackButton && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                    )}

                    {showCancelButton && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;