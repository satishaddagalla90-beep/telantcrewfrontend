import React, { useState, useMemo } from 'react';
import TextArea from '../../atoms/TextArea';
import FileInput from '../../atoms/FileInput';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import { JobDescriptionAPI } from '../../../types/job';
import { useUsersDropdown } from '../../../hooks';
import { uploadJobDocument } from '../../../services/jobService';
import { DropdownOption } from '../../../types';

interface JobDescriptionStepProps {
  formData: {
    job_description: JobDescriptionAPI & {
      _assigned_to_options?: any[];
      _job_owner_option?: any;
    };
    [key: string]: any;
  };
  onChange: (updates: any) => void;
  errors?: Record<string, string>;
}

const JobDescriptionStep: React.FC<JobDescriptionStepProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  // Use separate hook instances for each dropdown to avoid conflicts
  const {
    options: assignedToOptions,
    loading: loadingAssignedTo,
    search: searchAssignedTo
  } = useUsersDropdown();

  const {
    options: jobOwnerOptions,
    loading: loadingJobOwner,
    search: searchJobOwner
  } = useUsersDropdown();

  // Track selected users to preserve them when search results change
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<DropdownOption[]>(formData.job_description._assigned_to_options || []);
  const [selectedJobOwner, setSelectedJobOwner] = useState<DropdownOption | null>(formData.job_description._job_owner_option || null);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Combine selected options with search results to ensure selected values are always available
  const assignedToOptionsWithSelected = useMemo(() => {
    const selectedIds = selectedAssignedTo.map(opt => opt.value);
    const filteredOptions = assignedToOptions.filter(opt => !selectedIds.includes(opt.value));
    return [...selectedAssignedTo, ...filteredOptions];
  }, [assignedToOptions, selectedAssignedTo]);

  const jobOwnerOptionsWithSelected = useMemo(() => {
    if (!selectedJobOwner) return jobOwnerOptions;
    const hasSelected = jobOwnerOptions.some(opt => opt.value === selectedJobOwner.value);
    if (hasSelected) return jobOwnerOptions;
    return [selectedJobOwner, ...jobOwnerOptions];
  }, [jobOwnerOptions, selectedJobOwner]);

  const updateJobDescription = (
    field: keyof JobDescriptionAPI,
    value: any
  ) => {
    onChange({
      job_description: {
        ...formData.job_description,
        [field]: value,
      },
    });
  };

  const handlePdfUpload = async (file: File | null) => {
    if (!file) {
      updateJobDescription('pdf_upload', '');
      setUploadSuccess(false);
      return;
    }

    setUploadingPdf(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const fileUrl = await uploadJobDocument(file);
      updateJobDescription('pdf_upload', fileUrl);
      setUploadSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      setUploadError(errorMessage);
      updateJobDescription('pdf_upload', '');
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Job Description - Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <TextArea
            placeholder="Enter detailed job description including responsibilities, requirements, and qualifications"
            value={formData.job_description.job_description}
            onChange={e =>
              updateJobDescription('job_description', e.target.value)
            }
            rows={8}
            className="w-full"
            maxLength={3000}
          />
          <div className="flex justify-between items-start mt-1">
            <div className="flex flex-col">
              {errors.job_description && (
                <p className="text-sm text-red-600 mb-0.5">
                  {errors.job_description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Minimum 50 characters required
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {3000 - (formData.job_description.job_description?.length || 0)} characters remaining
            </p>
          </div>
        </div>

        {/* Job Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Upload
          </label>
          <FileInput
            accept=".pdf"
            onChange={e => {
              const file = e.target.files?.[0] || null;
              handlePdfUpload(file);
            }}
            buttonText="Choose PDF File"
            showFileNames={true}
            disabled={uploadingPdf}
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload job description document (PDF format only, optional)
          </p>

          {/* Upload Status Messages */}
          {uploadingPdf && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Uploading document...
            </div>
          )}

          {uploadSuccess && !uploadingPdf && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              Document uploaded successfully
            </div>
          )}

          {uploadError && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              {uploadError}
            </div>
          )}

          {errors.pdf_upload && (
            <p className="mt-1 text-sm text-red-600">{errors.pdf_upload}</p>
          )}
        </div>

        {/* Comments - Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments
          </label>
          <TextArea
            placeholder="Enter any additional comments or notes about this job requisition"
            value={Array.isArray(formData.job_description.comments) ? '' : (formData.job_description.comments || '')}
            onChange={e => updateJobDescription('comments', e.target.value)}
            rows={4}
            className="w-full"
          />
          {errors.comments && (
            <p className="mt-1 text-sm text-red-600">{errors.comments}</p>
          )}
        </div>

        {/* Assigned To and Job Owner - Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Job Owner - Single-select User Dropdown */}
          <SearchDropdown
            label="Job Owner"
            value={formData.job_description.job_owner}
            onChange={(selected: any) => {
              setSelectedJobOwner(selected);
              const owner = selected ? selected.value : '';
              onChange({
                job_description: {
                  ...formData.job_description,
                  job_owner: owner,
                  _job_owner_option: selected,
                },
              });
            }}
            options={jobOwnerOptionsWithSelected}
            loading={loadingJobOwner}
            onInputChange={(input: string) => searchJobOwner(input)}
            error={errors.job_owner}
            placeholder="Search and select job owner"
            isMulti={false}
            isSearchable={true}
            required
          />

          {/* Assigned To - Multi-select User Dropdown */}
          <SearchDropdown
            label="Assigned To"
            value={(formData.job_description.assigned_to || []).map((item: any) =>
              typeof item === 'string' ? item : item.value
            )}
            onChange={(selected: any) => {
              const selectedOptions = selected || [];
              setSelectedAssignedTo(selectedOptions);
              const users = selectedOptions.map((u: any) => u.value);
              onChange({
                job_description: {
                  ...formData.job_description,
                  assigned_to: users,
                  _assigned_to_options: selectedOptions,
                },
              });
            }}
            options={assignedToOptionsWithSelected}
            loading={loadingAssignedTo}
            onInputChange={(input: string) => searchAssignedTo(input)}
            error={errors.assigned_to}
            placeholder="Search and select users"
            isMulti={true}
            isSearchable={true}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionStep;
