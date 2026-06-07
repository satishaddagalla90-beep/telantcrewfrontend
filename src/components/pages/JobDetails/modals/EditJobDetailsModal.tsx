import React, { useState, useEffect } from 'react';
import EditModal from '../../../molecules/EditModal/EditModal';
import { FormField } from '../../../atoms/FormField';
import SearchDropdown from '../../../molecules/SearchDropdown/SearchDropdown';
import Toggle from '../../../atoms/Toggle';
import { DropdownOption } from '../../../../types';
import { useJobDropdowns } from '../../../../hooks/useJobDropdowns';
import { useDropdownData } from '../../../../hooks/useDropdowns';
import EnhancedTagsInput from '../../../molecules/EnhancedTagsInput/EnhancedTagsInput';

interface JobDetailsData {
  primary_skill_set?: string[];
  skill_category?: string | string[];
  secondary_skill_set?: string[];
  total_experience?: number;
  relevant_experience?: number;
  preferred_job?: string;
  job_open_type?: string;
  bgc_type?: string;
  client_bill_rate?: number;
  client_bill_period?: string;
  no_of_position?: number;
  end_client_name?: string;
  degree?: string;
  education_criteria?: string;
  subject?: string;
  certification?: string;
  shifts?: string[];
  gender_preference?: string | string[];
  submission_limit?: number;
  tat?: string;
  diversity_hiring?: boolean;
  industry?: any[];
}

interface EditJobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobDetails: JobDetailsData;
  onSave: (data: Partial<JobDetailsData>) => Promise<void>;
  isLoading?: boolean;
}

interface JobDetailsFormState {
  primary_skill_set: string[];
  skill_category: string;
  secondary_skill_set: string[];
  total_experience: number;
  relevant_experience: number;
  preferred_job: string;
  job_open_type: string;
  bgc_type: string;
  client_bill_rate: number;
  client_bill_period: string;
  no_of_position: number;
  end_client_name: string;
  degree: string;
  subject: string;
  certification: string;
  shifts: string[];
  gender_preference: string;
  submission_limit: number;
  tat: string;
  diversity_hiring: boolean;
  industry: string[];
}

