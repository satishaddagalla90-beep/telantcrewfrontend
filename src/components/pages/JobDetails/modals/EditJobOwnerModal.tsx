import React, { useState, useEffect, useMemo } from 'react';
import EditModal from '../../../molecules/EditModal/EditModal';
import SearchDropdown from '../../../molecules/SearchDropdown/SearchDropdown';
import { useUsersDropdown } from '../../../../hooks';
import { AssignedUser } from '../../../../types/job';

// Specific data needed for job owner editing
interface JobOwnerData {
  assigned_to: AssignedUser[] | string[];
  job_owner: string;
}

// Form state uses string arrays (IDs)
interface JobOwnerFormState {
  assigned_to: string[];
  job_owner: string;
}

interface EditJobOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOwnerData: JobOwnerData;
  onSave: (data: { assigned_to: string[]; job_owner: string }) => Promise<void>;
  isLoading?: boolean;
}

const EditJobOwnerModal: React.FC<EditJobOwnerModalProps> = ({
  isOpen,
  onClose,
  jobOwnerData,
  onSave,
  isLoading = false,
}) => {
  const { options: userOptions, loading: loadingUsers, search: searchUsers } = useUsersDropdown();

  const [formData, setFormData] = useState<JobOwnerFormState>({
    assigned_to: [],
    job_owner: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to extract IDs from assigned_to (handles both old string[] and new object[] format)
  const extractAssignedToIds = (assignedTo: AssignedUser[] | string[] | undefined): string[] => {
    if (!assignedTo || assignedTo.length === 0) return [];
    
    return assignedTo.map((item: any) => {
      if (typeof item === 'string') {
        return item;
      } else if (item && typeof item === 'object' && 'id' in item) {
        return item.id;
      }
      return '';
    }).filter(Boolean);
  };

  // Convert assigned_to objects to dropdown options format
  const initialAssignedOptions = useMemo(() => {
    if (!jobOwnerData?.assigned_to || jobOwnerData.assigned_to.length === 0) return [];
    
    return (jobOwnerData.assigned_to as any[])
      .filter((item: any) => item && typeof item === 'object' && 'id' in item && 'name' in item)
      .map((item: any) => ({
        value: item.id,
        label: item.name,
      }));
  }, [jobOwnerData?.assigned_to]);

  // Merge initial options with fetched options (fetched options take precedence for same ID)
  const mergedUserOptions = useMemo(() => {
    const optionsMap = new Map<string, { value: string; label: string }>();
    
    // Add initial options first
    initialAssignedOptions.forEach((opt: { value: string; label: string }) => {
      optionsMap.set(opt.value, opt);
    });
    
    // Override with fetched options (they may have more up-to-date names)
    userOptions.forEach((opt: { value: string; label: string }) => {
      optionsMap.set(opt.value, opt);
    });
    
    return Array.from(optionsMap.values());
  }, [initialAssignedOptions, userOptions]);

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (isOpen && jobOwnerData) {
      setFormData({
        assigned_to: extractAssignedToIds(jobOwnerData.assigned_to),
        job_owner: jobOwnerData.job_owner || '',
      });
      setErrors({});
    }
  }, [isOpen, jobOwnerData]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Assigned to required
    if (!formData.assigned_to || formData.assigned_to.length === 0) {
      newErrors.assigned_to = 'At least one user must be assigned';
    }

    // Job owner required
    if (!formData.job_owner?.trim()) {
      newErrors.job_owner = 'Job owner is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save job owner:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      onClose();
    }
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Job Owner & Assignment"
      isLoading={isSaving || isLoading}
      onSave={handleSave}
      size="md"
    >
      <div className="space-y-6">

        <SearchDropdown
          label="Job Owner"
          value={formData.job_owner}
          onChange={(selected: any) => {
            const owner = selected?.value || '';
            handleChange('job_owner', owner);
          }}
          options={mergedUserOptions}
          loading={loadingUsers}
          onInputChange={(input: string) => searchUsers(input)}
          error={errors.job_owner}
          placeholder="Select job owner"
          isMulti={false}
          required
        />
        
        <SearchDropdown
          label="Assigned To"
          value={formData.assigned_to || []}
          onChange={(selected: any) => {
            const users = selected ? selected.map((u: any) => u.value) : [];
            handleChange('assigned_to', users);
          }}
          options={mergedUserOptions}
          loading={loadingUsers}
          onInputChange={(input: string) => searchUsers(input)}
          error={errors.assigned_to}
          placeholder="Select users to assign"
          isMulti={true}
          required
        />

        
      </div>
    </EditModal>
  );
};

export type { JobOwnerData };
export default EditJobOwnerModal;
