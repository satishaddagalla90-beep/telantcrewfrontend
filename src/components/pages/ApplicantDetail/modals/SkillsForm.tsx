import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useSkillCategoriesDropdownSearchable } from '../../../../hooks/useDropdowns';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import SearchDropdown from '../../../molecules/SearchDropdown';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import { ValidationPatterns } from '../../../molecules/CommonFormFields/CommonFormFields';
import EnhancedTagsInput from '../../../molecules/EnhancedTagsInput';

interface SkillFormData {
  skill_name: string;
  skill_category: { id: string; name: string } | null;
  expertise: string;
  rating: string;
  experience: string | number;
}

interface SkillsFormProps {
  initialData: { skills: SkillFormData[]; primary_skill?: string; additional_skill?: string };
  onDataChange: (data: any) => void;
  skillsOptions: any[];
  skillsLoading: boolean;
  canUpdateCandidates: boolean;
  canDeleteCandidates: boolean;
  onValidationChange?: (isValid: boolean) => void;
  onSkillSearch?: (searchTerm: string) => void;
  dateOfBirth?: string; // Optional DOB for experience validation
}

// Expertise level options
const expertiseLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const SkillsFormInner = (props: SkillsFormProps, ref: React.Ref<any>) => {
  const {
    initialData,
    onDataChange,
    skillsOptions,
    skillsLoading,
    canUpdateCandidates,
    canDeleteCandidates,
    onValidationChange,
    onSkillSearch,
    dateOfBirth,
  } = props;

  const [data, setData] = useState(initialData);
  const [lastSentData, setLastSentData] = useState(initialData);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [formError, setFormError] = useState<string>('');

  // Helper function to parse skills string into array
  const parseSkillsString = (skillsString: string | undefined): string[] => {
    if (!skillsString) return [];
    return skillsString.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
  };

  // Helper function to filter out skills that exist in another list
  const filterOutSkills = (skillsString: string | undefined, skillsToRemove: string[]): string => {
    if (!skillsString) return '';
    const skillsToRemoveLower = skillsToRemove.map(s => s.toLowerCase());
    return skillsString
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !skillsToRemoveLower.includes(s.toLowerCase()))
      .join(',');
  };

  // Send updates when focus changes or when data changes significantly
  useEffect(() => {
    if (
      !focusedField &&
      JSON.stringify(data) !== JSON.stringify(lastSentData)
    ) {
      onDataChange(data);
      setLastSentData(data);
    }
  }, [data, lastSentData, focusedField, onDataChange]);

  // Trigger validation when errors change
  useEffect(() => {
    const hasErrors = Object.values(validationErrors).some(errors =>
      Object.values(errors).some(error => error !== '')
    );
    onValidationChange?.(!hasErrors);
  }, [validationErrors, onValidationChange]);

  // Helper function to calculate maximum possible experience based on DOB
  const calculateMaxExperience = useCallback(() => {
    if (!dateOfBirth) return 50; // Default max if no DOB provided

    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();

      console.log('DOB Validation Debug:', {
        dateOfBirth,
        parsedDOB: dob,
        today,
        isValidDate: !isNaN(dob.getTime())
      });

      // Validate that DOB is not in the future
      if (dob > today) {
        console.warn('DOB is in the future, using default max experience');
        return 50;
      }

      // Check if date is valid
      if (isNaN(dob.getTime())) {
        console.warn('Invalid DOB format, using default max experience');
        return 50;
      }

      // Calculate age in years (this is the actual age from DOB to today)
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      console.log('Age calculation:', { age, maxExperience: age });

      // Maximum experience = actual age (no minimum working age assumption)
      // User can have experience up to their actual age
      return Math.max(0, age);
    } catch (error) {
      console.error('Error calculating max experience from DOB:', error);
      return 50; // Fallback to default
    }
  }, [dateOfBirth]);

  const {
    options: skillCategoryOptions,
    loading: skillCategoryLoading,
    search: searchSkillCategory,
  } = useSkillCategoriesDropdownSearchable();

  // Validation functions
  const validateSkillField = useCallback(
    (index: number, field: string, value: any) => {
      let error = '';

      switch (field) {
        case 'skill_category':
          const categoryName = value && typeof value === 'object' ? (value as any).name : value;
          if (!categoryName || String(categoryName).trim() === '') {
            error = 'Skill Category is required';
          }
          break;
        case 'skill_name':
          if (!value || String(value).trim() === '') {
            error = 'Skill name is required';
          }
          break;
        case 'expertise':
          if (!value || String(value).trim() === '') {
            error = 'Expertise level is required';
          }
          break;
        case 'rating':
          if (value) {
            const rating = parseFloat(String(value));
            if (isNaN(rating) || rating < 1 || rating > 5) {
              error = 'Rating must be between 1 and 5';
            } else if (!Number.isInteger(rating)) {
              error = 'Rating must be a whole number';
            }
          }
          break;
        case 'experience':
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
          ) {
            const exp = parseFloat(String(value));
            if (isNaN(exp)) {
              error = 'Experience must be a valid number';
            } else if (exp < 1) {
              error = 'Experience must be at least 1 year';
            } else if (exp > 50) {
              // Hard cap: experience cannot exceed 50 years
              error = 'Experience cannot exceed 50 years';
            } else {
              // DOB-based validation: experience cannot exceed person's age
              const maxExp = calculateMaxExperience();
              if (exp > maxExp) {
                if (dateOfBirth) {
                  const formattedDOB = new Date(dateOfBirth).toLocaleDateString('en-GB');
                  error = `Experience cannot exceed ${maxExp} years (DOB: ${formattedDOB})`;
                } else {
                  error = `Experience cannot exceed ${maxExp} years`;
                }
              }
            }
          }
          break;
      }

      return error;
    },
    [dateOfBirth, calculateMaxExperience]
  );

  const handleSkillChange = useCallback(
    (index: number, field: keyof SkillFormData, value: any) => {
      let newValue = value;
      console.log('Handling skill change:', { index, field, value });

      // Handle dropdown fields to ensure we store labels/names, not IDs (except for categories)
      if (
        (field === 'skill_name' || field === 'expertise') &&
        typeof value === 'object' &&
        value !== null
      ) {
        newValue = value.label || value.name || value.value || value;
      } else if (
        (field === 'skill_name' || field === 'expertise') &&
        typeof value === 'string'
      ) {
        newValue = value;
      } else if (field === 'skill_category') {
        // Keep the object for categories to preserve IDs
        newValue = value;
      } else if (field === 'experience') {
        // Allow any input, validate later
        newValue = value;
      } else if (field === 'rating') {
        // Allow any input, validate later
        newValue = value;
      }
      const updatedSkills = [...data.skills];
      updatedSkills[index] = { ...updatedSkills[index], [field]: newValue };
      const newData = { ...data, skills: updatedSkills };

      setData(newData);

      // Validate field on change
      const error = validateSkillField(index, field, newValue);
      setValidationErrors(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: error,
        },
      }));

      // Immediately send data update for all fields to ensure patch API is called correctly
      onDataChange(newData);
      setLastSentData(newData);
    },
    [data, validateSkillField, onDataChange]
  );

  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  const handleAddSkill = () => {
    if (!canUpdateCandidates) {
      console.warn('User does not have permission to update candidate data');
      return;
    }
    const newData = {
      ...data,
      skills: [
        ...data.skills,
        {
          skill_name: '',
          skill_category: null,
          expertise: 'intermediate',
          rating: '1',
          experience: 0,
        },
      ],
    };
    setData(newData);
    // Immediately update for adding/removing skills
    onDataChange(newData);
    setLastSentData(newData);
  };

  const handleRemoveSkill = (index: number) => {
    if (!canDeleteCandidates) {
      console.warn('User does not have permission to delete candidate data');
      return;
    }
    const newData = {
      ...data,
      skills: data.skills.filter((_, i) => i !== index),
    };
    setData(newData);
    // Immediately update for adding/removing skills
    onDataChange(newData);
    setLastSentData(newData);
  };

  useImperativeHandle(ref, () => ({
    validateAllFields: () => {
      let hasError = false;
      setFormError('');

      // Check if at least primary skills OR skill metrics are provided
      const hasPrimarySkills = data.primary_skill && data.primary_skill.trim().length > 0;
      const hasSkillMetrics = data.skills && data.skills.length > 0;

      if (!hasPrimarySkills && !hasSkillMetrics) {
        setFormError('Please add at least one primary skill or skill metric.');
        return false;
      }

      // Only validate skill metrics if any exist
      if (hasSkillMetrics) {
        const newValidationErrors: Record<string, Record<string, string>> = {};
        data.skills.forEach((skill, index) => {
          const fields: (keyof SkillFormData)[] = [
            'skill_name',
            'expertise',
            'rating',
            'experience',
          ];
          newValidationErrors[index] = {};
          fields.forEach(field => {
            const error = validateSkillField(index, field, skill[field]);
            if (error) hasError = true;
            newValidationErrors[index][field] = error;
          });
        });
        setValidationErrors(newValidationErrors);
      }

      return !hasError;
    },
  }), [data, validateSkillField]);

  return (
    <div
      className="p-6 space-y-6"
      onFocus={e =>
        handleFocus(e.target.getAttribute('data-field') || 'unknown')
      }
      onBlur={handleBlur}
    >
      {formError && (
        <div className="mb-2 text-red-600 text-sm font-medium">{formError}</div>
      )}
      <div className="space-y-4">
        {data.skills.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50">
            <Icon name="star" size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No skill metrics added yet</p>
            <p className="text-gray-400 text-xs mt-1">Click "Add Skill" below to add skill metrics with expertise levels</p>
          </div>
        ) : (
          data.skills.map((skill, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-start md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg"
            >
              <SearchDropdown
                label="Skill Category"
                options={skillCategoryOptions}
                value={(typeof skill.skill_category === 'object' ? skill.skill_category?.name : skill.skill_category) || ''}
                onChange={(option: any) => {
                  handleSkillChange(index, 'skill_category', option ? { id: option.value || '', name: option.label || '' } : null);
                  setFocusedField(null);
                }}
                onInputChange={searchSkillCategory}
                loading={skillCategoryLoading}
                placeholder="Search for a category..."
                required
                error={validationErrors[index]?.skill_category}
                // showAddButton={true}
                // dropdownType="Skill Category"
                // dropdownLabel="Category"
              />
              <SearchDropdown
                label="Skill Name"
                options={skillsOptions}
                value={skill.skill_name}
                onChange={(option: any) => {
                  handleSkillChange(index, 'skill_name', option?.label || '');
                  setFocusedField(null);
                }}
                onInputChange={onSkillSearch}
                loading={skillsLoading}
                placeholder="Search for a skill..."
                required
                error={validationErrors[index]?.skill_name}
                showAddButton={true}
                dropdownType="SkillSets"
                dropdownLabel="Skill"
                onOptionAdded={newOption => {
                  // Refresh skills options if needed
                  console.log('New skill added:', newOption);
                }}
              />
              <EnhancedInputField
                label="Expertise Level"
                value={skill.expertise}
                onChange={value => handleSkillChange(index, 'expertise', value)}
                type="select"
                options={expertiseLevelOptions}
                placeholder="Select expertise level"
                required
                error={validationErrors[index]?.expertise}
              />
              <EnhancedInputField
                label="Rating (1-5)"
                type="number"
                value={skill.rating}
                required
                onChange={value => handleSkillChange(index, 'rating', value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === '.' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                error={validationErrors[index]?.rating}
              />
              <EnhancedInputField
                label="Experience (Years)"
                type="number"
                value={skill.experience.toString()}
                onChange={value =>
                  handleSkillChange(index, 'experience', parseFloat(value) || 0)
                }
                required
                error={validationErrors[index]?.experience}
              />
            </div>
          ))
        )}
      </div>
      <Button
        variant="outline"
        onClick={canUpdateCandidates ? handleAddSkill : undefined}
        disabled={!canUpdateCandidates}
        className="w-full"
      >
        <Icon name="plus" size={16} className="mr-2" />
        Add Skill
      </Button>

      {/* Primary Skills Section - Bulk Input */}
      <div className="mt-8 pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900">
            Primary Skills
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Add your primary/main skills (these must be different from secondary skills)
          </p>
        </div>
        <EnhancedTagsInput
          inputTags={data.primary_skill || ''}
          onTagsChange={(tags: string[]) => {
            const skillsString = tags.join(',');
            // When primary skills change, filter out any matching skills from secondary
            const filteredSecondary = filterOutSkills(data.additional_skill, tags);
            const newData = { ...data, primary_skill: skillsString, additional_skill: filteredSecondary };
            setData(newData);
            onDataChange(newData);
            setLastSentData(newData);
          }}
          id="bulk-primary-skills-edit"
          disabled={!canUpdateCandidates}
          placeholder="Type a skill and press Enter, comma, or space to add (e.g., React, Node.js, Python)"
          disablePaste={true}
        />
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <strong>
                {(() => {
                  const normalized = Array.isArray(data.primary_skill)
                    ? data.primary_skill.flat(Infinity).filter(Boolean).join(', ')
                    : data.primary_skill || '';
                  
                  return (normalized as string).split(',').filter((s: string) => s.trim()).length;
                })()}
              </strong>{' '}
              primary skill(s) added
            </p>
          </div>
      </div>

      {/* Secondary Skills Section - Bulk Input */}
      <div className="mt-8 pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900">
            Secondary Skills
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Add any secondary skills not listed in primary skills above
          </p>
        </div>
        <EnhancedTagsInput
          inputTags={data.additional_skill || ''}
          onTagsChange={(tags: string[]) => {
            // Filter out any skills that exist in primary skills
            const primarySkills = parseSkillsString(data.primary_skill);
            const filteredTags = tags.filter(tag => !primarySkills.includes(tag.toLowerCase()));
            const skillsString = filteredTags.join(',');
            const newData = { ...data, additional_skill: skillsString };
            setData(newData);
            onDataChange(newData);
            setLastSentData(newData);
          }}
          id="bulk-additional-skills-edit"
          disabled={!canUpdateCandidates}
          placeholder="Type a skill and press Enter, comma, or space to add (e.g., React, Node.js, Python)"
          disablePaste={true}
        />
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <strong>
                {(() => {
                  const normalized = Array.isArray(data.additional_skill)
                    ? data.additional_skill.flat(Infinity).filter(Boolean).join(', ')
                    : data.additional_skill || '';
                  
                  return (normalized as string).split(',').filter((s: string) => s.trim()).length;
                })()}
              </strong>{' '}
              secondary skill(s) added
            </p>
          </div>
      </div>
    </div>
  );
};

export const SkillsForm = forwardRef(SkillsFormInner);
