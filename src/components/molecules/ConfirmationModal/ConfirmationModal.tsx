import React from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';

export interface ConfirmationModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Function to call when the modal should be closed */
    onClose: () => void;
    /** Function to call when confirmed */
    onConfirm: () => void;
    /** Modal title */
    title: string;
    /** Modal message/content */
    message: string | React.ReactNode;
    /** Modal variant */
    variant?: 'warning' | 'danger' | 'info' | 'success';
    /** Confirm button text */
    confirmText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Loading state */
    loading?: boolean;
    /** Additional CSS classes */
    className?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    variant = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
    className = '',
}) => {
    const variantConfig = {
        warning: {
            headerVariant: 'warning' as const,
            icon: <Icon name="warning" size={20} className="text-white-600" />,
            confirmButtonVariant: 'warning' as const,
            cancelButtonVariant: 'outline' as const,
        },
        danger: {
            headerVariant: 'danger' as const,
            icon: <Icon name="warning" size={20} className="text-red-600" />,
            confirmButtonVariant: 'danger' as const,
            cancelButtonVariant: 'outline' as const,
        },
        info: {
            headerVariant: 'primary' as const,
            icon: <Icon name="info" size={20} className="text-blue-600" />,
            confirmButtonVariant: 'primary' as const,
            cancelButtonVariant: 'outline' as const,
        },
        success: {
            headerVariant: 'success' as const,
            icon: <Icon name="check" size={20} className="text-green-600" />,
            confirmButtonVariant: 'success' as const,
            cancelButtonVariant: 'outline' as const,
        },
    };

    const config = variantConfig[variant];

    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            headerVariant={config.headerVariant}
            centerBody={true}
            closeOnBackdropClick={!loading}
            showCloseButton={!loading}
            className={className}
            icon={config.icon}
            footer={
                <div className="flex justify-center gap-3">
                    <Button
                        variant={config.cancelButtonVariant}
                        size="sm"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={config.confirmButtonVariant}
                        size="sm"
                        onClick={handleConfirm}
                        loading={loading}
                    >
                        {confirmText}
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

export default ConfirmationModal;