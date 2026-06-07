import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckboxField } from '../../molecules/CommonFormFields/CommonFormFields';
import EnhancedInputField from '../../molecules/EnhancedInputField';
import AsyncSelect from '../../atoms/AsyncSelect/AsyncSelect';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import Tabs, { TabItem } from '../../atoms/Tabs/Tabs';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon/Icon';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';
import EnhancedTagsInput from '../../molecules/EnhancedTagsInput';
import { showWarningToast } from '../../../utils/toast';
import {
  useUniversitiesDropdown,
  useCollegesDropdown,
  useDegreesDropdown,
  useEducationTypesDropdown,
  useSkillCategoriesDropdownSearchable,
  useSubjectsDropdown,
  useSkillsDropdown,
  useStaticDropdowns,
} from '../../../hooks/useDropdowns';
import {
  transformEducationForAPI,
  transformSkillForAPI,
} from '../../../utils/apiDataTransform';
import { dropdownAPI } from '../../../utils/api/dropdowns';
import debounce from 'lodash/debounce';
import { EDUCATION_TYPE_IDS, EDUCATION_LEVELS } from '../../../constants/educationConstants';

// Props interface for step components
interface StepComponentProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onNext?: () => void;
  onPrevious?: () => void;
  currentStep?: number;
  totalSteps?: number;
  onFileUpload?: any;
  uploadStates?: any;
}

// Education and Skill interfaces
interface Education {
  id: string;
  educationType: string;
  highestDegree: string;
  subject: string[];
  college: string;
  university: string;
  gpa: string;
  yearOfPassing: string;
  isPursuing: boolean;
}

interface Skill {
  id: string;
  skillName: string;
  skillCategory: any;
  // allow empty string as initial value so users must explicitly choose expertise
  expertise: '' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rating: string;
  experience: string;
}

