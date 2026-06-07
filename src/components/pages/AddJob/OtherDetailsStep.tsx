import React, { useState, useCallback, useEffect } from 'react';
import { FormField } from '../../atoms/FormField';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import Toggle from '../../atoms/Toggle';
import { JobDetailsAPI } from '../../../types/job';
import { DropdownOption } from '../../../types';
import { useJobDropdowns } from '../../../hooks/useJobDropdowns';
import { useDropdownData } from '../../../hooks/useDropdowns';
import { useCountriesNowCitiesDropdown } from '../../../hooks/useCitiesDropdown';
import EnhancedTagsInput from '../../molecules/EnhancedTagsInput/EnhancedTagsInput';
import { dropdownAPI } from '../../../utils/api/dropdowns';

interface OtherDetailsStepProps {
  formData: {
    job_details: JobDetailsAPI;
    requirement?: {
      preferred_job?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  onChange: (updates: any) => void;
  errors?: Record<string, string>;
}

const OtherDetailsStep: React.FC<OtherDetailsStepProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  // Check if preferred job is Lateral (for auto-setting bill period)
  const isLateralJob = formData.requirement?.preferred_job?.toLowerCase() === 'fte';

  // State for cascading Degree → Subject dropdown
  const [selectedDegreeId, setSelectedDegreeId] = useState<string | undefined>(undefined);
  const [subjectOptions, setSubjectOptions] = useState<DropdownOption[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  // Fetch dropdowns from API
  const {
    billPeriods,
    genderPreferences,
    jobOpenTypes,
    shifts,
    industries,
  } = useJobDropdowns();

  // Use countriesnow.space API for job location (same as Add Applicant)
  const {
    options: locationOptions,
    loading: locationsLoading,
    search: searchLocations,
    loadMore: loadMoreLocations,
    hasMore: hasMoreLocations,
  } = useCountriesNowCitiesDropdown();

  // Degree dropdown
  const {
    options: degreeOptions,
    loading: degreeLoading,
  } = useDropdownData('degree');

  // Fetch subject options based on selected degree
  const fetchSubjectOptions = useCallback(
    async (degreeId: string, searchTerm: string = '') => {
      if (!degreeId) {
        setSubjectOptions([]);
        setSubjectLoading(false);
        return;
      }

      setSubjectLoading(true);

      try {
        const options = await dropdownAPI.fetchCandidateDropdownSearchable(
          'Subject',
          searchTerm,
          1,
          50,
          { degree: degreeId }
        );

        setSubjectOptions(options);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjectOptions([]);
      } finally {
        setSubjectLoading(false);
      }
    },
    []
  );

  // Initialize subject options when degree is pre-filled (only when degreeOptions loads)
  useEffect(() => {
    if (formData.job_details.degree && degreeOptions.length > 0 && !selectedDegreeId) {
      const selectedDegree = degreeOptions.find(
        opt => opt.label === formData.job_details.degree || opt.value === formData.job_details.degree
      );

      if (selectedDegree && selectedDegree.id) {
        setSelectedDegreeId(selectedDegree.id);
        fetchSubjectOptions(selectedDegree.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [degreeOptions]);

  const updateJobDetails = (field: keyof JobDetailsAPI, value: any) => {
    onChange({
      job_details: {
        ...formData.job_details,
        [field]: value,
      },
    });
  };

  // Experience options (0-50 years)
  const experienceOptions: DropdownOption[] = Array.from({ length: 51 }, (_, i) => ({
    value: i.toString(),
    label: `${i} ${i === 1 ? 'Year' : 'Years'}`,
  }));

  const billPeriodOptions: DropdownOption[] = billPeriods;
  const genderOptions: DropdownOption[] = genderPreferences;
  const jobOpenTypeOptions: DropdownOption[] = jobOpenTypes;
  const shiftsOptions: DropdownOption[] = shifts;
  const industryOptions: DropdownOption[] = industries;

  // Helper function to convert array to comma-separated string
  const arrayToString = (arr: string[]): string => {
    return arr ? arr.join(',') : '';
  };

  // Helper function to filter out skills that exist in another list
  const filterOutSkills = (skillsArray: string[], skillsToRemove: string[]): string[] => {
    if (!skillsArray || skillsArray.length === 0) return [];
    const skillsToRemoveLower = skillsToRemove.map(s => s.toLowerCase());
    return skillsArray.filter(s => s && !skillsToRemoveLower.includes(s.toLowerCase()));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Skills - Tag Input with Suggestions */}
        <div className="md:col-span-3">
          <EnhancedTagsInput
            label="Primary Skill Sets"
            inputTags={arrayToString(formData.job_details.primary_skill_set || [])}
            onTagsChange={(tags: string[]) => {
              updateJobDetails('primary_skill_set', tags);
              // When primary skills change, filter out any matching skills from secondary
              const filteredSecondary = filterOutSkills(
                formData.job_details.secondary_skill_set || [],
                tags
              );
              if (filteredSecondary.length !== (formData.job_details.secondary_skill_set || []).length) {
                updateJobDetails('secondary_skill_set', filteredSecondary);
              }
            }}
            id="primary-skills-input"
            error={errors.primary_skill_set}
            placeholder="Type a skill and press Enter, comma, or space to add (e.g., React, Node.js, Python)"
            required
            disablePaste={true}
          />
          {formData.job_details.primary_skill_set && formData.job_details.primary_skill_set.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                <strong>{formData.job_details.primary_skill_set.length}</strong>{' '}
                primary skill{formData.job_details.primary_skill_set.length !== 1 ? 's' : ''} added
              </p>
            </div>
          )}
        </div>

        {/* Secondary Skills - Tag Input with Suggestions */}
        <div className="md:col-span-3">
          <EnhancedTagsInput
            label="Secondary Skill Sets"
            inputTags={arrayToString(formData.job_details.secondary_skill_set || [])}
            onTagsChange={(tags: string[]) => {
              // Filter out any skills that exist in primary skills
              const primarySkills = formData.job_details.primary_skill_set || [];
              const filteredTags = filterOutSkills(tags, primarySkills);
              updateJobDetails('secondary_skill_set', filteredTags);
            }}
            id="secondary-skills-input"
            error={errors.secondary_skill_set}
            placeholder="Type a skill and press Enter, comma, or space to add (e.g., AWS, Docker, Kubernetes)"
            disablePaste={true}
          />
          {formData.job_details.secondary_skill_set && formData.job_details.secondary_skill_set.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                <strong>{formData.job_details.secondary_skill_set.length}</strong>{' '}
                secondary skill{formData.job_details.secondary_skill_set.length !== 1 ? 's' : ''} added
              </p>
            </div>
          )}
        </div>

        {/* Total Experience - Dropdown */}
        <SearchDropdown
          label="Total Experience (Years)"
          value={formData.job_details.total_experience?.toString() || '0'}
          onChange={(selected: any) => {
            const exp = selected ? parseInt(selected.value) : 0;
            updateJobDetails('total_experience', exp);
          }}
          options={experienceOptions}
          error={errors.total_experience}
          placeholder="Select total experience"
          isMulti={false}
          required
        />

        {/* Relevant Experience - Dropdown */}
        <SearchDropdown
          label="Relevant Experience (Years)"
          value={formData.job_details.relevant_experience?.toString() || ''}
          onChange={(selected: any) => {
            const exp = selected ? parseInt(selected.value) : 0;
            updateJobDetails('relevant_experience', exp);
          }}
          options={experienceOptions}
          error={errors.relevant_experience}
          placeholder="Select relevant experience"
          isMulti={false}
        />

        {/* Job Location - Multi-select dropdown using countriesnow.space API */}
        <SearchDropdown
          label="Job Location"
          value={
            Array.isArray(formData.job_details.job_location)
              ? formData.job_details.job_location
              : formData.job_details.job_location
                ? [formData.job_details.job_location]
                : []
          }
          onChange={(selected: any) => {
            if (Array.isArray(selected)) {
              const locations = selected.map((item: any) => item.value);
              updateJobDetails('job_location', locations);
            } else {
              const location = selected ? [selected.value] : [];
              updateJobDetails('job_location', location);
            }
          }}
          options={[
            { label: 'PAN India', value: 'PAN India' },
            ...locationOptions
          ]}
          loading={locationsLoading}
          onInputChange={(input: string) => searchLocations(input)}
          error={errors.job_location}
          placeholder="Search and select job location"
          isMulti={true}
          isSearchable={true}
          required
          onMenuScrollToBottom={() => {
            if (hasMoreLocations) loadMoreLocations();
          }}
        />

        {/* Number of Positions */}
        <FormField
          label="No. of Positions"
          type="number"
          placeholder="Enter number of positions"
          value={formData.job_details.no_of_position.toString()}
          onChange={(value: string) =>
            updateJobDetails('no_of_position', parseInt(value) || 1)
          }
          error={errors.no_of_position}
          required
          min="1"
        />

        {/* Submission Limit */}
        <FormField
          label="Submission Limit"
          type="number"
          placeholder="Enter submission limit"
          value={formData.job_details.submission_limit?.toString() || ''}
          onChange={(value: string) =>
            updateJobDetails('submission_limit', parseInt(value) || 0)
          }
          error={errors.submission_limit}
          min="0"
        />

        {/* TAT - Date and Time Picker */}
        <FormField
          label="TAT (Turnaround Time)"
          type="date"
          value={formData.job_details.tat || ''}
          onChange={(value: string) => updateJobDetails('tat', value)}
          error={errors.tat}
          min={new Date().toISOString().slice(0, 10)}
        />

        {/* Shifts */}
        <SearchDropdown
          label="Shifts"
          placeholder="Select shift type(s)"
          value={formData.job_details.shifts || []}
          onChange={(selected: any) => {
            const value = selected ? selected.map((item: any) => item.label) : [];
            updateJobDetails('shifts', value);
          }}
          options={shiftsOptions}
          error={errors.shifts}
          isSearchable
          isClearable
          isMulti={true}
        />

        {/* Client Bill Period */}
        <SearchDropdown
          label="Client Bill Period"
          placeholder="Select bill period"
          value={formData.job_details.client_bill_period}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateJobDetails('client_bill_period', value);
          }}
          options={billPeriodOptions}
          error={errors.client_bill_period}
          required
          isSearchable
          isClearable={!isLateralJob}
          disabled={isLateralJob}
        />
        {isLateralJob && (
          <p className="text-xs text-gray-500 -mt-4 col-span-1">
            Bill period is automatically set to Annual for Lateral positions
          </p>
        )}

        {/* Client Bill Rate */}
        <FormField
          label="Client Bill Rate"
          type="number"
          placeholder="Enter bill rate"
          value={formData.job_details.client_bill_rate.toString()}
          onChange={(value: string) =>
            updateJobDetails('client_bill_rate', parseFloat(value) || 0)
          }
          error={errors.client_bill_rate}
          required
          min="0"
          step="0.01"
        />

        {/* Gender Preference - Multi-select */}
        <SearchDropdown
          label="Gender Preference"
          placeholder="Select gender preference"
          value={formData.job_details.gender_preference || ''}
          onChange={(selected: any) => {
            const value = selected ? selected.value : '';
            updateJobDetails('gender_preference', value);
          }}
          options={genderOptions}
          error={errors.gender_preference}
          isMulti={false}
          isSearchable
          isClearable
        />

        {/* Job Open Type */}
        <SearchDropdown
          label="Job Open Type"
          placeholder="Select work mode"
          value={formData.job_details.job_open_type || ''}
          onChange={(selected: any) => {
            const value = selected ? selected.label : '';
            updateJobDetails('job_open_type', value);
          }}
          options={jobOpenTypeOptions}
          error={errors.job_open_type}
          isSearchable
          isClearable
          required
        />

        {/* Industry - Multi-select */}
        <div>
          <SearchDropdown
            label="Industry"
            value={formData.job_details.industry || []}
            onChange={(selected: any) => {
              const industries = selected ? selected.map((i: any) => i.value) : [];
              updateJobDetails('industry', industries);
            }}
            options={industryOptions}
            error={errors.industry}
            placeholder="Select industries"
            isMulti={true}
          />
        </div>

        {/* Degree */}
        <SearchDropdown
          label="Degree"
          value={formData.job_details.degree || ''}
          onChange={(selected: any) => {
            const degree = selected ? selected.label : '';
            const degreeId = selected ? (selected.id || selected.value) : '';

            // Clear subjects first
            setSubjectOptions([]);

            // Update degree field and clear subject in a single onChange call
            onChange({
              job_details: {
                ...formData.job_details,
                degree: degree,
                subject: '', // Always clear subject when degree changes
              },
            });

            // Update selected degree ID
            setSelectedDegreeId(degreeId);

            // Fetch subjects for the selected degree
            if (degreeId) {
              fetchSubjectOptions(degreeId);
            }
          }}
          options={degreeOptions}
          loading={degreeLoading}
          error={errors.degree}
          placeholder="Select degree"
          isMulti={false}
          isSearchable={true}
          isClearable
        />

        {/* Subject - Cascading dropdown based on selected degree */}
        <SearchDropdown
          label="Subject"
          value={formData.job_details.subject || ''}
          onChange={(selected: any) => {
            const subject = selected ? selected.label : '';
            updateJobDetails('subject', subject);
          }}
          options={subjectOptions}
          loading={subjectLoading}
          onInputChange={(input: string) => {
            if (selectedDegreeId) {
              fetchSubjectOptions(selectedDegreeId, input);
            }
          }}
          error={errors.subject}
          placeholder={selectedDegreeId ? "Search and select subject" : "Select degree first"}
          isMulti={false}
          isSearchable={true}
          isClearable
          disabled={!selectedDegreeId}
        />

        {/* Certification */}
        <FormField
          label="Certification"
          placeholder="e.g., AWS Certified, PMP"
          value={formData.job_details.certification || ''}
          onChange={(value: string) => updateJobDetails('certification', value)}
          error={errors.certification}
        />
      </div>

      {/* Premium Institute Checkbox */}
      <div className="mt-6">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="premium_institute"
            checked={formData.job_details.premium_institute || false}
            onChange={(e) => updateJobDetails('premium_institute', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="premium_institute" className="text-sm font-medium text-gray-700">
            Premium Institute Only
          </label>
        </div>
      </div>

      {/* Diversity Hiring */}
      <div className="mt-6">
        <div className="flex items-center space-x-3">
          <Toggle
            checked={formData.job_details.diversity_hiring || false}
            onCheckedChange={(checked: boolean) =>
              updateJobDetails('diversity_hiring', checked)
            }
          />
          <label className="text-sm font-medium text-gray-700">
            Diversity Hiring
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Enable if this position is part of a diversity hiring initiative
        </p>
        {errors.diversity_hiring && (
          <p className="mt-1 text-sm text-red-600">{errors.diversity_hiring}</p>
        )}
      </div>
    </div>
  );
};

export default OtherDetailsStep;