const EditJobDetailsModal: React.FC<EditJobDetailsModalProps> = ({
  isOpen,
  onClose,
  jobDetails,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<JobDetailsFormState>({
    primary_skill_set: [],
    skill_category: '',
    secondary_skill_set: [],
    total_experience: 0,
    relevant_experience: 0,
    preferred_job: '',
    job_open_type: '',
    bgc_type: '',
    client_bill_rate: 0,
    client_bill_period: '',
    no_of_position: 1,
    end_client_name: '',
    degree: '',
    subject: '',
    certification: '',
    shifts: [],
    gender_preference: '',
    submission_limit: 0,
    tat: '',
    diversity_hiring: false,
    industry: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize dropdowns from API
  const {
    billPeriods,
    genderPreferences,
    jobOpenTypes,
    shifts,
    bgcTypes,
    preferredJobs,
    skillCategories,
    industries,
  } = useJobDropdowns();

  // Degree dropdown
  const {
    options: degreeOptions,
    loading: degreeLoading,
  } = useDropdownData('degree');

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

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (isOpen && jobDetails) {
      // Helper function to convert ISO 8601 datetime to date format (YYYY-MM-DD)
      const formatDateForInput = (isoString: string | undefined): string => {
        if (!isoString) return '';
        try {
          return isoString.slice(0, 10);
        } catch (error) {
          console.error('Error formatting date:', error);
          return '';
        }
      };

      // Normalize gender_preference to option value (single select)
      const normalizeGenderPref = (): string => {
        const gp = jobDetails.gender_preference;
        if (!gp) return '';
        // Handle both string and array inputs
        let value = '';
        if (Array.isArray(gp)) {
          value = gp[0] || '';
        } else if (typeof gp === 'string') {
          value = gp;
        }
        // Map label to option value if needed
        const opt = genderPreferences.find(o => o.value === value || o.label === value);
        return opt ? opt.value : value;
      };

      // Extract Industry IDs
      const getIndustryIds = (): string[] => {
        if (!jobDetails.industry) return [];

        return jobDetails.industry.map((item: any) => {
          if (typeof item === 'object' && item?.id) return item.id;
          if (typeof item === 'string') {
            // If string, try to find matching ID in options
            const found = industries.find(opt => opt.value === item || opt.label === item);
            return found ? found.value : item;
          }
          return item;
        });
      };

      // Normalize skill_category to option value
      const normalizeSkillCategory = (): string => {
        // Handle potential field name variations
        const sc = jobDetails.skill_category || 
                   (jobDetails as any).skill_categories || 
                   (jobDetails as any).skillCategory ||
                   (jobDetails as any).skill_set_category;
        
        if (!sc) return '';
        
        let value = '';
        if (Array.isArray(sc)) {
          value = sc[0] || '';
        } else if (typeof sc === 'string') {
          value = sc;
        }

        if (!value) return '';

        // IMPORTANT: We use label as the primary identifier because 
        // the API response gives us strings, and some IDs in the dropdown 
        // are duplicates (e.g., CRM and Cyber Security have the same ID).
        const opt = skillCategories.find(o => 
          o.label.toLowerCase() === value.toLowerCase() ||
          o.value.toLowerCase() === value.toLowerCase()
        );
        
        const result = opt ? opt.label : value;

        return result;
      };

      setFormData({
        primary_skill_set: jobDetails.primary_skill_set || [],
        skill_category: normalizeSkillCategory(),
        secondary_skill_set: jobDetails.secondary_skill_set || [],
        total_experience: jobDetails.total_experience || 0,
        relevant_experience: jobDetails.relevant_experience || 0,
        preferred_job: jobDetails.preferred_job || '',
        job_open_type: jobDetails.job_open_type || '',
        bgc_type: jobDetails.bgc_type || '',
        client_bill_rate: jobDetails.client_bill_rate || 0,
        client_bill_period: jobDetails.client_bill_period || '',
        no_of_position: jobDetails.no_of_position || 1,
        end_client_name: jobDetails.end_client_name || '',
        degree: jobDetails.education_criteria || jobDetails.degree || '',
        subject: jobDetails.subject || '',
        certification: jobDetails.certification || '',
        shifts: jobDetails.shifts || [],
        gender_preference: normalizeGenderPref(),
        submission_limit: jobDetails.submission_limit || 0,
        tat: formatDateForInput(jobDetails.tat),
        diversity_hiring: jobDetails.diversity_hiring || false,
        industry: getIndustryIds(),
      });
      setErrors({});
    }
  }, [isOpen, jobDetails, industries, genderPreferences, skillCategories]);

  // Experience options (0-50 years)
  const experienceOptions: DropdownOption[] = Array.from({ length: 51 }, (_, i) => ({
    value: i.toString(),
    label: `${i} ${i === 1 ? 'Year' : 'Years'}`,
  }));

  const handleChange = (field: keyof JobDetailsFormState, value: any) => {
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

    // Primary skills required
    if (!formData.primary_skill_set || formData.primary_skill_set.length === 0) {
      newErrors.primary_skill_set = 'At least one primary skill is required';
    }

    // Total experience required
    if (formData.total_experience === undefined || formData.total_experience === null) {
      newErrors.total_experience = 'Total experience is required';
    }

    // Relevant experience validation
    if (formData.relevant_experience && formData.relevant_experience > formData.total_experience) {
      newErrors.relevant_experience = 'Relevant experience cannot exceed total experience';
    }

    // Preferred job required
    if (!formData.preferred_job?.trim()) {
      newErrors.preferred_job = 'Preferred job is required';
    }

    // Bill rate required
    if (!formData.client_bill_rate || formData.client_bill_rate <= 0) {
      newErrors.client_bill_rate = 'Client bill rate is required';
    }

    // Bill period required
    if (!formData.client_bill_period?.trim()) {
      newErrors.client_bill_period = 'Bill period is required';
    }

    // Number of positions required
    if (!formData.no_of_position || formData.no_of_position < 1) {
      newErrors.no_of_position = 'Number of positions must be at least 1';
    }

    // TAT (Turnaround Time) validation - Optional, but if present cannot be in the past
    if (formData.tat && formData.tat.trim() !== '') {
      const tatDate = new Date(formData.tat);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize to start of day for date-only comparison
      if (tatDate < now) {
        newErrors.tat = 'TAT must be a future date';
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
      // Map gender preference value (id) back to label for API payload
      const mapGenderToLabel = (val: string | undefined): string => {
        if (!val) return '';
        const opt = genderPreferences.find(o => o.value === val || o.label === val);
        return opt ? opt.label : val;
      };

      // Map Industry IDs to Labels
      const mapIndustryToLabels = (ids: string[] | undefined): string[] => {
        if (!ids || !ids.length) return [];
        return ids.map(id => {
          const found = industries.find(opt => opt.value === id);
          return found ? found.label : id;
        });
      };

      // Map Skill Category ID to Label
      const mapSkillCategoryToLabel = (val: string | undefined): string => {
        if (!val) return '';
        // If val is already a label (not in options), return it. 
        // If it's in options, return the label.
        const opt = skillCategories.find(o => o.value === val);
        return opt ? opt.label : val;
      };

      const dataToSave: Partial<JobDetailsData> = {
        primary_skill_set: formData.primary_skill_set,
        skill_category: mapSkillCategoryToLabel(formData.skill_category),
        secondary_skill_set: formData.secondary_skill_set,
        total_experience: formData.total_experience,
        relevant_experience: formData.relevant_experience,
        preferred_job: formData.preferred_job,
        job_open_type: formData.job_open_type,
        bgc_type: formData.bgc_type,
        client_bill_rate: formData.client_bill_rate,
        client_bill_period: formData.client_bill_period,
        no_of_position: formData.no_of_position,
        end_client_name: formData.end_client_name,
        education_criteria: formData.degree,
        subject: formData.subject,
        certification: formData.certification,
        shifts: formData.shifts,
        gender_preference: mapGenderToLabel(formData.gender_preference),
        submission_limit: formData.submission_limit,
        tat: formData.tat,
        diversity_hiring: formData.diversity_hiring,
        industry: mapIndustryToLabels(formData.industry),
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save job details:', error);
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
      title="Edit Job Details"
      isLoading={isSaving || isLoading}
      onSave={handleSave}
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skill Category - Full width */}
          <div className="md:col-span-3">
            <SearchDropdown
              label="Skill Category"
              placeholder="Select skill category"
              value={formData.skill_category || ''}
              onChange={(selected: any) => {
                const value = selected ? selected.label : '';
                handleChange('skill_category', value);
              }}
              options={skillCategories}
              error={errors.skill_category}
              isSearchable={true}
              isClearable={true}
              isMulti={false}
            />
          </div>

          {/* Primary Skills - Full width */}
          <div className="md:col-span-3">
            <EnhancedTagsInput
              label="Primary Skill Sets"
              inputTags={arrayToString(formData.primary_skill_set || [])}
              onTagsChange={(tags: string[]) => {
                handleChange('primary_skill_set', tags);
                const filteredSecondary = filterOutSkills(
                  formData.secondary_skill_set || [],
                  tags
                );
                if (filteredSecondary.length !== (formData.secondary_skill_set || []).length) {
                  handleChange('secondary_skill_set', filteredSecondary);
                }
              }}
              id="edit-primary-skills-input"
              error={errors.primary_skill_set}
              placeholder="Type a skill and press Enter, comma, or space to add"
              required
              disablePaste={true}
            />
          </div>

          {/* Secondary Skills - Full width */}
          <div className="md:col-span-3">
            <EnhancedTagsInput
              label="Secondary Skill Sets"
              inputTags={arrayToString(formData.secondary_skill_set || [])}
              onTagsChange={(tags: string[]) => {
                const filteredTags = filterOutSkills(tags, formData.primary_skill_set || []);
                handleChange('secondary_skill_set', filteredTags);
              }}
              id="edit-secondary-skills-input"
              error={errors.secondary_skill_set}
              placeholder="Type a skill and press Enter, comma, or space to add"
              disablePaste={true}
            />
          </div>

          <SearchDropdown
            label="Total Experience (Years)"
            value={formData.total_experience?.toString() || '0'}
            onChange={(selected: any) => {
              const exp = selected ? parseInt(selected.value) : 0;
              handleChange('total_experience', exp);
            }}
            options={experienceOptions}
            error={errors.total_experience}
            placeholder="Select total experience"
            isMulti={false}
            required
          />

          <SearchDropdown
            label="Relevant Experience (Years)"
            value={formData.relevant_experience?.toString() || ''}
            onChange={(selected: any) => {
              const exp = selected ? parseInt(selected.value) : 0;
              handleChange('relevant_experience', exp);
            }}
            options={experienceOptions}
            error={errors.relevant_experience}
            placeholder="Select relevant experience"
            isMulti={false}
          />

          <SearchDropdown
            label="Preferred Job"
            placeholder="Select preferred job"
            value={formData.preferred_job || ''}
            onChange={(selected: any) => {
              const value = selected ? selected.label : '';
              handleChange('preferred_job', value);
            }}
            options={preferredJobs}
            error={errors.preferred_job}
            required
            isSearchable
            isClearable
          />

          <SearchDropdown
            label="Job Open Type"
            placeholder="Select work mode"
            value={formData.job_open_type || ''}
            onChange={(selected: any) => {
              const value = selected ? selected.label : '';
              handleChange('job_open_type', value);
            }}
            options={jobOpenTypes}
            error={errors.job_open_type}
            isSearchable
            isClearable
          />

          <SearchDropdown
            label="BGC Type"
            placeholder="Select BGC type"
            value={formData.bgc_type || ''}
            onChange={(selected: any) => {
              const value = selected ? selected.label : '';
              handleChange('bgc_type', value);
            }}
            options={bgcTypes}
            error={errors.bgc_type}
            isSearchable
            isClearable
          />

          {/* Bill Rate / Period - Side by side */}
          <div className="flex gap-2">

            <div className="flex-1">
              <SearchDropdown
                label="Period"
                placeholder="Period"
                value={formData.client_bill_period}
                onChange={(selected: any) => {
                  const value = selected ? selected.label : '';
                  handleChange('client_bill_period', value);
                }}
                options={billPeriods}
                error={errors.client_bill_period}
                required
                isSearchable
                isClearable
              />
            </div>

            <div className="flex-1">
              <FormField
                label="Bill Rate"
                type="number"
                placeholder="Rate"
                value={formData.client_bill_rate.toString()}
                onChange={(value: string) =>
                  handleChange('client_bill_rate', parseFloat(value) || 0)
                }
                error={errors.client_bill_rate}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <FormField
            label="No. of Positions"
            type="number"
            placeholder="Enter number of positions"
            value={formData.no_of_position.toString()}
            onChange={(value: string) =>
              handleChange('no_of_position', parseInt(value) || 1)
            }
            error={errors.no_of_position}
            required
            min="1"
          />

          <FormField
            label="End Client"
            placeholder="Enter end client name"
            value={formData.end_client_name || ''}
            onChange={(value: string) => handleChange('end_client_name', value)}
            error={errors.end_client_name}
          />

          <SearchDropdown
            label="Degree"
            value={formData.degree || ''}
            onChange={(selected: any) => {
              const degree = selected ? selected.label : '';
              handleChange('degree', degree);
            }}
            options={degreeOptions}
            loading={degreeLoading}
            error={errors.degree}
            placeholder="Select degree"
            isMulti={false}
            isSearchable={true}
            isClearable
          />

          <FormField
            label="Subject"
            placeholder="e.g., Computer Science, Marketing"
            value={formData.subject || ''}
            onChange={(value: string) => handleChange('subject', value)}
            error={errors.subject}
          />

          <FormField
            label="Certification"
            placeholder="e.g., AWS Certified, PMP"
            value={formData.certification || ''}
            onChange={(value: string) => handleChange('certification', value)}
            error={errors.certification}
          />

          <SearchDropdown
            label="Shifts"
            placeholder="Select shift type(s)"
            value={formData.shifts || []}
            onChange={(selected: any) => {
              const value = selected ? selected.map((item: any) => item.label) : [];
              handleChange('shifts', value);
            }}
            options={shifts}
            error={errors.shifts}
            isSearchable
            isClearable
            isMulti={true}
          />

          <SearchDropdown
            label="Gender Preference"
            placeholder="Select gender preference"
            value={formData.gender_preference || ''}
            onChange={(selected: any) => {
              const value = selected ? selected.value : '';
              handleChange('gender_preference', value);
            }}
            isMulti={false}
            options={genderPreferences}
            error={errors.gender_preference}
            isSearchable
            isClearable
          />

          <SearchDropdown
            label="Industry"
            placeholder="Select industries"
            value={formData.industry || []}
            onChange={(selected: any) => {
              const value = selected ? selected.map((i: any) => i.value) : [];
              handleChange('industry', value);
            }}
            options={[
              // Merge current job industries (to ensure labels exist) with API options
              ...(jobDetails.industry || []).map((item: any) => {
                if (typeof item === 'object' && item.id && item.name) {
                  return { value: item.id, label: item.name };
                }
                return null;
              }).filter(Boolean),
              ...industries
            ].filter((v, i, a) => a.findIndex(t => (t as any).value === (v as any).value) === i) as any}
            error={errors.industry}
            isSearchable
            isClearable
            isMulti={true}
          />

          <FormField
            label="Submission Limit"
            type="number"
            placeholder="Enter submission limit"
            value={formData.submission_limit?.toString() || ''}
            onChange={(value: string) =>
              handleChange('submission_limit', parseInt(value) || 0)
            }
            error={errors.submission_limit}
            min="0"
          />

          <FormField
            label="TAT (Turnaround Time)"
            type="date"
            value={formData.tat || ''}
            onChange={(value: string) => handleChange('tat', value)}
            error={errors.tat}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        {/* Diversity Hiring */}
        <div className="mt-6">
          <div className="flex items-center space-x-3">
            <Toggle
              checked={formData.diversity_hiring || false}
              onCheckedChange={(checked: boolean) =>
                handleChange('diversity_hiring', checked)
              }
            />
            <label className="text-sm font-medium text-gray-700">
              Diversity Hiring
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enable if this position is part of a diversity hiring initiative
          </p>
        </div>
      </div>
    </EditModal>
  );
};

export default EditJobDetailsModal;
