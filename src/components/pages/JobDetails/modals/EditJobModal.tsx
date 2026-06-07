import React, { useState, useEffect } from 'react';
import EditModal from '../../../molecules/EditModal/EditModal';
import { FormField } from '../../../atoms/FormField';
import SearchDropdown from '../../../molecules/SearchDropdown/SearchDropdown';
import { DropdownOption } from '../../../../types';
import { useJobDropdowns } from '../../../../hooks/useJobDropdowns';
import { useCountriesNowCitiesDropdown } from '../../../../hooks/useCitiesDropdown';
import { useClientsDropdown } from '../../../../hooks/useClients';

interface JobHeaderData {
  job_title?: string;
  job_status?: string;
  priority?: string;
  job_location?: string | string[];
  client?: {
    client_name?: string;
    end_client_name?: string;
    client_requirement_id?: string;
    full_name?: string;
    phone?: string;
    email?: string;
    designation?: string;
    department?: string;
    client_logo?: string | null;
    associate_msp?: string | null;
  };
}

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobData: JobHeaderData;
  onSave: (data: Partial<JobHeaderData>) => Promise<void>;
  isLoading?: boolean;
}

interface JobHeaderFormState {
  job_title: string;
  job_status: string;
  priority: string;
  job_location: string[];
  client: {
    client_name: string;
    end_client_name: string;
    client_requirement_id: string;
    full_name: string;
    phone: string;
    email: string;
    designation: string;
    department: string;
    client_logo: string;
    associate_msp: string;
  };
}

