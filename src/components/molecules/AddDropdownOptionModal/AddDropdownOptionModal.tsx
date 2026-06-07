import React, { useState } from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import EnhancedInputField from '../EnhancedInputField';
import { apiCall } from '../../../utils/api';

// Import the toast function from netWrapper
const dispatchToaster = (
  type: 'error' | 'success',
  message: string,
  duration = 5000
) => {
  window.dispatchEvent(
    new CustomEvent('toasterEvents', {
      detail: {
        type,
        message,
        ...(type === 'error' && { duration, dismissible: true }),
      },
    })
  );
};

interface AddDropdownOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dropdownType: string;
  dropdownLabel: string;
  onSuccess: (newOption: { id: string; value: string; label: string }) => void;
  educationType?: string; // For degree dropdown, we need education_type
  // Additional context for specialized dropdowns
  context?: {
    [key: string]: any;
  };
}

const AddDropdownOptionModal: React.FC<AddDropdownOptionModalProps> = ({
  isOpen,
  onClose,
  dropdownType,
  dropdownLabel,
  onSuccess,
  educationType,
  context,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = { name: name.trim() };

      // Handle special cases that require additional context
      switch (dropdownType) {
        case 'degree':
        case 'Degree':
          if (!educationType && !context?.education_type) {
            throw new Error('Education type is required for degree dropdown');
          }
          // Use education_type from context if available, otherwise use educationType prop
          payload.education_type = context?.education_type || educationType;
          break;
        case 'Subject':
          // Subject needs degree context
          if (context?.degree) {
            payload.degree = context.degree;
          } else if (context?.degreeId) {
            payload.degree = context.degreeId;
          }
          break;
        case 'Source_name':
          // Source_name needs source_type context
          if (context?.source_type) {
            payload.source_type = context.source_type;
          }
          break;
        // Add more special cases as needed
        default:
          // For simple dropdowns, just name is enough
          break;
      }

      const response = await apiCall<{
        id: string;
        name: string;
        _id: string;
        created: string;
        updated: string;
      }>(`/common/add_dropdowns/${dropdownType}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Data Already Exists');
      }

      // Transform the API response to match the expected format
      const newOption = {
        id: response.data!.id,
        value: response.data!.name,
        label: response.data!.name,
      };

      // Call onSuccess with the new option (this will auto-select it)
      onSuccess(newOption);

      // Show success toast
      dispatchToaster(
        'success',
        `New ${dropdownLabel.toLowerCase()} "${name.trim()}" has been added and selected!`,
        3000
      );

      // Reset and close
      setName('');
      onClose();
    } catch (err) {
      console.error('Error adding dropdown option:', err);
      setError(err instanceof Error ? err.message : 'Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add New ${dropdownLabel}`}
      size="sm"
    >
      <div className="space-y-4 p-4">
        <EnhancedInputField
          label={`${dropdownLabel}`}
          value={name}
          onChange={setName}
          placeholder={`Enter ${dropdownLabel.toLowerCase()} name`}
          required
          error={error}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddDropdownOptionModal;
