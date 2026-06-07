import React, { useEffect, useState } from 'react';
import { FormField } from '../../atoms/FormField';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import { getNextJobId } from '../../../services/jobService';
import { useJobDropdowns } from '../../../hooks/useJobDropdowns';
import { DropdownOption } from '../../../types';

interface RequirementStepProps {
  formData: {
    requirement: any;
    [key: string]: any;
  };
  onChange: (updates: any) => void;
  errors?: Record<string, string>;
}

const RequirementStep: React.FC<RequirementStepProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  const [loadingJobId, setLoadingJobId] = useState(false);

  // Fetch job dropdowns from API
  const {
    jobTypes,
    employmentTypes,
    jobPriorities,
    jobStatuses,
    bgcTypes,
    preferredJobs,
    skillCategories,
    loading,
  } = useJobDropdowns();

  const updateRequirement = (field: any, value: any) => {
    onChange({
      requirement: {
        ...formData.requirement,
        [field]: value,
      },
    });
  };

  // Auto-generate job ID on mount if not already set
  useEffect(() => {
    if (!formData.requirement.job_id) {
      fetchJobId();
    }
  }, []);

  const fetchJobId = async () => {
    setLoadingJobId(true);
    try {
      const nextJobId = await getNextJobId();
      updateRequirement('job_id', nextJobId);
    } catch (error) {
      console.error('Failed to generate job ID:', error);
      // Optionally show an error message to the user
    } finally {
      setLoadingJobId(false);
    }
  };

  const handleRefreshJobId = async () => {
    await fetchJobId();
  };

  // Convert API dropdown options to DropdownOption format
  const jobTypeOptions: DropdownOption[] = jobTypes;
  const employmentTypeOptions: DropdownOption[] = employmentTypes;
  const priorityOptions: DropdownOption[] = jobPriorities;
  const statusOptions: DropdownOption[] = jobStatuses;
  const bgcTypeOptions: DropdownOption[] = bgcTypes;
  const preferredJobOptions: DropdownOption[] = preferredJobs;
  const skillCategoryOptions: DropdownOption[] = skillCategories;

  return (
    <div className="space-y-6">
      {/* Job ID and Main form fields - Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Auto-generated Job ID */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Job ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.requirement.job_id || 'Generating...'}
              disabled
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handleRefreshJobId}
              disabled={loadingJobId}
              className="flex items-center justify-center w-10 h-[44px] bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded border"
              title="Refresh Job ID"
            >
              {loadingJobId ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Auto-generated unique identifier
          </p>
        </div>

        {/* Main form fields */}
        <FormField
          label="Job Title"
          placeholder="Enter job title"
          value={formData.requirement.job_title}
          onChange={(value: string) => updateRequirement('job_title', value.charAt(0).toUpperCase() + value.slice(1))}
          error={errors.job_title}
          required
        />

        <SearchDropdown
          label="Preferred Job"
          placeholder="Select preferred job"
          value={formData.requirement.preferred_job}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            // If Lateral is selected, automatically set Bill Period to Annual
            if (value.toLowerCase() === 'fte') {
              onChange({
                requirement: {
                  ...formData.requirement,
                  preferred_job: value,
                },
                job_details: {
                  ...formData.job_details,
                  client_bill_period: 'Annual',
                },
              });
            } else {
              updateRequirement('preferred_job', value);
            }
          }}
          options={preferredJobOptions}
          error={errors.preferred_job}
          required
          isSearchable
          isClearable
        />

        <SearchDropdown
          label="Skill Category"
          placeholder="Select skill category"
          value={formData.requirement.skill_category}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateRequirement('skill_category', value);
          }}
          options={skillCategoryOptions}
          error={errors.skill_category}
          required
          isSearchable
          isClearable
        />

        <SearchDropdown
          label="Job Type"
          placeholder="Select job type"
          value={formData.requirement.job_type}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateRequirement('job_type', value);
          }}
          options={jobTypeOptions}
          required
          error={errors.job_type}
          isSearchable
          isClearable
        />

        <SearchDropdown
          label="Employment Type"
          placeholder="Select employment type"
          value={formData.requirement.employment_type}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateRequirement('employment_type', value);
          }}
          options={employmentTypeOptions}
          required
          error={errors.employment_type}
          isSearchable
          isClearable
        />

        <SearchDropdown
          label="Job Priority"
          placeholder="Select priority"
          value={formData.requirement.job_priority}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateRequirement('job_priority', value);
          }}
          options={priorityOptions}
          required
          error={errors.job_priority}
          isSearchable
          isClearable
        />

        <SearchDropdown
          label="Job Status"
          placeholder="Select status"
          value={formData.requirement.job_status}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateRequirement('job_status', value);
          }}
          options={statusOptions}
          error={errors.job_status}
          required
          isSearchable
          isClearable
          disabled
        />

        <FormField
          label="Received Date"
          type="date"
          value={formData.requirement.received_date}
          onChange={(value: string) =>
            updateRequirement('received_date', value)
          }
          error={errors.received_date}
          required
        />

        <SearchDropdown
          label="Background Check Type"
          placeholder="Select BGC type"
          value={formData.requirement.bgc_type}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateRequirement('bgc_type', value);
          }}
          options={bgcTypeOptions}
          error={errors.bgc_type}
          isSearchable
          isClearable
        />
      </div>
    </div>
  );
};

export default RequirementStep;
