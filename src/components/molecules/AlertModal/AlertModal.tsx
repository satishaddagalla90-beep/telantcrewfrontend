import React from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';

export interface AlertModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Function to call when the modal should be closed */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Modal message/content */
    message: string | React.ReactNode;
    /** Modal variant */
    variant?: 'warning' | 'danger' | 'info' | 'success';
    /** Button text */
    buttonText?: string;
    /** Additional CSS classes */
    className?: string;
}

// Optimized variant configuration - moved outside component to prevent recreation
const VARIANT_CONFIG = {
    warning: {
        headerVariant: 'warning' as const,
        iconClass: 'text-yellow-600',
        buttonVariant: 'warning' as const,
    },
    danger: {
        headerVariant: 'danger' as const,
        iconClass: 'text-red-600',
        buttonVariant: 'danger' as const,
    },
    info: {
        headerVariant: 'primary' as const,
        iconClass: 'text-blue-600',
        buttonVariant: 'primary' as const,
    },
    success: {
        headerVariant: 'success' as const,
        iconClass: 'text-green-600',
        buttonVariant: 'success' as const,
    },
} as const;

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    variant = 'warning',
    buttonText = 'OK',
    className = '',
}) => {
    const config = VARIANT_CONFIG[variant];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            headerVariant={config.headerVariant}
            centerBody={true}
            className={className}
            icon={<Icon name="close" size={20} className={config.iconClass} />}
            footer={
                <div className="flex justify-center">
                    <Button
                        variant={config.buttonVariant}
                        size="sm"
                        onClick={onClose}
                    >
                        {buttonText}
                    </Button>
                </div>
            }
        >
            {typeof message === 'string' ? (
                <Text variant="p" className="text-gray-700 mb-4">
                    {message}
                </Text>
            ) : (
                message
            )}
        </Modal>
    );
};

export default AlertModal;