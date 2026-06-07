import React, { useState, useEffect } from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';
import TextAreaField from '../TextAreaField/TextAreaField';
import AlertModal from '../AlertModal';

export interface UnmapModalProps {
  /** Whether the no selection modal is open */
  showNoSelection: boolean;
  /** Whether the unmap confirmation modal is open */
  showConfirmUnmap: boolean;
  /** Whether the unmap result modal is open */
  showUnmapResult: boolean;
  /** Unmap result message */
  unmapResultMessage?: string;
  /** Selected items count */
  selectedCount: number;
  /** Loading state */
  unmapping?: boolean;
  /** Handlers */
  onCloseNoSelection: () => void;
  onCloseConfirmUnmap: () => void;
  onCloseUnmapResult: () => void;
  onConfirmUnmap: (reason: string) => void;
}

const UnmapModal: React.FC<UnmapModalProps> = ({
  showNoSelection,
  showConfirmUnmap,
  showUnmapResult,
  unmapResultMessage = '',
  selectedCount,
  unmapping = false,
  onCloseNoSelection,
  onCloseConfirmUnmap,
  onCloseUnmapResult,
  onConfirmUnmap,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reset reason when modal opens
  useEffect(() => {
    if (showConfirmUnmap) {
      setReason('');
      setError('');
    }
  }, [showConfirmUnmap]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Reason is required for unmapping');
      return;
    }
    onConfirmUnmap(reason);
  };

  const isSuccess = unmapResultMessage.toLowerCase().includes('success');

  return (
    <>
      {/* No Selection Warning */}
      <AlertModal
        isOpen={showNoSelection}
        onClose={onCloseNoSelection}
        title="Warning"
        message="No rows selected for unmapping."
        variant="warning"
        buttonText="OK"
      />

      {/* Unmap Confirmation */}
      <Modal
        isOpen={showConfirmUnmap}
        onClose={onCloseConfirmUnmap}
        title="Unmap Candidate"
        size="md"
        headerVariant="warning"
        centerBody={false}
        closeOnBackdropClick={!unmapping}
        showCloseButton={!unmapping}
        icon={<Icon name="unmap" size={24} className="text-warning-600" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseConfirmUnmap}
              disabled={unmapping}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={handleConfirm}
              loading={unmapping}
            >
              Confirm Unmap
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Text variant="p" className="text-gray-700">
            {selectedCount > 1
              ? `Are you sure you want to unmap ${selectedCount} selected candidates? This action will remove their connection to the assigned jobs.`
              : "Are you sure you want to unmap this candidate? This action will remove their connection to the assigned job."}
          </Text>

          <TextAreaField
            label="Reason for Unmap"
            placeholder="Please provide a reason for unmapping (e.g., By mistake, Candidate withdrew, etc.)"
            value={reason}
            onChange={(val) => {
              setReason(val);
              if (val.trim()) setError('');
            }}
            required
            error={error}
            rows={3}
            disabled={unmapping}
          />
        </div>
      </Modal>

      {/* Unmap Result */}
      <AlertModal
        isOpen={showUnmapResult}
        onClose={onCloseUnmapResult}
        title="Unmapping Status"
        message={unmapResultMessage}
        variant={isSuccess ? 'success' : 'danger'}
        buttonText="OK"
      />
    </>
  );
};

export default UnmapModal;