const EducationSkillsStep: React.FC<StepComponentProps> = ({
  formData,
  onChange,
  errors,
  touched,
}) => {
  // Use searchable dropdown for education types
  const {
    options: educationTypeOptions,
    loading: educationTypeLoading,
    error: educationTypeError,
    search: searchEducationType,
  } = useEducationTypesDropdown();

  const {
    options: skillCategoryOptions,
    loading: skillCategoryLoading,
    search: searchSkillCategory,
  } = useSkillCategoriesDropdownSearchable();

  const [currentEducationTypeId, setCurrentEducationTypeId] =
    useState<string>('');
  const [currentDegreeId, setCurrentDegreeId] = useState<string>('');

  // State for cascading dropdowns (per education form entry)
  const [cascadingDropdowns, setCascadingDropdowns] = useState<
    Record<
      string, // Use formId as key
      {
        degreeOptions: any[];
        degreeLoading: boolean;
        subjectOptions: any[];
        subjectLoading: boolean;
        selectedSubjects?: any[]; // Store selected subject objects (with labels)
      }
    >
  >({});

  // Tab management
  const [activeTab, setActiveTab] = useState('education');

  // Education management
  const [educationHistory, setEducationHistory] = useState<Education[]>(
    formData.educationHistory || []
  );

  // Track multiple education forms being filled
  const [activeEducationForms, setActiveEducationForms] = useState<Education[]>(
    () => {
      // Show initial form only if no education history exists
      if (
        !formData.educationHistory ||
        formData.educationHistory.length === 0
      ) {
        return [
          {
            id: `temp-education-initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            educationType: '',
            highestDegree: '',
            subject: [],
            college: '',
            university: '',
            gpa: '',
            yearOfPassing: '',
            isPursuing: false,
          },
        ];
      }
      return [];
    }
  );

  // Use hierarchical searchable dropdowns for degree and subject
  const {
    options: degreeOptions,
    loading: degreeLoading,
    error: degreeError,
    search: searchDegree,
  } = useDegreesDropdown(currentEducationTypeId);

  const {
    options: subjectOptions,
    loading: subjectLoading,
    error: subjectError,
    search: searchSubject,
  } = useSubjectsDropdown(currentDegreeId);

  // Use searchable dropdowns for college and university
  const {
    options: collegeOptions,
    loading: collegeLoading,
    error: collegeError,
    search: searchCollege,
  } = useCollegesDropdown();

  const {
    options: universityOptions,
    loading: universityLoading,
    error: universityError,
    search: searchUniversity,
  } = useUniversitiesDropdown();

  // Use searchable skills dropdown
  const {
    options: skillOptions,
    loading: skillLoading,
    error: skillError,
    search: searchSkill,
  } = useSkillsDropdown();

  // Skill management
  const [skillMetrics, setSkillMetrics] = useState<Skill[]>(
    formData.skillMetrics || []
  );

  // Separate state for bulk primary skills (comma-separated string)
  const [primarySkills, setPrimarySkills] = useState<string>(
    formData.primarySkills || ''
  );

  // Separate state for bulk additional/secondary skills (comma-separated string)
  const [skillCategory, setSkillCategory] = useState<any>(
    formData.skillCategory || null
  );
  const [additionalSkills, setAdditionalSkills] = useState<string>(
    formData.additionalSkills || ''
  );

  // Helper function to parse skills string into array
  const parseSkillsString = (skillsString: string): string[] => {
    if (!skillsString) return [];
    return skillsString.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
  };

  // Helper function to filter out skills that exist in another list
  const filterOutSkills = (skillsString: string, skillsToRemove: string[]): string => {
    if (!skillsString) return '';
    const skillsToRemoveLower = skillsToRemove.map(s => s.toLowerCase());
    return skillsString
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !skillsToRemoveLower.includes(s.toLowerCase()))
      .join(',');
  };

  // Track multiple skill forms being filled
  const [activeSkillForms, setActiveSkillForms] = useState<Skill[]>(() => {
    // Show initial form only if no skill metrics exist
    if (!formData.skillMetrics || formData.skillMetrics.length === 0) {
      return [
        {
          id: `temp-skill-initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          skillName: '',
          skillCategory: null,
          expertise: '',
          rating: '',
          experience: '',
        },
      ];
    }
    return [];
  });

  // Track touched fields for each education form (for live validation)
  const [educationTouched, setEducationTouched] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // Track touched fields for each skill form (for live validation)
  const [skillTouched, setSkillTouched] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // Sync local state with formData changes
  useEffect(() => {
    if (formData.educationHistory && Array.isArray(formData.educationHistory)) {
      setEducationHistory(formData.educationHistory);
    }
  }, [formData.educationHistory]);

  useEffect(() => {
    if (formData.skillMetrics && Array.isArray(formData.skillMetrics)) {
      setSkillMetrics(formData.skillMetrics);
    }
  }, [formData.skillMetrics]);

  // Sync additionalSkills state with formData changes
  useEffect(() => {
    if (
      formData.additionalSkills !== undefined &&
      formData.additionalSkills !== additionalSkills
    ) {
      setAdditionalSkills(formData.additionalSkills || '');
    }
  }, [formData.additionalSkills]);

  // Sync primarySkills state with formData changes
  useEffect(() => {
    if (
      formData.primarySkills !== undefined &&
      formData.primarySkills !== primarySkills
    ) {
      setPrimarySkills(formData.primarySkills || '');
    }
  }, [formData.primarySkills]);

  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Add saving states to prevent double-clicking on save buttons
  const [isSavingEducation, setIsSavingEducation] = useState<{
    [key: string]: boolean;
  }>({});
  const [isSavingSkill, setIsSavingSkill] = useState<{
    [key: string]: boolean;
  }>({});
  const tabs: TabItem[] = [
    {
      id: 'education',
      label: 'Education',
      count: educationHistory.length,
    },
    {
      id: 'skills',
      label: 'Skills',
      count: skillMetrics.length,
    },
  ];

  // Fetch degree options based on education type (no caching to ensure fresh data)
  const fetchDegreeOptions = useCallback(
    async (
      formId: string,
      educationTypeId: string,
      searchTerm: string = ''
    ) => {
      if (!educationTypeId) {
        setCascadingDropdowns(prev => ({
          ...prev,
          [formId]: {
            ...prev[formId],
            degreeOptions: [],
            degreeLoading: false,
          },
        }));
        return;
      }

      setCascadingDropdowns(prev => ({
        ...prev,
        [formId]: {
          ...prev[formId],
          degreeLoading: true,
        },
      }));

      try {
        const options = await dropdownAPI.fetchCandidateDropdownSearchable(
          'Degree',
          searchTerm,
          1,
          1000, // Increased limit to get all data
          { search: educationTypeId }
        );

        setCascadingDropdowns(prev => ({
          ...prev,
          [formId]: {
            ...prev[formId],
            degreeOptions: options,
            degreeLoading: false,
          },
        }));
      } catch (error) {
        console.error('Error fetching degree options:', error);
        setCascadingDropdowns(prev => ({
          ...prev,
          [formId]: {
            ...prev[formId],
            degreeOptions: [],
            degreeLoading: false,
          },
        }));
      }
    },
    []
  );

  // Fetch subject options based on degree (no caching to ensure fresh data)
  const fetchSubjectOptions = useCallback(
    async (formId: string, degreeId: string, searchTerm: string = '') => {
      // if (!degreeId) {
      //   setCascadingDropdowns(prev => ({
      //     ...prev,
      //     [formId]: {
      //       ...prev[formId],
      //       subjectOptions: [],
      //       subjectLoading: false,
      //     },
      //   }));
      //   return;
      // }

      setCascadingDropdowns(prev => ({
        ...prev,
        [formId]: {
          ...prev[formId],
          subjectLoading: true,
        },
      }));

      try {
        const options = await dropdownAPI.fetchCandidateDropdownSearchable(
          'Subject',
          searchTerm,
          1,
          20, // Limit matching backend response
          // { search: degreeId }
          {}
        );

        setCascadingDropdowns(prev => ({
          ...prev,
          [formId]: {
            ...prev[formId],
            subjectOptions: options,
            subjectLoading: false,
          },
        }));
      } catch (error) {
        console.error('Error fetching subject options:', error);
        setCascadingDropdowns(prev => ({
          ...prev,
          [formId]: {
            ...prev[formId],
            subjectOptions: [],
            subjectLoading: false,
          },
        }));
      }
    },
    []
  );

  // Use refs to store debounced functions persistently
  const debouncedDegreeSearchRefs = useRef<
    Record<string, ReturnType<typeof debounce>>
  >({});
  const debouncedSubjectSearchRefs = useRef<
    Record<string, ReturnType<typeof debounce>>
  >({});

  // Get or create debounced search function for degree
  const getDebouncedDegreeSearch = useCallback(
    (formId: string, educationTypeId: string) => {
      const key = `${formId}-${educationTypeId}`;
      if (!debouncedDegreeSearchRefs.current[key]) {
        debouncedDegreeSearchRefs.current[key] = debounce(
          (searchTerm: string) => {
            if (educationTypeId) {
              fetchDegreeOptions(formId, educationTypeId, searchTerm);
            }
          },
          400
        );
      }
      return debouncedDegreeSearchRefs.current[key];
    },
    [fetchDegreeOptions]
  );

  // Get or create debounced search function for subject
  const getDebouncedSubjectSearch = useCallback(
    (formId: string, degreeId: string) => {
      const key = `${formId}-${degreeId}`;
      if (!debouncedSubjectSearchRefs.current[key]) {
        debouncedSubjectSearchRefs.current[key] = debounce(
          (searchTerm: string) => {
            // if (degreeId) {
            fetchSubjectOptions(formId, degreeId, searchTerm);
            // }
          },
          400
        );
      }
      return debouncedSubjectSearchRefs.current[key];
    },
    [fetchSubjectOptions]
  );

  // Mark education field as touched
  const markEducationFieldTouched = (
    formId: string,
    field: keyof Education
  ) => {
    setEducationTouched(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: true,
      },
    }));
  };

  const updateEducationForm = (
    formId: string,
    field: keyof Education,
    value:
      | {
        id: string;
        label: string;
        value: string;
      }
      | boolean
      | string
      | string[] // Add support for string array (for subject field)
  ) => {
    // Mark field as touched when value changes
    markEducationFieldTouched(formId, field);

    setActiveEducationForms(forms =>
      forms.map(form => {
        if (form.id !== formId) return form;

        // Handle hierarchical dependencies with cascading
        if (field === 'educationType') {
          // Extract value whether it's an object or string
          const educationTypeId =
            typeof value === 'object' && value !== null && !Array.isArray(value)
              ? (value as any).value || (value as any).id || ''
              : (value as string);

          // Clear cached debounced functions for this form when education type changes
          // This ensures search uses the new education type
          Object.keys(debouncedDegreeSearchRefs.current).forEach(key => {
            if (key.startsWith(`${formId}-`)) {
              delete debouncedDegreeSearchRefs.current[key];
            }
          });

          // Fetch degree options based on selected education type
          if (educationTypeId) {
            fetchDegreeOptions(formId, educationTypeId);
          } else {
            // Clear degree and subject options if education type is cleared
            setCascadingDropdowns(prev => ({
              ...prev,
              [formId]: {
                degreeOptions: [],
                degreeLoading: false,
                subjectOptions: [],
                subjectLoading: false,
              },
            }));
          }

          // Clear dependent fields when education type changes
          return {
            ...form,
            educationType: educationTypeId,
            highestDegree: '', // Clear degree when education type changes
            subject: [], // Clear subject when education type changes
            college: '', // Clear college when education type changes
          };
        }

        if (field === 'highestDegree' && typeof value === 'string') {
          // Find the degree ID from the selected value in cascading options
          const selectedDegree = cascadingDropdowns[
            formId
          ]?.degreeOptions?.find(
            opt => opt.label === value || opt.value === value
          );
          const degreeId = selectedDegree?.id || selectedDegree?.value || '';

          // Clear cached debounced functions for subjects when degree changes
          // This ensures search uses the new degree
          Object.keys(debouncedSubjectSearchRefs.current).forEach(key => {
            if (key.startsWith(`${formId}-`)) {
              delete debouncedSubjectSearchRefs.current[key];
            }
          });

          // Fetch subject options based on selected degree
          if (degreeId) {
            fetchSubjectOptions(formId, degreeId);
          } else {
            // Clear subject options if degree is cleared
            setCascadingDropdowns(prev => ({
              ...prev,
              [formId]: {
                ...prev[formId],
                subjectOptions: [],
                subjectLoading: false,
              },
            }));
          }

          // Clear dependent fields when degree changes
          return {
            ...form,
            [field]: value,
            subject: [], // Clear subject when degree changes
          };
        }

        if (field === 'isPursuing' && typeof value === 'boolean') {
          return {
            ...form,
            [field]: value,
            gpa: '',
            yearOfPassing: '',
          };
        }

        return { ...form, [field]: value };
      })
    );
  };

  // Helper function to extract value from dropdown objects
  const extractValue = (field: any): string => {
    if (field && typeof field === 'object' && field.value !== undefined) {
      return field.value;
    }
    return field || '';
  };

  // Helper function to convert ID to label (name) by looking up in dropdown options
  const convertIdToLabel = (id: string, options: any[]): string => {
    if (!id || !options || options.length === 0) return id;
    const option = options.find(opt => opt.value === id || opt.id === id);
    return option ? option.label : id;
  };

  // Helper function to calculate maximum possible experience based on DOB
  const calculateMaxExperience = useCallback(() => {
    const dob = formData.dob;
    if (!dob) return 50; // Default max if no DOB provided

    try {
      const dobDate = new Date(dob);
      const today = new Date();

      // Validate that DOB is not in the future
      if (dobDate > today) {
        return 50;
      }

      // Check if date is valid
      if (isNaN(dobDate.getTime())) {
        return 50;
      }

      // Calculate age in years
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }

      // Maximum experience = actual age (no minimum working age assumption)
      return Math.max(0, age);
    } catch (error) {
      console.error('Error calculating max experience from DOB:', error);
      return 50; // Fallback to default
    }
  }, [formData.dob]);

  const saveEducation = (formId: string) => {
    // Prevent double-clicking
    if (isSavingEducation[formId]) {
      console.log('=== Save Education - Already in progress, ignoring ===');
      return;
    }

    // Mark all required fields as touched to show validation errors
    const requiredFields: (keyof Education)[] = [
      'educationType',
      'highestDegree',
      'subject',
      'college',
      'university',
      'gpa',
      'yearOfPassing',
    ];

    requiredFields.forEach(field => {
      markEducationFieldTouched(formId, field);
    });

    setIsSavingEducation(prev => ({ ...prev, [formId]: true }));
    console.log('=== EducationSkillsStep saveEducation ===');
    const formData = activeEducationForms.find(form => form.id === formId);

    if (formData && formData.college && formData.highestDegree) {
      // Validate Year of Passing based on Education Hierarchy
      const currentYearStr = extractValue(formData.yearOfPassing);
      const isPursuing = formData.isPursuing;
      const currentYear = isPursuing ? 9999 : (currentYearStr ? new Date(currentYearStr).getFullYear() : null);
      const validationEducationTypeId = extractValue(formData.educationType);

      if (currentYear && validationEducationTypeId && EDUCATION_LEVELS[validationEducationTypeId]) {
        const currentLevel = EDUCATION_LEVELS[validationEducationTypeId];

        // Resolve label for current education type
        const currentEduOption = educationTypeOptions.find(opt => opt.value === validationEducationTypeId || opt.id === validationEducationTypeId);
        const currentEduLabel = currentEduOption ? currentEduOption.label : 'Education';

        // Format year for display message
        const formatYear = (y: number) => y === 9999 ? 'Currently Pursuing' : y;

        // Check against all existing education history
        for (const edu of educationHistory) {
          // Resolve ID for the existing entry (we store label in history)
          // We need to find the option that matches the label to get the ID
          const eduLabel = edu.educationType;
          // Try to find matching option in educationTypeOptions
          const eduOption = educationTypeOptions.find(opt => opt.label === eduLabel || opt.value === eduLabel);
          // If we can't find option, we can't validate hierarchy for this entry
          if (!eduOption) continue;

          const eduId = eduOption.id || eduOption.value;
          // Check if this existing entry has a defined level
          if (eduId && EDUCATION_LEVELS[eduId]) {
            const compareLevel = EDUCATION_LEVELS[eduId];
            const compareIsPursuing = edu.isPursuing; // Assuming isPursuing is stored in edu history
            const compareYearOriginal = edu.yearOfPassing ? new Date(edu.yearOfPassing).getFullYear() : null;
            const compareYear = compareIsPursuing ? 9999 : compareYearOriginal;

            if (compareYear) {
              // Case 1: Current Level < Existing Level (e.g. Saving UG, Existing PG)
              // Expectation: Current Year < Existing Year
              if (currentLevel < compareLevel) {
                // Invalid: Current Year >= Existing Year (Lower MUST be BEFORE Higher)
                if (currentYear >= compareYear) {
                  const message = `Your ${currentEduLabel} (${formatYear(currentYear)}) cannot be the same as or later than your ${eduLabel} (${formatYear(compareYear)}). Logic suggests ${currentEduLabel} should complete before ${eduLabel}.`;
                  showWarningToast(message);
                  setIsSavingEducation(prev => {
                    const updated = { ...prev };
                    delete updated[formId];
                    return updated;
                  });
                  return; // Stop saving
                }
              }
              // Case 2: Current Level > Existing Level (e.g. Saving PG, Existing UG)
              // Expectation: Current Year > Existing Year
              else if (currentLevel > compareLevel) {
                // Invalid: Current Year <= Existing Year
                if (currentYear <= compareYear) {
                  const message = `Your ${currentEduLabel} (${formatYear(currentYear)}) cannot be the same as or earlier than your ${eduLabel} (${formatYear(compareYear)}). Logic suggests ${currentEduLabel} should complete after ${eduLabel}.`;
                  showWarningToast(message);
                  setIsSavingEducation(prev => {
                    const updated = { ...prev };
                    delete updated[formId];
                    return updated;
                  });
                  return; // Stop saving
                }
              }
            }
          }
        }
      }

      // Generate a unique ID only once per save operation
      const uniqueId = `education-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Extract values from dropdown objects if they exist
      const educationTypeId = extractValue(formData.educationType);
      const highestDegreeId = extractValue(formData.highestDegree);
      // For subject array, extract each value
      const subjectIds = Array.isArray(formData.subject)
        ? formData.subject.map(s => extractValue(s))
        : [];
      const collegeId = extractValue(formData.college);
      const universityId = extractValue(formData.university);

      // Convert IDs to names/labels by looking up in dropdown options
      const educationTypeName = convertIdToLabel(
        educationTypeId,
        educationTypeOptions
      );
      const highestDegreeName = convertIdToLabel(
        highestDegreeId,
        cascadingDropdowns[formId]?.degreeOptions || []
      );
      // Convert array of subject IDs to array of subject names
      const subjectNames = subjectIds.map(id =>
        convertIdToLabel(id, [
          ...(cascadingDropdowns[formId]?.selectedSubjects || []),
          ...(cascadingDropdowns[formId]?.subjectOptions || [])
        ])
      );
      const collegeName = convertIdToLabel(collegeId, collegeOptions);
      const universityName = convertIdToLabel(universityId, universityOptions);

      const education: Education = {
        id: uniqueId,
        educationType: educationTypeName, // Store name instead of ID
        highestDegree: highestDegreeName, // Store name instead of ID
        subject: subjectNames, // Store array of names instead of ID
        college: collegeName, // Store name instead of ID
        university: universityName, // Store name instead of ID
        gpa: extractValue(formData.gpa),
        yearOfPassing: extractValue(formData.yearOfPassing),
        isPursuing: formData.isPursuing || false, // boolean field, no extraction needed
      };
      // Transform data for API format before sending to backend
      const apiFormattedEducation = transformEducationForAPI(education);

      // Add new education and sort by year (earliest first, isPursuing entries at the end)
      const updatedHistory = [...educationHistory, education].sort((a, b) => {
        // isPursuing entries should always be at the end
        if (a.isPursuing && !b.isPursuing) return 1;
        if (!a.isPursuing && b.isPursuing) return -1;
        if (a.isPursuing && b.isPursuing) return 0;

        // Sort by year (earliest first)
        const yearA = parseInt(extractValue(a.yearOfPassing), 10) || 0;
        const yearB = parseInt(extractValue(b.yearOfPassing), 10) || 0;
        return yearA - yearB;
      });
      setEducationHistory(updatedHistory);

      // Send API-formatted data to parent component (use the sorted updatedHistory)
      const apiFormattedHistory = updatedHistory.map(transformEducationForAPI);
      onChange('educationHistory', updatedHistory); // Keep original format for UI
      onChange('educationHistoryAPI', apiFormattedHistory); // Send API format for backend

      // Remove this form from active forms and reset saving state
      setActiveEducationForms(forms => {
        let updatedForms = forms.filter(form => form.id !== formId);

        // If the saved education has isPursuing = true, reset isPursuing in all other active forms
        if (education.isPursuing) {
          updatedForms = updatedForms.map(form => ({
            ...form,
            isPursuing: false,
          }));
        }

        return updatedForms;
      });

      setIsSavingEducation(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    } else {
      setIsSavingEducation(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    }
  };

  const removeEducationForm = (formId: string) => {
    if (activeEducationForms.length > 1) {
      setActiveEducationForms(forms =>
        forms.filter(form => form.id !== formId)
      );
    }
  };

  const editEducation = (id: string) => {
    const educationToEdit = educationHistory.find(edu => edu.id === id);
    if (!educationToEdit) return;

    // Remove from history
    const updatedHistory = educationHistory.filter(edu => edu.id !== id);
    setEducationHistory(updatedHistory);
    onChange('educationHistory', updatedHistory);

    // Add to TOP of active forms for editing (not bottom)
    setActiveEducationForms(forms => [educationToEdit, ...forms]);
  };

  const removeEducation = (id: string) => {
    const updatedHistory = educationHistory.filter(edu => edu.id !== id);
    setEducationHistory(updatedHistory);
    onChange('educationHistory', updatedHistory);
  };

  // Education functions
  const addEducationForm = async () => {
    // Prevent double-clicking
    if (isAddingEducation) {
      console.log('=== Add Education Form - Already in progress, ignoring ===');
      return;
    }

    setIsAddingEducation(true);

    try {
      const newForm: Education = {
        id: `temp-education-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        educationType: '',
        highestDegree: '',
        subject: [],
        college: '',
        university: '',
        gpa: '',
        yearOfPassing: '',
        isPursuing: false,
      };

      setActiveEducationForms(currentForms => {
        const newForms = [...currentForms, newForm];
        return newForms;
      });
    } catch (error) {
      console.error('Error in addEducationForm:', error);
    } finally {
      setIsAddingEducation(false);
    }
  };

  // Initialize cascading dropdowns for existing education forms (run once on mount and when forms are added)
  useEffect(() => {
    activeEducationForms.forEach(education => {
      // Initialize cascading state if not already present
      if (!cascadingDropdowns[education.id]) {
        setCascadingDropdowns(prev => ({
          ...prev,
          [education.id]: {
            degreeOptions: [],
            degreeLoading: false,
            subjectOptions: [],
            subjectLoading: false,
          },
        }));
      }

      // Fetch degree options if education type is already selected
      if (education.educationType) {
        // Try to get the education type ID from the options
        const educationTypeOption = educationTypeOptions.find(
          opt =>
            opt.value === education.educationType ||
            opt.label === education.educationType
        );
        const educationTypeId =
          educationTypeOption?.id || educationTypeOption?.value || '';

        if (educationTypeId) {
          fetchDegreeOptions(education.id, educationTypeId);
        }
      }

      // Fetch subject options if degree is already selected
      if (
        education.highestDegree &&
        cascadingDropdowns[education.id]?.degreeOptions?.length > 0
      ) {
        const degreeOption = cascadingDropdowns[
          education.id
        ]?.degreeOptions?.find(
          opt =>
            opt.value === education.highestDegree ||
            opt.label === education.highestDegree
        );
        const degreeId = degreeOption?.id || degreeOption?.value || '';

        if (degreeId) {
          fetchSubjectOptions(education.id, degreeId);
        }
      }
    });
  }, [activeEducationForms.length]); // Re-run when forms are added/removed

  // Skill functions
  const addSkillForm = async () => {
    // Prevent double-clicking
    if (isAddingSkill) {
      console.log('=== Add Skill Form - Already in progress, ignoring ===');
      return;
    }

    setIsAddingSkill(true);

    try {
      const newForm: Skill = {
        id: `temp-skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        skillName: '',
        skillCategory: null,
        expertise: '',
        rating: '',
        experience: '',
      };

      setActiveSkillForms(currentForms => {
        const newForms = [...currentForms, newForm];
        return newForms;
      });
    } catch (error) {
      console.error('Error in addSkillForm:', error);
    } finally {
      setIsAddingSkill(false);
    }
  };

  // Mark skill field as touched
  const markSkillFieldTouched = (formId: string, field: keyof Skill) => {
    setSkillTouched(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: true,
      },
    }));
  };

  const updateSkillForm = (
    formId: string,
    field: keyof Skill,
    value: any
  ) => {
    // Mark field as touched when value changes
    markSkillFieldTouched(formId, field);

    setActiveSkillForms(forms =>
      forms.map(form =>
        form.id === formId ? { ...form, [field]: value } : form
      )
    );
  };

  const saveSkill = (formId: string) => {
    // Prevent double-clicking
    if (isSavingSkill[formId]) {
      return;
    }

    // Mark all required fields as touched to show validation errors
    const requiredFields: (keyof Skill)[] = [
      'skillCategory',
      'skillName',
      'expertise',
      'rating',
      'experience',
    ];

    requiredFields.forEach(field => {
      markSkillFieldTouched(formId, field);
    });

    setIsSavingSkill(prev => ({ ...prev, [formId]: true }));
    const formData = activeSkillForms.find(form => form.id === formId);

    if (formData && formData.skillName && formData.expertise) {
      // Extract ID from skill name (dropdown value)
      const skillNameId = extractValue(formData.skillName);

      // Convert ID to name/label by looking up in dropdown options
      const skillName = convertIdToLabel(skillNameId, skillOptions);

      const uniqueId = `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const skill: Skill = {
        id: uniqueId,
        skillCategory: formData.skillCategory,
        skillName: skillName, // Store name instead of ID
        expertise: extractValue(formData.expertise) as
          | 'beginner'
          | 'intermediate'
          | 'advanced'
          | 'expert',
        rating: extractValue(formData.rating),
        experience: extractValue(formData.experience),
      };

      // Transform data for API format before sending to backend
      const apiFormattedSkill = transformSkillForAPI(skill);
      const updatedSkills = [...skillMetrics, skill];
      setSkillMetrics(updatedSkills);
      const apiFormattedSkills = [
        ...skillMetrics.map(transformSkillForAPI),
        apiFormattedSkill,
      ];
      onChange('skillMetrics', updatedSkills); // Keep original format for UI
      onChange('skillMetricsAPI', apiFormattedSkills); // Send API format for backend
      // Remove this form from active forms and reset saving state
      setActiveSkillForms(forms => {
        const updatedForms = forms.filter(form => form.id !== formId);
        return updatedForms;
      });

      setIsSavingSkill(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    } else {
      setIsSavingSkill(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    }
  };

  const removeSkillForm = (formId: string) => {
    setActiveSkillForms(forms => forms.filter(form => form.id !== formId));
  };

  const editSkill = (id: string) => {
    const skillToEdit = skillMetrics.find(skill => skill.id === id);
    if (!skillToEdit) return;

    // Remove from metrics
    const updatedSkills = skillMetrics.filter(skill => skill.id !== id);
    setSkillMetrics(updatedSkills);
    onChange('skillMetrics', updatedSkills);

    // Add to TOP of active forms for editing (not bottom)
    setActiveSkillForms(forms => [skillToEdit, ...forms]);
  };

  const removeSkill = (id: string) => {
    const updatedSkills = skillMetrics.filter(skill => skill.id !== id);
    setSkillMetrics(updatedSkills);
    onChange('skillMetrics', updatedSkills);
  };

  // Create stable handlers using useCallback
  const handleNavigationNext = useCallback(() => {
    if (activeTab === 'education') {
      // Auto-save any filled education forms before switching to skills tab
      activeEducationForms.forEach(form => {
        const hasRequiredData =
          extractValue(form.highestDegree) && extractValue(form.college);
        if (hasRequiredData) {
          saveEducation(form.id);
        }
      });
      setActiveTab('skills');
      return false; // Don't proceed to next step yet, just switch tabs
    } else if (activeTab === 'skills') {
      // Auto-save any filled skill forms before proceeding to next step
      activeSkillForms.forEach(form => {
        const hasRequiredData =
          extractValue(form.skillName) && extractValue(form.expertise);
        if (hasRequiredData) {
          saveSkill(form.id);
        }
      });
      return true; // Proceed to next step
    }
    return true;
  }, [activeTab, activeEducationForms, activeSkillForms]);

  const handleNavigationPrevious = useCallback(() => {
    if (activeTab === 'skills') {
      // Move from Skills back to Education tab
      setActiveTab('education');
      return false; // Don't go to previous step yet
    } else if (activeTab === 'education') {
      // On education tab, allow going to previous step
      return true; // Go to previous step
    }
    return true;
  }, [activeTab]);

  // Report navigation state to FormWizardLayout
  useEffect(() => {
    const navigationData = {
      activeTab: activeTab,
      handleNext: handleNavigationNext,
      handlePrevious: handleNavigationPrevious,
    };

    if (onChange) {
      onChange('_educationSkillsTabNavigation', navigationData);
    }
  }, [activeTab, handleNavigationNext, handleNavigationPrevious]);

  // Helper functions to convert between string values and AsyncSelectOption format
  const getDegreeOptionFromValue = (value: string, formId: string) => {
    if (!value) return null;
    // Use cascading dropdown options specific to this form
    const options = cascadingDropdowns[formId]?.degreeOptions || [];
    const option = options.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  const getSubjectOptionFromValue = (value: string[], formId: string) => {
    if (!value || !Array.isArray(value) || value.length === 0) return [];
    // Use cascading dropdown options specific to this form
    const options = cascadingDropdowns[formId]?.subjectOptions || [];
    return value.map(v => {
      const option = options.find(opt => opt.value === v);
      return option
        ? { value: option.value, label: option.label }
        : { value: v, label: v };
    });
  };

  const getUniversityOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = universityOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  const getCollegeOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = collegeOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for skills
  const getSkillOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = skillOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to check if any saved education record has isPursuing = true
  const hasActivePursuingEducation = (): boolean => {
    return educationHistory.some(education => education.isPursuing === true);
  };

  // Validation function for education form fields
  const getEducationFieldError = (
    formId: string,
    field: keyof Education
  ): string => {
    const form = activeEducationForms.find(f => f.id === formId);

    if (!form) return '';

    // Only show errors for fields that have been touched
    const isTouched = educationTouched[formId]?.[field];
    if (!isTouched) return '';

    const value = extractValue(form[field]);

    switch (field) {
      case 'educationType':
        return !value ? 'Education type is required' : '';
      case 'highestDegree': {
        const boardIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
        const eduTypeId = extractValue(form.educationType);
        const isBoardType = boardIds.includes(eduTypeId) || boardIds.includes(form.educationType as string);
        return !value ? (isBoardType ? 'Boards is required' : 'Highest degree is required') : '';
      }
      case 'subject': {
        const streamIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
        const eduTypeForSubject = extractValue(form.educationType);
        const isStreamType = streamIds.includes(eduTypeForSubject) || streamIds.includes(form.educationType as string);

        // Stream is disabled/optional ONLY for 10th
        const is10th = eduTypeForSubject === 'dhsjqj63cu2fmlc' || form.educationType === 'dhsjqj63cu2fmlc';
        if (is10th) return '';

        // For subject array, check if it has at least one item
        return !form.subject || form.subject.length === 0
          ? (isStreamType ? 'Streams is required' : 'Subject is required')
          : '';
      }
      case 'college':
        return !value ? 'College is required' : '';
      case 'university': {
        const disabledIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
        const eduTypeId = extractValue(form.educationType);
        const isUniversityDisabled = disabledIds.includes(eduTypeId) || disabledIds.includes(form.educationType as string);

        if (isUniversityDisabled) return '';
        return !value ? 'University is required' : '';
      }
      case 'gpa':
        // Skip GPA validation when isPursuing is checked
        if (form.isPursuing) return '';
        if (!value) return 'GPA is required';
        const gpaNum = parseFloat(value);
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
          return 'GPA must be between 0 and 10';
        }
        return '';
      case 'yearOfPassing':
        if (!form.isPursuing && !value) {
          return 'Year of passing is required';
        }
        return '';
      default:
        return '';
    }
  };

  // Strict validation for education fields (ignores touched state).
  // Used to determine whether Save Education should be enabled.
  const validateEducationField = (
    formId: string,
    field: keyof Education
  ): string => {
    const form = activeEducationForms.find(f => f.id === formId);
    if (!form) return '';

    const value = extractValue(form[field]);

    switch (field) {
      case 'educationType':
        return !value ? 'Education type is required' : '';
      case 'highestDegree': {
        const boardIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
        const eduTypeId = extractValue(form.educationType);
        const isBoardType = boardIds.includes(eduTypeId) || boardIds.includes(form.educationType as string);
        return !value ? (isBoardType ? 'Boards is required' : 'Highest degree is required') : '';
      }
      case 'subject': {
        const streamIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
        const eduTypeForSubject = extractValue(form.educationType);
        const isStreamType = streamIds.includes(eduTypeForSubject) || streamIds.includes(form.educationType as string);

        // Stream is disabled/optional ONLY for 10th
        const is10th = eduTypeForSubject === 'dhsjqj63cu2fmlc' || form.educationType === 'dhsjqj63cu2fmlc';
        if (is10th) return '';

        return !form.subject || form.subject.length === 0
          ? (isStreamType ? 'Streams is required' : 'Subject is required')
          : '';
      }
      case 'college':
        return !value ? 'College is required' : '';
      case 'university': {
        const disabledIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
        const eduTypeId = extractValue(form.educationType);
        const isUniversityDisabled = disabledIds.includes(eduTypeId) || disabledIds.includes(form.educationType as string);

        if (isUniversityDisabled) return '';
        return !value ? 'University is required' : '';
      }
      case 'gpa':
        // Skip GPA validation when isPursuing is checked
        if (form.isPursuing) return '';
        if (!value) return 'GPA is required';
        const gpaNum = parseFloat(value);
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
          return 'GPA must be between 0 and 10';
        }
        return '';
      case 'yearOfPassing':
        if (!form.isPursuing && !value) {
          return 'Year of passing is required';
        }
        return '';
      default:
        return '';
    }
  };

  // Validation function for skill form fields
  const getSkillFieldError = (formId: string, field: keyof Skill): string => {
    const form = activeSkillForms.find(f => f.id === formId);

    if (!form) return '';

    // Only show errors for fields that have been touched
    const isTouched = skillTouched[formId]?.[field];
    if (!isTouched) return '';

    const value = extractValue(form[field]);

    switch (field) {
      case 'skillCategory':
        return !value ? 'Skill category is required' : '';
      case 'skillName':
        return !value ? 'Skill name is required' : '';
      case 'expertise':
        return !value ? 'Expertise level is required' : '';
      case 'rating':
        if (!value) return 'Rating is required';
        const ratingNum = parseFloat(value);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return 'Rating must be between 1 and 5';
        }
        return '';
      case 'experience':
        if (!value) return 'Experience is required';
        const expNum = parseFloat(value);
        if (isNaN(expNum)) {
          return 'Experience must be a valid number';
        }
        if (expNum < 1) {
          return 'Experience must be at least 1 year';
        }
        if (expNum > 50) {
          // Hard cap: experience cannot exceed 50 years
          return 'Experience cannot exceed 50 years';
        }
        // DOB-based validation: experience cannot exceed person's age
        const maxExp = calculateMaxExperience();
        if (expNum > maxExp) {
          if (formData.dob) {
            const formattedDOB = new Date(formData.dob).toLocaleDateString('en-GB');
            return `Experience cannot exceed ${maxExp} years (DOB: ${formattedDOB})`;
          }
          return `Experience cannot exceed ${maxExp} years`;
        }
        return '';
      default:
        return '';
    }
  };

  // Strict validation for skill fields (ignores touched state).
  // Used to determine whether Save Skill should be enabled.
  const validateSkillField = (formId: string, field: keyof Skill): string => {
    const form = activeSkillForms.find(f => f.id === formId);
    if (!form) return '';

    const value = extractValue(form[field]);

    switch (field) {
      case 'skillCategory':
        return !value ? 'Skill category is required' : '';
      case 'skillName':
        return !value ? 'Skill name is required' : '';
      case 'expertise':
        return !value ? 'Expertise level is required' : '';
      case 'rating':
        if (!value) return 'Rating is required';
        const ratingNum = parseFloat(value);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return 'Rating must be between 1 and 5';
        }
        return '';
      case 'experience':
        if (!value) return 'Experience is required';
        const expNum = parseFloat(value);
        if (isNaN(expNum)) {
          return 'Experience must be a valid number';
        }
        if (expNum < 1) {
          return 'Experience must be at least 1 year';
        }
        if (expNum > 50) {
          // Hard cap: experience cannot exceed 50 years
          return 'Experience cannot exceed 50 years';
        }
        // DOB-based validation: experience cannot exceed person's age
        const maxExp = calculateMaxExperience();
        if (expNum > maxExp) {
          if (formData.dob) {
            const formattedDOB = new Date(formData.dob).toLocaleDateString('en-GB');
            return `Experience cannot exceed ${maxExp} years (DOB: ${formattedDOB})`;
          }
          return `Experience cannot exceed ${maxExp} years`;
        }
        return '';
      default:
        return '';
    }
  };

  // Check if education form has any errors
  const hasEducationFormErrors = (formId: string): boolean => {
    const requiredFields: (keyof Education)[] = [
      'educationType',
      'highestDegree',
      'subject',
      'college',
      'university',
      'gpa',
      'yearOfPassing',
    ];

    // Use strict validation (ignoring touched state) so Save remains disabled
    // until all required fields are present and valid.
    return requiredFields.some(field => {
      const error = validateEducationField(formId, field);
      return error !== '';
    });
  };

  // Check if skill form has any errors
  const hasSkillFormErrors = (formId: string): boolean => {
    const requiredFields: (keyof Skill)[] = [
      'skillCategory',
      'skillName',
      'expertise',
      'rating',
      'experience',
    ];

    // Use strict validation (ignoring touched state) so Save Skill remains
    // disabled until all required skill fields are present and valid.
    return requiredFields.some(field => {
      const error = validateSkillField(formId, field);
      return error !== '';
    });
  };

  // Tab change handler - no auto-save, just switch tabs
  const handleTabChange = (newTab: string) => {
    console.log('=== EducationSkillsStep Tab Change ===');

    // Just switch tabs, no auto-save
    setActiveTab(newTab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Education & Skills</h2>
        <p className="text-gray-600 mt-1">
          Add your educational background and technical skills. Entries will be automatically sorted by year.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="underline"
        size="md"
      />

      {/* Tab Content */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          {/* Education History Table */}
          {educationHistory.length > 0 && (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Highest Degree
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GPA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Is Pursuing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {educationHistory.map(education => (
                    <tr key={education.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.educationType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.highestDegree}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Array.isArray(education.subject)
                          ? education.subject.join(', ')
                          : education.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.college}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.university}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.gpa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.yearOfPassing}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {education.isPursuing ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editEducation(education.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Icon name="edit" className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEducation(education.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Icon name="trash" className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Multiple Education Forms */}
          {activeEducationForms.map((educationForm, index) => (
            <div
              key={educationForm.id}
              className="border rounded-md p-4 bg-gray-50 mb-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium">
                  {index === 0 && educationHistory.length === 0
                    ? 'Add Your Highest Education'
                    : 'Add Education'}
                </h3>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducationForm(educationForm.id)}
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* First Row: Education Type, Highest Degree, Subject, College */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Education Type */}
                <div className="space-y-1">
                  <AsyncSelect
                    label="Education Type"
                    value={
                      educationForm.educationType
                        ? educationTypeOptions.find(
                          opt => opt.value === educationForm.educationType
                        ) || {
                          value: educationForm.educationType,
                          label: educationForm.educationType,
                        }
                        : null
                    }
                    onChange={option =>
                      updateEducationForm(
                        educationForm.id,
                        'educationType',
                        option?.value || ''
                      )
                    }
                    onInputChange={searchEducationType}
                    options={educationTypeOptions}
                    isLoading={educationTypeLoading}
                    placeholder="Search and select education type..."
                    required
                    error={getEducationFieldError(
                      educationForm.id,
                      'educationType'
                    )}
                  />
                  {educationTypeError && (
                    <ErrorMessage
                      message={educationTypeError}
                      variant="error"
                      size="sm"
                    />
                  )}
                </div>

                {/* Highest Degree */}
                <div className="space-y-1">
                  <AsyncSelect
                    label={(() => {
                      const selectedType = educationTypeOptions.find(
                        opt =>
                          opt.value === educationForm.educationType ||
                          opt.label === educationForm.educationType
                      );
                      const eduTypeId = selectedType?.id || selectedType?.value || '';
                      return ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'].includes(eduTypeId)
                        ? 'Boards'
                        : 'Highest Degree';
                    })()}
                    value={getDegreeOptionFromValue(
                      educationForm.highestDegree,
                      educationForm.id
                    )}
                    onChange={option =>
                      updateEducationForm(
                        educationForm.id,
                        'highestDegree',
                        option?.value || ''
                      )
                    }
                    onFocus={() => {
                      // Load options on focus if education type is selected
                      if (educationForm.educationType) {
                        const educationTypeOption = educationTypeOptions.find(
                          opt =>
                            opt.value === educationForm.educationType ||
                            opt.label === educationForm.educationType
                        );
                        const educationTypeId =
                          educationTypeOption?.id ||
                          educationTypeOption?.value ||
                          '';
                        if (educationTypeId) {
                          fetchDegreeOptions(
                            educationForm.id,
                            educationTypeId,
                            ''
                          );
                        }
                      }
                    }}
                    onInputChange={input => {
                      // Search when user types
                      if (educationForm.educationType) {
                        const educationTypeOption = educationTypeOptions.find(
                          opt =>
                            opt.value === educationForm.educationType ||
                            opt.label === educationForm.educationType
                        );
                        const educationTypeId =
                          educationTypeOption?.id ||
                          educationTypeOption?.value ||
                          '';

                        if (educationTypeId) {
                          const debouncedSearch = getDebouncedDegreeSearch(
                            educationForm.id,
                            educationTypeId
                          );
                          debouncedSearch(input);
                        }
                      }
                    }}
                    options={
                      cascadingDropdowns[educationForm.id]?.degreeOptions || []
                    }
                    isLoading={
                      cascadingDropdowns[educationForm.id]?.degreeLoading ||
                      false
                    }
                    placeholder={
                      educationForm.educationType
                        ? 'Search and select degree...'
                        : 'Select education type first'
                    }
                    disabled={!educationForm.educationType}
                    required
                    showAddButton={true}
                    dropdownType="Degree"
                    dropdownLabel="Degree"
                    context={{ education_type: educationForm.educationType }}
                    onOptionAdded={newOption => {
                      // Refresh the degree options for this form
                      if (educationForm.educationType) {
                        fetchDegreeOptions(educationForm.id, educationForm.educationType);
                      }
                    }}
                    error={getEducationFieldError(
                      educationForm.id,
                      'highestDegree'
                    )}
                  />
                  {degreeError && (
                    <ErrorMessage
                      message={degreeError}
                      variant="error"
                      size="sm"
                    />
                  )}
                </div>

                {/* Subject */}
                <div className="flex items-start gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1">
                      <SearchDropdown
                        label={(() => {
                          const selectedType = educationTypeOptions.find(
                            opt =>
                              opt.value === educationForm.educationType ||
                              opt.label === educationForm.educationType
                          );
                          const eduTypeId = selectedType?.id || selectedType?.value || '';
                          return ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'].includes(eduTypeId)
                            ? 'Streams'
                            : 'Subject';
                        })()}
                        value={educationForm.subject}
                        onChange={(options) => {
                          // Handle multi-select: options is array of DropdownOption or null
                          const selectedOptions = Array.isArray(options) ? options : [];
                          const selectedValues = selectedOptions.map(opt => opt.value);

                          // Update form with values (IDs)
                          updateEducationForm(
                            educationForm.id,
                            'subject',
                            selectedValues
                          );

                          // Store full option objects to preserve labels for saving
                          setCascadingDropdowns(prev => ({
                            ...prev,
                            [educationForm.id]: {
                              ...prev[educationForm.id],
                              // Ensure we keep existing options/loading state logic
                              degreeOptions: prev[educationForm.id]?.degreeOptions || [],
                              degreeLoading: prev[educationForm.id]?.degreeLoading || false,
                              subjectOptions: prev[educationForm.id]?.subjectOptions || [],
                              subjectLoading: prev[educationForm.id]?.subjectLoading || false,
                              selectedSubjects: selectedOptions
                            }
                          }));
                        }}
                        onInputChange={(input) => {
                          // Search when user types
                          // if (educationForm.highestDegree) {
                          //   const degreeOption = cascadingDropdowns[
                          //     educationForm.id
                          //   ]?.degreeOptions?.find(
                          //     opt =>
                          //       opt.value === educationForm.highestDegree ||
                          //       opt.label === educationForm.highestDegree
                          //   );
                          //   const degreeId =
                          //     degreeOption?.id || degreeOption?.value || '';

                          //   if (degreeId) {
                          const debouncedSearch = getDebouncedSubjectSearch(
                            educationForm.id,
                            '' // Pass empty degree ID to make it independent
                            // degreeId
                          );
                          debouncedSearch(input);
                          //   }
                          // }
                        }}
                        options={
                          cascadingDropdowns[educationForm.id]
                            ?.subjectOptions || []
                        }
                        loading={
                          cascadingDropdowns[educationForm.id]
                            ?.subjectLoading || false
                        }
                        placeholder={
                          // educationForm.highestDegree
                          //   ? 'Search subjects...'
                          //   : 'Select degree first'
                          'Search subjects...'
                        }
                        // disabled={!educationForm.highestDegree}
                        required={(() => {
                          const eduTypeId = extractValue(educationForm.educationType);
                          // Stream is required for all EXCEPT 10th
                          return !(eduTypeId === 'dhsjqj63cu2fmlc' || educationForm.educationType === 'dhsjqj63cu2fmlc');
                        })()}
                        isMulti={true}
                        showAddButton={true}
                        dropdownType="Subject"
                        dropdownLabel="Subject"
                        context={{
                          // degreeId: cascadingDropdowns[
                          //   educationForm.id
                          // ]?.degreeOptions?.find(
                          //   opt =>
                          //     opt.value === educationForm.highestDegree ||
                          //     opt.label === educationForm.highestDegree
                          // )?.id,
                        }}
                        onOptionAdded={newOption => {
                          // Refresh the subject options for this form
                          // if (educationForm.highestDegree) {
                          fetchSubjectOptions(educationForm.id, ''); //, educationForm.highestDegree);
                          // }
                        }}
                        disabled={(() => {
                          const eduTypeId = extractValue(educationForm.educationType);
                          // Stream is disabled ONLY for 10th
                          return eduTypeId === 'dhsjqj63cu2fmlc' || educationForm.educationType === 'dhsjqj63cu2fmlc';
                        })()}
                        error={getEducationFieldError(
                          educationForm.id,
                          'subject'
                        )}
                      />
                      {subjectError && (
                        <ErrorMessage
                          message={subjectError}
                          variant="error"
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* College */}
                <div className="flex items-start gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1">
                      <AsyncSelect
                        label="College"
                        value={getCollegeOptionFromValue(educationForm.college)}
                        onChange={option =>
                          updateEducationForm(
                            educationForm.id,
                            'college',
                            option?.value || ''
                          )
                        }
                        onInputChange={searchCollege}
                        options={collegeOptions}
                        isLoading={collegeLoading}
                        placeholder="Search and select college..."
                        required
                        showAddButton={true}
                        dropdownType="College"
                        dropdownLabel="College"
                        onOptionAdded={newOption => {
                          // Refresh college options
                          searchCollege('');
                        }}
                        error={getEducationFieldError(
                          educationForm.id,
                          'college'
                        )}
                      />
                      {collegeError && (
                        <ErrorMessage
                          message={collegeError}
                          variant="error"
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: University, GPA, Year of Passing, Is Pursuing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* University */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="space-y-1">
                      <AsyncSelect
                        label="University"
                        value={getUniversityOptionFromValue(
                          educationForm.university
                        )}
                        onChange={option =>
                          updateEducationForm(
                            educationForm.id,
                            'university',
                            option?.value || ''
                          )
                        }
                        onInputChange={searchUniversity}
                        options={universityOptions}
                        isLoading={universityLoading}
                        placeholder="Search and select university..."
                        required={(() => {
                          const disabledIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
                          const eduTypeId = extractValue(educationForm.educationType);
                          return !(disabledIds.includes(eduTypeId) || disabledIds.includes(educationForm.educationType as string));
                        })()}
                        disabled={(() => {
                          const disabledIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
                          const eduTypeId = extractValue(educationForm.educationType);
                          return !educationForm.educationType || disabledIds.includes(eduTypeId) || disabledIds.includes(educationForm.educationType as string);
                        })()}
                        showAddButton={false}
                        dropdownType="University"
                        dropdownLabel="University"
                        onOptionAdded={newOption => {
                          // Refresh university options
                          searchUniversity('');
                        }}
                        error={getEducationFieldError(
                          educationForm.id,
                          'university'
                        )}
                      />
                      {universityError && (
                        <ErrorMessage
                          message={universityError}
                          variant="error"
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* GPA */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPA (0-10) <span className="text-red-500">*</span>
                  </label>
                  <EnhancedInputField
                    type="number"
                    value={educationForm.gpa}
                    onChange={(value: string) => {
                      // Allow empty value
                      if (value === '') {
                        updateEducationForm(educationForm.id, 'gpa', value);
                        return;
                      }

                      // Parse the value as a float to handle decimals
                      const numValue = parseFloat(value);

                      // Only allow valid numbers
                      if (!isNaN(numValue)) {
                        // Enforce min (0) and max (10) bounds
                        if (numValue < 0) {
                          updateEducationForm(educationForm.id, 'gpa', '0');
                        } else if (numValue > 10) {
                          updateEducationForm(educationForm.id, 'gpa', '10');
                        } else {
                          // Allow the value if it's between 0 and 10
                          // Round to 2 decimal places for GPA format
                          const roundedValue = Math.round(numValue * 100) / 100;
                          updateEducationForm(
                            educationForm.id,
                            'gpa',
                            roundedValue.toString()
                          );
                        }
                      }
                    }}
                    min="0"
                    max="10"
                    placeholder="e.g., 3.8 or 8.5"
                    gridCols="col-span-1"
                    required
                    error={getEducationFieldError(educationForm.id, 'gpa')}
                    disabled={educationForm.isPursuing} // Add this line to disable when isPursuing is checked
                  />
                </div>

                {/* Year of Passing */}
                <div className="col-span-1">
                  <AsyncSelect
                    label="Year of Passing"
                    value={
                      educationForm.yearOfPassing
                        ? {
                          value: educationForm.yearOfPassing,
                          label: educationForm.yearOfPassing,
                        }
                        : null
                    }
                    onChange={option =>
                      updateEducationForm(
                        educationForm.id,
                        'yearOfPassing',
                        option?.value || ''
                      )
                    }
                    onInputChange={() => { }} // No-op since this is a static list with local search
                    options={(() => {
                      const options = [] as {
                        value: string;
                        label: string;
                      }[];
                      const today = new Date();
                      const maxYear = today.getFullYear();
                      const minYear = 1950;

                      for (let y = maxYear; y >= minYear; y--) {
                        options.push({
                          value: y.toString(),
                          label: y.toString(),
                        });
                      }
                      return options;
                    })()}
                    placeholder="Search or select year..."
                    disabled={educationForm.isPursuing}
                    required
                    isLoading={false}
                    error={getEducationFieldError(
                      educationForm.id,
                      'yearOfPassing'
                    )}
                  />
                </div>

                {/* Is Pursuing - Only show if no saved education record has isPursuing = true */}
                {!hasActivePursuingEducation() && (
                  <div className="col-span-1">
                    <CheckboxField
                      label="Is Pursuing"
                      checked={educationForm.isPursuing}
                      onChange={(checked: boolean) => {
                        updateEducationForm(
                          educationForm.id,
                          'isPursuing',
                          checked
                        );
                        // Mark GPA field as touched when isPursuing changes to trigger validation
                        markEducationFieldTouched(educationForm.id, 'gpa');
                        if (checked) {
                          // Reset year of passing when isPursuing is checked
                          updateEducationForm(
                            educationForm.id,
                            'yearOfPassing',
                            ''
                          );
                        }
                      }}
                      className="mt-6"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => saveEducation(educationForm.id)}
                  disabled={
                    isSavingEducation[educationForm.id] ||
                    hasEducationFormErrors(educationForm.id)
                  }
                >
                  {isSavingEducation[educationForm.id] ? (
                    <>
                      <Icon
                        name="loading"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="mr-2 h-4 w-4" />
                      Save Education
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Show empty state when no education history and no active forms */}
          {educationHistory.length === 0 &&
            activeEducationForms.length === 0 && (
              <div className="p-6 border border-dashed rounded-md bg-gray-50">
                <Icon
                  name="book"
                  className="h-10 w-10 text-gray-400 mx-auto mb-2"
                />
                <h3 className="text-lg font-medium text-gray-600 mb-1">
                  No Education Added
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add educational background to highlight qualifications
                </p>
              </div>
            )}

          {/* Show Add Education button only when no active forms */}
          {activeEducationForms.length === 0 && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={addEducationForm}
                disabled={isAddingEducation}
              >
                {isAddingEducation ? (
                  <>
                    <Icon
                      name="loading"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="mr-2 h-4 w-4" />
                    Add Education
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Skills Table */}
          {skillMetrics.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expertise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {skillMetrics.map(skill => (
                    <tr key={skill.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof skill.skillCategory === 'object' ? skill.skillCategory?.label || skill.skillCategory?.name || 'N/A' : (skill.skillCategory || 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {skill.skillName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {skill.expertise}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {skill.rating}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {skill.experience} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editSkill(skill.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Icon name="edit" className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSkill(skill.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Icon name="trash" className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeSkillForms.length === 0 ? (
            <div className="p-6 border border-dashed rounded-md bg-gray-50">
              <Icon
                name="award"
                className="h-10 w-10 text-gray-400 mx-auto mb-2"
              />
              <h3 className="text-lg font-medium text-gray-600 mb-1">
                No Skills Added
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add skills to highlight the candidate's expertise
              </p>
            </div>
          ) : null}

          {/* Multiple Active Skill Forms */}
          {activeSkillForms.map((form, index) => (
            <div
              key={form.id}
              id={`add-skill-form-${form.id}`}
              className="border rounded-md p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium">
                  {skillMetrics.length === 0 && index === 0
                    ? 'Add Skill Metrics'
                    : 'Add Skill Metrics'}
                </h3>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkillForm(form.id)}
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Skill Category */}
                <div className="col-span-1">
                  <SearchDropdown
                    label="Skill Category"
                    value={(typeof form.skillCategory === 'object' ? form.skillCategory?.label || form.skillCategory?.name : form.skillCategory) || ''}
                    onChange={(option: any) =>
                      updateSkillForm(form.id, 'skillCategory', option)
                    }
                    onInputChange={searchSkillCategory}
                    options={skillCategoryOptions}
                    loading={skillCategoryLoading}
                    placeholder="Search category..."
                    required
                    error={getSkillFieldError(form.id, 'skillCategory')}
                  />
                </div>

                {/* Skill Name */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Skill Name <span className="text-red-500">*</span>
                      </label>
                      <AsyncSelect
                        value={getSkillOptionFromValue(form.skillName)}
                        onChange={option =>
                          updateSkillForm(
                            form.id,
                            'skillName',
                            option?.value || ''
                          )
                        }
                        onInputChange={searchSkill}
                        options={skillOptions}
                        isLoading={skillLoading}
                        placeholder="Search skill..."
                        isClearable={true}
                        disabled={false}
                        size="md"
                        required
                        showAddButton={true}
                        dropdownType="SkillSets"
                        dropdownLabel="Skill"
                        onOptionAdded={newOption => {
                          // Refresh skill options
                          searchSkill('');
                        }}
                        error={getSkillFieldError(form.id, 'skillName')}
                      />
                      {skillError && (
                        <ErrorMessage
                          message={skillError}
                          variant="error"
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise <span className="text-red-500">*</span>
                  </label>
                  <EnhancedInputField
                    value={form.expertise}
                    onChange={(value: string) =>
                      updateSkillForm(form.id, 'expertise', value as any)
                    }
                    type="select"
                    options={[
                      { value: '', label: 'Select expertise level' },
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' },
                      { value: 'expert', label: 'Expert' },
                    ]}
                    gridCols="col-span-1"
                    placeholder="Select expertise level"
                    required
                    error={getSkillFieldError(form.id, 'expertise')}
                  />
                </div>

                {/* Rating */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5) <span className="text-red-500">*</span>
                  </label>
                  <EnhancedInputField
                    type="number"
                    value={form.rating}
                    onChange={(value: string) => {
                      // Allow empty value
                      if (value === '') {
                        updateSkillForm(form.id, 'rating', value);
                        return;
                      }

                      const numValue = parseFloat(value);

                      // Enforce min/max bounds
                      if (!isNaN(numValue)) {
                        if (numValue < 1) {
                          updateSkillForm(form.id, 'rating', '1');
                        } else if (numValue > 5) {
                          updateSkillForm(form.id, 'rating', '5');
                        } else {
                          updateSkillForm(form.id, 'rating', value);
                        }
                      }
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    min="1"
                    max="5"
                    placeholder="e.g., 4"
                    gridCols="col-span-1"
                    required
                    error={getSkillFieldError(form.id, 'rating')}
                  />
                </div>

                {/* Experience */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (Years) <span className="text-red-500">*</span>
                  </label>
                  <EnhancedInputField
                    type="number"
                    value={form.experience}
                    onChange={(value: string) => {
                      // Allow empty value
                      if (value === '') {
                        updateSkillForm(form.id, 'experience', value);
                        return;
                      }

                      const numValue = parseFloat(value);

                      // Enforce min/max bounds
                      if (!isNaN(numValue)) {
                        if (numValue < 1) {
                          updateSkillForm(form.id, 'experience', '1');
                        } else if (numValue > 50) {
                          updateSkillForm(form.id, 'experience', '50');
                        } else {
                          updateSkillForm(form.id, 'experience', value);
                        }
                      }
                    }}
                    min="1"
                    max="50"
                    placeholder="e.g., 3.5"
                    gridCols="col-span-1"
                    required
                    error={getSkillFieldError(form.id, 'experience')}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => saveSkill(form.id)}
                  disabled={
                    isSavingSkill[form.id] || hasSkillFormErrors(form.id)
                  }
                >
                  {isSavingSkill[form.id] ? (
                    <>
                      <Icon
                        name="loading"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="mr-2 h-4 w-4" />
                      Save Skill
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Show Add Skill button only when no active forms and no skills, or when we already have skills */}
          {activeSkillForms.length === 0 && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={addSkillForm}
                disabled={isAddingSkill}
              >
                {isAddingSkill ? (
                  <>
                    <Icon
                      name="loading"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="mr-2 h-4 w-4" />
                    Add Skill
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Primary Skills Section - Bulk Input */}
          <div className="mt-8 border-t pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Primary Skills <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Add your primary/main skills (these must be different from secondary skills)
              </p>
            </div>
            <EnhancedTagsInput
              inputTags={primarySkills}
              onTagsChange={(tags: string[]) => {
                const skillsString = tags.join(',');
                setPrimarySkills(skillsString);
                onChange('primarySkills', skillsString);
                // When primary skills change, filter out any matching skills from secondary
                const filteredSecondary = filterOutSkills(additionalSkills, tags);
                if (filteredSecondary !== additionalSkills) {
                  setAdditionalSkills(filteredSecondary);
                  onChange('additionalSkills', filteredSecondary);
                }
              }}
              id="bulk-primary-skills"
              disabled={false}
              placeholder="Type a skill and press Enter, comma, or space to add (e.g., React, Node.js, Python)"
              disablePaste={true}
            />
            {errors?.primarySkills && (
              <div className="mt-1">
                <ErrorMessage message={errors.primarySkills} variant="error" size="sm" />
              </div>
            )}
            {primarySkills && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <strong>
                    {primarySkills.split(',').filter(s => s.trim()).length}
                  </strong>{' '}
                  primary skill
                  {primarySkills.split(',').filter(s => s.trim()).length !== 1
                    ? 's'
                    : ''}{' '}
                  added
                </p>
              </div>
            )}
          </div>

          {/* Secondary Skills Section - Bulk Input */}
          <div className="mt-8 border-t pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Secondary Skills
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Add any secondary skills not listed in primary skills above
              </p>
            </div>
            <EnhancedTagsInput
              inputTags={additionalSkills}
              onTagsChange={(tags: string[]) => {
                // Filter out any skills that exist in primary skills
                const primarySkillsArray = parseSkillsString(primarySkills);
                const filteredTags = tags.filter(tag => !primarySkillsArray.includes(tag.toLowerCase()));
                const skillsString = filteredTags.join(',');
                setAdditionalSkills(skillsString);
                onChange('additionalSkills', skillsString);
              }}
              id="bulk-additional-skills"
              disabled={false}
              placeholder="Type a skill and press Enter, comma, or space to add (e.g., React, Node.js, Python)"
              disablePaste={true}
            />
            {additionalSkills && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <strong>
                    {additionalSkills.split(',').filter(s => s.trim()).length}
                  </strong>{' '}
                  secondary skill
                  {additionalSkills.split(',').filter(s => s.trim()).length !==
                    1
                    ? 's'
                    : ''}{' '}
                  added
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationSkillsStep;