const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  jobData,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<JobHeaderFormState>({
    job_title: '',
    job_status: '',
    priority: '',
    job_location: [],
    client: {
      client_name: '',
      end_client_name: '',
      client_requirement_id: '',
      full_name: '',
      phone: '',
      email: '',
      designation: '',
      department: '',
      client_logo: '',
      associate_msp: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMSP, setIsMSP] = useState(false);

  // Initialize dropdowns from API
  const { jobStatuses, jobPriorities } = useJobDropdowns();

  // Client dropdown
  const {
    options: clientOptions,
    loading: clientLoading,
    search: onClientSearch,
    clientsMap,
  } = useClientsDropdown();

  // Location dropdown
  const {
    options: locationOptions,
    loading: locationLoading,
    search: onLocationSearch,
    loadMore: loadMoreLocations,
  } = useCountriesNowCitiesDropdown();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && jobData) {
      // normalize job_location to array of values
      const normalizeLocations = (): string[] => {
        const jl = jobData.job_location;
        if (!jl) return [];
        if (Array.isArray(jl)) return jl as string[];
        if (typeof jl === 'string') {
          return jl.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
      };

      setFormData({
        job_title: jobData.job_title || '',
        job_status: jobData.job_status || '',
        priority: jobData.priority || '',
        job_location: normalizeLocations(),
        client: {
          client_name: jobData.client?.client_name || '',
          end_client_name: jobData.client?.end_client_name || '',
          client_requirement_id: jobData.client?.client_requirement_id || '',
          full_name: jobData.client?.full_name || '',
          phone: jobData.client?.phone || '',
          email: jobData.client?.email || '',
          designation: jobData.client?.designation || '',
          department: jobData.client?.department || '',
          client_logo: jobData.client?.client_logo || '',
          associate_msp: jobData.client?.associate_msp || '',
        },
      });
      // Set MSP toggle based on whether end_client_name exists
      setIsMSP(!!jobData.client?.end_client_name);
      setErrors({});
    }
  }, [isOpen, jobData]);

  const handleInputChange = (field: keyof JobHeaderFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleClientFieldChange = (field: keyof JobHeaderFormState['client'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        [field]: value,
      },
    }));
  };

  const handleMSPToggle = (checked: boolean) => {
    setIsMSP(checked);
    if (!checked) {
      // If unchecked, clear end_client_name
      handleClientFieldChange('end_client_name', '');
    }
  };

  const handleDropdownChange = (
    field: keyof JobHeaderFormState,
    option: DropdownOption | DropdownOption[] | null
  ) => {
    // Special handling for client dropdown
    if (field === 'client' && !Array.isArray(option)) {
      if (!option) {
        setFormData((prev) => ({
          ...prev,
          client: {
            ...prev.client,
            client_name: '',
            end_client_name: '',
            full_name: '',
            phone: '',
            email: '',
            designation: '',
            department: '',
            client_logo: '',
            associate_msp: '',
          },
        }));
        return;
      }

      // When client is selected, populate all client fields from the clientsMap data
      const clientName = option.value || '';
      const clientData = clientsMap.get(clientName) || ({} as any);

      setFormData((prev) => ({
        ...prev,
        client: {
          client_name: clientName,
          end_client_name: clientData.end_client_name || '',
          client_requirement_id: prev.client.client_requirement_id, // Keep existing value
          full_name: clientData.full_name || '',
          phone: clientData.phone || '',
          email: clientData.email || '',
          designation: clientData.designation || '',
          department: clientData.department || '',
          client_logo: clientData.client_logo || '',
          associate_msp: clientData.associate_msp || '',
        },
      }));
      return;
    }

    // Narrow runtime type first
    if (Array.isArray(option)) {
      // Option is an array of DropdownOption
      if (field === 'job_location') {
        setFormData((prev) => ({ ...prev, [field]: option.map(o => o.value) as any }));
      } else {
        // For non-location fields, pick the first selected option's value
        setFormData((prev) => ({ ...prev, [field]: option[0]?.value || '' }));
      }
    } else {
      // Option is either a single DropdownOption or null
      if (field === 'job_location') {
        setFormData((prev) => ({ ...prev, [field]: option ? [option.value] as any : [] }));
      } else if (field === 'job_status' || field === 'priority') {
        // Backend expects the name (label), not the ID (value)
        setFormData((prev) => ({ ...prev, [field]: option?.label || '' }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: option?.value || '' }));
      }
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Job title is required';
    }

    if (!formData.job_status) {
      newErrors.job_status = 'Job status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Map priority back to job_priority for API
      const mapLocationsToLabels = (vals: string[] | undefined): string => {
        if (!vals || vals.length === 0) return '';
        const labels = vals.map(v => {
          const opt = locationOptions.find(o => o.value === v || o.label === v);
          return opt ? opt.label : v;
        });
        return labels.join(', ');
      };

      const dataToSave = {
        job_title: formData.job_title,
        job_status: formData.job_status,
        job_priority: formData.priority,
        job_location: mapLocationsToLabels(formData.job_location),
        client: {
          client_name: formData.client.client_name,
          end_client_name: isMSP ? formData.client.end_client_name : undefined,
          client_requirement_id: formData.client.client_requirement_id,
          full_name: formData.client.full_name,
          phone: formData.client.phone,
          email: formData.client.email,
          designation: formData.client.designation,
          department: formData.client.department,
          client_logo: formData.client.client_logo ? formData.client.client_logo : null,
          associate_msp: formData.client.associate_msp ? formData.client.associate_msp : null,
        },
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving job header:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedOption = (
    options: DropdownOption[],
    value: string | string[]
  ): DropdownOption | DropdownOption[] | null => {
    if (!value) return null;
    if (Array.isArray(value)) {
      const found = value.map(v => options.find(opt => opt.value === v) || options.find(opt => opt.label === v) || { value: v, label: v });
      return found;
    }
    // single value
    return options.find((opt) => opt.value === value) ||
      options.find((opt) => opt.label === value) ||
      null;
  };

  // Build location options with current value included
  // Ensure any selected locations are present in the options list (for temporary display)
  const locationOptionsWithCurrent: DropdownOption[] = (() => {
    const panIndiaOption = { value: 'PAN India', label: 'PAN India' };
    const base = [panIndiaOption, ...locationOptions];
    const selectedVals = formData.job_location || [];
    const missing = selectedVals.filter(v => !base.find(opt => opt.value === v));
    const missingOptions = missing.map(v => ({ value: v, label: v }));
    return [...missingOptions, ...base];
  })();

  // Build status options with current value included (in case API returns name instead of id)
  const jobStatusOptionsWithCurrent = formData.job_status &&
    !jobStatuses.find(opt => opt.value === formData.job_status || opt.label === formData.job_status)
    ? [{ value: formData.job_status, label: formData.job_status }, ...jobStatuses]
    : jobStatuses;

  // Build priority options with current value included
  const jobPriorityOptionsWithCurrent = formData.priority &&
    !jobPriorities.find(opt => opt.value === formData.priority || opt.label === formData.priority)
    ? [{ value: formData.priority, label: formData.priority }, ...jobPriorities]
    : jobPriorities;

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Job"
      onSave={handleSave}
      isLoading={isLoading || isSaving}
      size="md"
    >
      <div className="space-y-4">
        {/* Job Title */}
        <FormField
          label="Job Title"
          value={formData.job_title}
          onChange={(value) => handleInputChange('job_title', value.charAt(0).toUpperCase() + value.slice(1))}
          error={errors.job_title}
          required
        />

        {/* Client Name */}
        <div className="flex flex-col">
          <SearchDropdown
            label="Client Name"
            options={clientOptions}
            value={formData.client.client_name}
            onChange={(option) => handleDropdownChange('client' as any, Array.isArray(option) ? option[0] : option)}
            placeholder="Search and select client..."
            isSearchable
            onInputChange={(input) => onClientSearch(input)}
            loading={clientLoading}
            disableFilter
          />
          {formData.client.associate_msp && (
            <div className="mt-2 pl-1">

              <span className="text-sm text-gray-800">{formData.client.associate_msp}</span>
            </div>
          )}
        </div>

        {/* Is MSP Checkbox */}
        {/* <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isMSP"
            checked={isMSP}
            onChange={(e) => handleMSPToggle(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isMSP" className="text-sm font-medium text-gray-700">
            Is MSP (Managed Service Provider)
          </label>
        </div> */}

        {/* End Client Name (MSP) - Only show if isMSP is true */}
        {isMSP && (
          <div>
            <SearchDropdown
              label="End Client Name"
              options={clientOptions}
              value={formData.client.end_client_name}
              onChange={(option) => {
                const endClientName = Array.isArray(option) ? option[0]?.value || '' : option?.value || '';
                handleClientFieldChange('end_client_name', endClientName);
              }}
              placeholder="Search and select end client..."
              isSearchable
              onInputChange={(input) => onClientSearch(input)}
              loading={clientLoading}
              disableFilter
              isClearable
            />
          </div>
        )}

        {/* Client Requirement ID */}
        <FormField
          label="Client Requirement ID"
          value={formData.client.client_requirement_id}
          onChange={(value) => handleClientFieldChange('client_requirement_id', value)}
          placeholder="Enter client requirement ID"
        />

        {/* Job Status */}
        <div>
          <SearchDropdown
            label="Job Status"
            options={jobStatusOptionsWithCurrent}
            value={(() => {
              const sel = getSelectedOption(jobStatusOptionsWithCurrent, formData.job_status);
              return Array.isArray(sel) ? (sel[0]?.value || '') : (sel?.value || '');
            })()}
            onChange={(option) => handleDropdownChange('job_status', Array.isArray(option) ? option[0] : option)}
            placeholder="Select job status"
            isSearchable
            required
          />
          {errors.job_status && (
            <p className="mt-1 text-sm text-red-500">{errors.job_status}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <SearchDropdown
            label="Priority"
            options={jobPriorityOptionsWithCurrent}
            value={(() => {
              const sel = getSelectedOption(jobPriorityOptionsWithCurrent, formData.priority);
              return Array.isArray(sel) ? (sel[0]?.value || '') : (sel?.value || '');
            })()}
            onChange={(option) => handleDropdownChange('priority', Array.isArray(option) ? option[0] : option)}
            placeholder="Select priority"
            isSearchable
          />
        </div>

        {/* Job Location */}
        <div>
          <SearchDropdown
            label="Job Location"
            options={locationOptionsWithCurrent}
            value={formData.job_location}
            onChange={(option) => handleDropdownChange('job_location', option as any)}
            placeholder="Search for a location..."
            isSearchable
            isMulti
            onInputChange={(input) => onLocationSearch(input)}
            onMenuScrollToBottom={loadMoreLocations}
            loading={locationLoading}
            disableFilter
          />
        </div>
      </div>
    </EditModal>
  );
};

export default EditJobModal;
