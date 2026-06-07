import React from 'react';
import AlertModal from '../AlertModal';
import ConfirmationModal from '../ConfirmationModal';

export interface DeleteConfirmationModalProps {
    /** Whether the no selection modal is open */
    showNoSelection: boolean;
    /** Whether the confirm delete modal is open */
    showConfirmDelete: boolean;
    /** Whether the delete result modal is open */
    showDeleteResult: boolean;
    /** Delete result message */
    deleteResultMessage?: string;
    /** Selected items count */
    selectedCount: number;
    /** Loading state */
    deleting?: boolean;
    /** Handlers */
    onCloseNoSelection: () => void;
    onCloseConfirmDelete: () => void;
    onCloseDeleteResult: () => void;
    onConfirmDelete: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    showNoSelection,
    showConfirmDelete,
    showDeleteResult,
    deleteResultMessage = '',
    selectedCount,
    deleting = false,
    onCloseNoSelection,
    onCloseConfirmDelete,
    onCloseDeleteResult,
    onConfirmDelete,
}) => {
    const isSuccess = deleteResultMessage.toLowerCase().includes('success');

    return (
        <>
            {/* No Selection Warning */}
            <AlertModal
                isOpen={showNoSelection}
                onClose={onCloseNoSelection}
                title="Warning"
                message="No rows selected for deletion."
                variant="warning"
                buttonText="OK"
            />

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={showConfirmDelete}
                onClose={onCloseConfirmDelete}
                onConfirm={onConfirmDelete}
                title="Confirm Deletion For Candidate Records"
                message={
                    selectedCount > 1
                        ? `Are you sure you want to delete ${selectedCount} selected records?`
                        : "Are you sure you want to delete this record?"
                }
                variant="danger"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={deleting}
            />

            {/* Delete Result */}
            <AlertModal
                isOpen={showDeleteResult}
                onClose={onCloseDeleteResult}
                title="Deletion Status For Candidate Records"
                message={deleteResultMessage}
                variant={isSuccess ? 'success' : 'danger'}
                buttonText="OK"
            />
        </>
    );
};

export default DeleteConfirmationModal;