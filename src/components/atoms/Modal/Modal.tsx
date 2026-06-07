import React, { useEffect } from 'react';
import Button from '../Button';
import Icon from '../Icon';
import Text from '../Text';

export interface ModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Function to call when the modal should be closed */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal content */
    children?: React.ReactNode;
    /** Modal size */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    /** Header variant for styling */
    headerVariant?: 'default' | 'primary' | 'danger' | 'success' | 'warning';
    /** Modal variant for predefined layouts */
    variant?: 'default' | 'confirmation' | 'alert' | 'success' | 'error';
    /** Whether to show the close button */
    showCloseButton?: boolean;
    /** Whether clicking the backdrop closes the modal */
    closeOnBackdropClick?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Footer content */
    footer?: React.ReactNode;
    /** Center the modal body content */
    centerBody?: boolean;
    /** Icon for alert/confirmation modals */
    icon?: React.ReactNode;
    /** Round the modal header corners */
    titleRounded?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    headerVariant = 'default',
    variant = 'default',
    showCloseButton = true,
    closeOnBackdropClick = true,
    className = '',
    footer,
    centerBody = false,
    icon,
    titleRounded = false,
}) => {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        xs: 'max-w-sm',
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        xxl: 'max-w-6xl',
    };

    const headerVariantClasses = {
        default: 'bg-white text-gray-900 border-b border-gray-200',
        primary: 'bg-primary-600 text-white border-b border-primary-700',
        danger: 'bg-red-600 text-white border-b border-red-700',
        success: 'bg-green-600 text-white border-b border-green-700',
        warning: 'bg-yellow-600 text-white border-b border-yellow-700',
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto pt-10 pb-10"
            onClick={handleBackdropClick}
        >
            <div
                className={`
                    bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} 
                    transform transition-all duration-200 scale-100
                    ${className}
                `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className={`px-6 py-4 ${headerVariantClasses[headerVariant]} ${titleRounded ? 'rounded-t-lg' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {icon && <div className="flex-shrink-0">{icon}</div>}
                                {title && (
                                    <Text variant="h5" weight="semibold" className="text-inherit">
                                        {title}
                                    </Text>
                                )}
                            </div>
                            {showCloseButton && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    iconOnly
                                    icon="close"
                                    onClick={onClose}
                                    className={`text-inherit hover:bg-black hover:bg-opacity-10 ${headerVariant !== 'default' ? 'text-white' : 'text-gray-400'
                                        }`}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className={`px-6 py-4 ${centerBody ? 'text-center' : ''}`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;