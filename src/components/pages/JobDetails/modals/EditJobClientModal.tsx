import React, { useState, useEffect } from 'react';
import EditModal from '../../../molecules/EditModal/EditModal';
import { FormField } from '../../../atoms/FormField';
import SearchDropdown from '../../../molecules/SearchDropdown/SearchDropdown';
import { JobClientAPI } from '../../../../types/job';
import { useClients } from '../../../../hooks';

interface EditJobClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobClient: JobClientAPI;
  onSave: (data: Partial<JobClientAPI>) => Promise<void>;
  isLoading?: boolean;
}

const EditJobClientModal: React.FC<EditJobClientModalProps> = ({
  isOpen,
  onClose,
  jobClient,
  onSave,
  isLoading = false,
}) => {
  const { clientOptions, clientsMap, loading: loadingClients } = useClients();

  const [formData, setFormData] = useState<JobClientAPI>({
    client_name: '',
    end_client_name: '',
    client_requirement_id: '',
    full_name: '',
    phone: '',
    email: '',
    designation: '',
    department: '',
    client_logo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (isOpen && jobClient) {
      setFormData({
        client_name: jobClient.client_name || '',
        end_client_name: jobClient.end_client_name || '',
        client_requirement_id: jobClient.client_requirement_id || '',
        full_name: jobClient.full_name || '',
        phone: jobClient.phone || '',
        email: jobClient.email || '',
        designation: jobClient.designation || '',
        department: jobClient.department || '',
        client_logo: jobClient.client_logo || '',
      });
      setErrors({});
      setLogoError(false);
    }
  }, [isOpen, jobClient]);

  // Auto-update logo when client changes
  useEffect(() => {
    if (formData.client_name && clientsMap.has(formData.client_name)) {
      const selectedClient = clientsMap.get(formData.client_name);
      if (selectedClient && selectedClient.client_logo) {
        setFormData(prev => ({
          ...prev,
          client_logo: selectedClient.client_logo || '',
        }));
        setLogoError(false);
      }
    }
  }, [formData.client_name, clientsMap]);

  const handleChange = (field: keyof JobClientAPI, value: string) => {
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

    // Required field validations
    if (!formData.client_name?.trim()) {
      newErrors.client_name = 'Client name is required';
    }

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Contact person name is required';
    }

    // Phone is optional but validate format if provided
    if (formData.phone?.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 digits';
      }
    }

    // Email is optional but validate format if provided
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
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
      // Convert empty string client_logo to null before saving
      const dataToSave = {
        ...formData,
        client_logo: formData.client_logo ? formData.client_logo : null,
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save client information:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      setLogoError(false);
      onClose();
    }
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Client Information"
      isLoading={isSaving || isLoading}
      onSave={handleSave}
      size="lg"
    >
      <div className="space-y-6">
        {/* Client Selection and Logo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <SearchDropdown
            label="Client Name"
            value={formData.client_name}
            onChange={(selected: any) => {
              const clientName = selected?.label || '';
              handleChange('client_name', clientName);
            }}
            options={clientOptions}
            loading={loadingClients}
            error={errors.client_name}
            placeholder="Select a client"
            isMulti={false}
            isClearable={true}
            required
          />

          {/* Client Logo Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Logo
            </label>
            <div className="w-full h-24 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
              {formData.client_logo && !logoError ? (
                <img
                  src={formData.client_logo}
                  alt={`${formData.client_name} Logo`}
                  className="max-h-full max-w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-gray-400 text-sm text-center">
                  {formData.client_name
                    ? 'No logo available'
                    : 'Select a client to view logo'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Other Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="End Client Name"
            placeholder="Enter end client name"
            value={formData.end_client_name}
            onChange={(value: string) => handleChange('end_client_name', value)}
            error={errors.end_client_name}
          />

          <FormField
            label="Client Requirement ID"
            placeholder="Enter client requirement ID"
            value={formData.client_requirement_id}
            onChange={(value: string) =>
              handleChange('client_requirement_id', value)
            }
            error={errors.client_requirement_id}
          />
        </div>

        {/* Contact Person Information */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Contact Person Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              placeholder="Enter full name"
              value={formData.full_name}
              onChange={(value: string) => handleChange('full_name', value)}
              error={errors.full_name}
              required
            />

            <FormField
              label="Phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(value: string) => handleChange('phone', value)}
              error={errors.phone}
              required
            />

            <FormField
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(value: string) => handleChange('email', value)}
              error={errors.email}
              required
            />

            <FormField
              label="Designation"
              placeholder="Enter designation"
              value={formData.designation}
              onChange={(value: string) => handleChange('designation', value)}
              error={errors.designation}
            />

            <FormField
              label="Department"
              placeholder="Enter department"
              value={formData.department}
              onChange={(value: string) => handleChange('department', value)}
              error={errors.department}
            />
          </div>
        </div>
      </div>
    </EditModal>
  );
};

export default EditJobClientModal;
