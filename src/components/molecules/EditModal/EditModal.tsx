import React from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    isLoading?: boolean;
    onSave: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    isSaveDisabled?: boolean;
}

const EditModal: React.FC<EditModalProps> = ({
    isOpen,
    onClose,
    title,
    isLoading = false,
    onSave,
    children,
    size = 'md'
    , isSaveDisabled = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={size}
            title={title}
            showCloseButton
            closeOnBackdropClick={!isLoading}
            className="max-h-[90vh] overflow-y-auto"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onSave}
                        loading={isLoading}
                        disabled={isLoading || isSaveDisabled}
                    >
                        Save Changes
                    </Button>
                </div>
            }
        >
            {children}
        </Modal>
    );
};

export default EditModal;
