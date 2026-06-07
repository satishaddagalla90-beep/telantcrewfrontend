import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import SearchDropdown from '../../../molecules/SearchDropdown';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import Checkbox from '../../../atoms/Checkbox';
import { ValidationPatterns } from '../../../molecules/CommonFormFields/CommonFormFields';
import { dropdownAPI } from '../../../../utils/api/dropdowns';
import { debounce } from 'lodash';
import { showWarningToast } from '../../../../utils/toast';
import { EDUCATION_LEVELS } from '../../../../constants/educationConstants';

interface EducationFormData {
  id?: string;
  educationType?: string;
  educationTypeName?: string; // Store name for API
  highestDegree: string;
  highestDegreeName?: string; // Store name for API
  subject: string | string[];
  subjectName?: string | string[]; // Store name for API
  college: string;
  collegeName?: string; // Store name for API
  university: string;
  universityName?: string; // Store name for API
  gpa: string;
  yearOfPassing: string;
  isPursuing: boolean;
}

interface BulkEducationFormProps {
  initialData: { education: EducationFormData[] };
  onDataChange: (data: any) => void;
  degreeOptions: any[];
  degreeLoading: boolean;
  subjectOptions: any[];
  subjectLoading: boolean;
  collegeOptions: any[];
  collegeLoading: boolean;
  universityOptions: any[];
  universityLoading: boolean;
  educationTypeOptions: any[];
  educationTypeLoading: boolean;
  canUpdateCandidates: boolean;
  canDeleteCandidates: boolean;
  onValidationChange?: (isValid: boolean) => void;
  searchEducationType?: (term: string) => void;
  searchCollege?: (term: string) => void;
  searchUniversity?: (term: string) => void;
}

const BulkEducationForm = forwardRef<any, BulkEducationFormProps>(
  (
    {
      initialData,
      onDataChange,
      degreeOptions,
      degreeLoading,
      subjectOptions,
      subjectLoading,
      collegeOptions,
      collegeLoading,
      universityOptions,
      universityLoading,
      educationTypeOptions,
      educationTypeLoading,
      canUpdateCandidates,
      canDeleteCandidates,
      onValidationChange,
      searchEducationType,
      searchCollege,
      searchUniversity,
    },
    ref
  ) => {
    // Expose validateAllFields to parent via ref
    useImperativeHandle(ref, () => ({
      validateAllFields: () => {
        // Validate all fields for all education entries
        let allValid = true;
        data.education.forEach((education, index) => {
          Object.keys(education).forEach(field => {
            const value = (education as any)[field];
            if (typeof value === 'string' || Array.isArray(value)) {
              const error = validateEducationField(
                index,
                field as keyof EducationFormData,
                value,
                education,
                data.education
              );
              if (error) {
                allValid = false;
                setValidationErrors(prev => ({
                  ...prev,
                  [index]: {
                    ...prev[index],
                    [field]: error,
                  },
                }));
              }
            }
          });
        });

        if (!allValid) {
          showWarningToast('Please fix validation errors before saving.');
          return false;
        }

        // Hierarchy validation
        const formatYear = (y: number) => y === 9999 ? 'Currently Pursuing' : y;

        for (const currentEdu of data.education) {
          const currentYearStr = currentEdu.yearOfPassing;
          const isPursuing = currentEdu.isPursuing;
          const currentYear = isPursuing ? 9999 : (currentYearStr ? parseInt(currentYearStr) : null);
          // The form stores label in educationType for Bulk form, we need to find the ID
          let currentTypeId = '';
          const currentLabel = currentEdu.educationType;

          const currentOption = educationTypeOptions.find(o => o.label === currentLabel || o.value === currentLabel);
          if (currentOption) {
            currentTypeId = currentOption.id || currentOption.value;
          }

          if (currentYear && currentTypeId && EDUCATION_LEVELS[currentTypeId]) {
            const currentLevel = EDUCATION_LEVELS[currentTypeId];

            for (const otherEdu of data.education) {
              // Skip if comparing same entry
              if (currentEdu === otherEdu) continue;

              const otherLabel = otherEdu.educationType;
              let otherTypeId = '';
              const otherOption = educationTypeOptions.find(o => o.label === otherLabel || o.value === otherLabel);
              if (otherOption) {
                otherTypeId = otherOption.id || otherOption.value;
              }

              // Skip if other type has no defined level
              if (!otherTypeId || !EDUCATION_LEVELS[otherTypeId]) continue;

              const compareLevel = EDUCATION_LEVELS[otherTypeId];
              const compareIsPursuing = otherEdu.isPursuing;
              const compareYearOriginal = otherEdu.yearOfPassing ? parseInt(otherEdu.yearOfPassing) : null;
              const compareYear = compareIsPursuing ? 9999 : compareYearOriginal;

              if (compareYear) {
                if (currentLevel < compareLevel) {
                  // Invalid: Current Year >= Existing Year (Lower level should be BEFORE Higher level)
                  if (currentYear >= compareYear) {
                    const message = `Your ${currentLabel} (${formatYear(currentYear)}) cannot be the same as or later than your ${otherLabel} (${formatYear(compareYear)}). Logic suggests ${currentLabel} should complete before ${otherLabel}.`;
                    showWarningToast(message);
                    return false;
                  }
                } else if (currentLevel > compareLevel) {
                  // Invalid: Current Year <= Existing Year (Higher level should be AFTER Lower level)
                  if (currentYear <= compareYear) {
                    const message = `Your ${currentLabel} (${formatYear(currentYear)}) cannot be the same as or earlier than your ${otherLabel} (${formatYear(compareYear)}). Logic suggests ${currentLabel} should complete after ${otherLabel}.`;
                    showWarningToast(message);
                    return false;
                  }
                }
              }
            }
          }
        }

        return allValid;
      },
    }));
    const [data, setData] = useState(initialData);
    const [lastSentData, setLastSentData] = useState(initialData);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<
      Record<string, Record<string, string>>
    >({});

    // Validation function for education fields
    const validateEducationField = useCallback(
      (
        index: number,
        field: keyof EducationFormData,
        value: string | string[],
        education: EducationFormData,
        allEducation: EducationFormData[]
      ): string => {
        let error = '';

        switch (field) {
          case 'educationType':
            if (typeof value === 'string' && !value.trim()) {
              error = 'Education type is required';
            }
            break;
          case 'highestDegree': {
            const boardIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
            let isBoardType = false;
            const currentEduType = education.educationType;
            if (currentEduType) {
              const matchedOption = educationTypeOptions.find(opt => opt.label === currentEduType || opt.value === currentEduType);
              const eduTypeId = matchedOption?.id || matchedOption?.value || currentEduType;
              isBoardType = boardIds.includes(eduTypeId);
            }
            if (typeof value === 'string' && !value.trim()) {
              error = isBoardType ? 'Boards is required' : 'Highest degree is required';
            }
            break;
          }
          case 'subject': {
            const streamIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
            let isStreamType = false;
            const currentEduTypeForSubject = education.educationType;
            if (currentEduTypeForSubject) {
              const matchedOpt = educationTypeOptions.find(opt => opt.label === currentEduTypeForSubject || opt.value === currentEduTypeForSubject);
              const eduTypeIdForSubject = matchedOpt?.id || matchedOpt?.value || currentEduTypeForSubject;
              isStreamType = streamIds.includes(eduTypeIdForSubject);
            }

            // Stream is disabled/optional ONLY for 10th
            const eduTypeOption = educationTypeOptions.find(
              opt => opt.value === education.educationType || opt.label === education.educationType
            );
            const eduTypeId = eduTypeOption?.id || '';
            if (eduTypeId === 'dhsjqj63cu2fmlc') return '';

            if (Array.isArray(value)) {
              if (value.length === 0) error = isStreamType ? 'Streams is required' : 'Subject is required';
            } else if (!value || !(value as string).trim()) {
              error = isStreamType ? 'Streams is required' : 'Subject is required';
            }
            break;
          }
          case 'college':
            if (typeof value === 'string' && !value.trim()) {
              error = 'College is required';
            }
            break;
          case 'university': {
            const disabledIds = ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'];
            const eduTypeOption = educationTypeOptions.find(
              opt => opt.value === education.educationType || opt.label === education.educationType
            );
            const eduTypeId = eduTypeOption?.id || '';
            if (disabledIds.includes(eduTypeId)) return '';
            if (typeof value === 'string' && !value.trim()) {
              error = 'University is required';
            }
            break;
          }
          case 'gpa':
            // Only validate GPA if isPursuing is false
            if (!education.isPursuing) {
              if (typeof value === 'string' && !value.trim()) {
                error = 'GPA is required';
              } else {
                const gpaNum = parseFloat(value as string);
                if (isNaN(gpaNum)) {
                  error = 'Please enter a valid GPA';
                } else if (gpaNum < 0 || gpaNum > 10) {
                  error = 'GPA must be between 0 and 10';
                }
              }
            }
            break;
          case 'yearOfPassing':
            // Only validate yearOfPassing if isPursuing is false
            if (!education.isPursuing) {
              if (typeof value === 'string' && !value.trim()) {
                error = 'Year of passing is required';
              } else {
                const year = parseInt(value as string);
                const currentYear = new Date().getFullYear();
                if (isNaN(year)) {
                  error = 'Please enter a valid year';
                } else if (year < 1950 || year > currentYear + 5) {
                  error = `Year must be between 1950 and ${currentYear + 5}`;
                }
                // No sequential year validation - allow any order, data will be auto-sorted
              }
            }
            break;
          default:
            break;
        }

        return error;
      },
      []
    );

    // State for cascading dropdowns (per education entry)
    const [cascadingDropdowns, setCascadingDropdowns] = useState<
      Record<
        number,
        {
          degreeOptions: any[];
          degreeLoading: boolean;
          subjectOptions: any[];
          subjectLoading: boolean;
        }
      >
    >({});

    // Cache for fetched data to avoid duplicate API calls
    const degreeCache = useRef<Record<string, any[]>>({});
    const subjectCache = useRef<Record<string, any[]>>({});

    // Fetch degree options based on education type (with caching)
    const fetchDegreeOptions = useCallback(
      async (index: number, educationType: string, searchTerm: string = '') => {
        if (!educationType) {
          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              degreeOptions: [],
              degreeLoading: false,
            },
          }));
          return;
        }

        // Create a cache key that includes the search term
        const cacheKey = `${educationType}_${searchTerm}`;

        // Check cache first
        if (degreeCache.current[cacheKey]) {
          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              degreeOptions: degreeCache.current[cacheKey],
              degreeLoading: false,
            },
          }));
          return;
        }

        setCascadingDropdowns(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            degreeLoading: true,
          },
        }));

        try {
          const options = await dropdownAPI.fetchCandidateDropdownSearchable(
            'Degree',
            searchTerm,  // Pass the search term here
            1,
            1000, // Increased limit to get all data
            { education_type: educationType }  // Pass educationType as education_type parameter
          );

          // Store in cache
          degreeCache.current[cacheKey] = options;

          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              degreeOptions: options,
              degreeLoading: false,
            },
          }));
        } catch (error) {
          console.error('Error fetching degree options:', error);
          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              degreeOptions: [],
              degreeLoading: false,
            },
          }));
        }
      },
      []
    );

    // Fetch subject options based on degree (with caching)
    const fetchSubjectOptions = useCallback(
      async (index: number, degree: string, searchTerm: string = '') => {
        // if (!degree) {
        //   setCascadingDropdowns(prev => ({
        //     ...prev,
        //     [index]: {
        //       ...prev[index],
        //       subjectOptions: [],
        //       subjectLoading: false,
        //     },
        //   }));
        //   return;
        // }

        // Create a cache key that includes the search term
        const cacheKey = `${degree}_${searchTerm}`;

        // Check cache first
        if (subjectCache.current[cacheKey]) {
          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              subjectOptions: subjectCache.current[cacheKey],
              subjectLoading: false,
            },
          }));
          return;
        }

        setCascadingDropdowns(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            subjectLoading: true,
          },
        }));

        try {
          const optionsRaw = await dropdownAPI.fetchCandidateDropdownSearchable(
            'Subject',
            searchTerm,  // Pass the search term here
            1,
            20, // Limit matching backend response
            {}
          );

          // Map options to use label as value (store Names instead of IDs)
          const options = optionsRaw.map((opt: any) => ({
            ...opt,
            value: opt.label,
            originalId: opt.value // Keep ID just in case
          }));

          // Store in cache
          subjectCache.current[cacheKey] = options;

          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              subjectOptions: options,
              subjectLoading: false,
            },
          }));
        } catch (error) {
          console.error('Error fetching subject options:', error);
          setCascadingDropdowns(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
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
      (index: number, educationTypeId: string) => {
        const key = `${index}-${educationTypeId}`;
        if (!debouncedDegreeSearchRefs.current[key]) {
          debouncedDegreeSearchRefs.current[key] = debounce(
            (searchTerm: string) => {
              if (educationTypeId) {
                fetchDegreeOptions(index, educationTypeId, searchTerm);
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
      (index: number, degreeId: string) => {
        const key = `${index}-${degreeId}`;
        if (!debouncedSubjectSearchRefs.current[key]) {
          debouncedSubjectSearchRefs.current[key] = debounce(
            (searchTerm: string) => {
              //   if (degreeId) {
              fetchSubjectOptions(index, degreeId, searchTerm);
              //   }
            },
            400
          );
        }
        return debouncedSubjectSearchRefs.current[key];
      },
      [fetchSubjectOptions]
    );

    const handleEducationChange = useCallback(
      (
        index: number,
        field: keyof EducationFormData,
        value: any,
        id?: string
      ) => {
        setData(prev => {
          const updatedEducation = [...prev.education];
          updatedEducation[index] = {
            ...updatedEducation[index],
            [field]: value,
          };

          // Store the label (name) alongside the value (ID) for dropdown fields
          if (field === 'educationType' && value) {
            const selectedOption = educationTypeOptions.find(
              opt => opt.value === value
            );
            updatedEducation[index].educationTypeName =
              selectedOption?.label || value;
          }

          if (field === 'highestDegree' && value) {
            const selectedOption = cascadingDropdowns[
              index
            ]?.degreeOptions?.find(opt => opt.value === value);
            updatedEducation[index].highestDegreeName =
              selectedOption?.label || value;
          }

          if (field === 'subject' && value) {
            const selectedValues = Array.isArray(value) ? value : [value];
            const selectedLabels = selectedValues.map((v: string) => {
              const opt = cascadingDropdowns[index]?.subjectOptions?.find(o => o.value === v);
              return opt?.label || v;
            });
            updatedEducation[index].subjectName = selectedLabels;
          }

          if (field === 'college' && value) {
            const selectedOption = collegeOptions.find(
              opt => opt.value === value
            );
            updatedEducation[index].collegeName =
              selectedOption?.label || value;
          }

          if (field === 'university' && value) {
            const selectedOption = universityOptions.find(
              opt => opt.value === value
            );
            updatedEducation[index].universityName =
              selectedOption?.label || value;
          }

          // If isPursuing is changes, clear the yearOfPassing and GPA fields
          if (field === 'isPursuing') {
            updatedEducation[index].yearOfPassing = '';
            updatedEducation[index].gpa = '';
          }

          // Handle cascading dropdown logic
          if (field === 'educationType') {
            // Reset dependent fields
            updatedEducation[index].highestDegree = '';
            updatedEducation[index].highestDegreeName = '';
            updatedEducation[index].subject = [];
            updatedEducation[index].subjectName = [];
            updatedEducation[index].college = '';
            updatedEducation[index].collegeName = '';

            // Clear validation errors for reset fields
            setValidationErrors(prevErrors => ({
              ...prevErrors,
              [index]: {
                ...prevErrors[index],
                highestDegree: '',
                subject: '',
                college: '',
              },
            }));

            // Clear cache entries for this education type
            Object.keys(degreeCache.current).forEach(key => {
              if (key.startsWith(`${id || value}_`)) {
                delete degreeCache.current[key];
              }
            });

            // Clear debounced functions for this index and education type
            Object.keys(debouncedDegreeSearchRefs.current).forEach(key => {
              if (key.startsWith(`${index}-`)) {
                // Cancel any pending debounced calls
                debouncedDegreeSearchRefs.current[key].cancel();
                delete debouncedDegreeSearchRefs.current[key];
              }
            });

            // Fetch degree options based on selected education type
            if (value) {
              fetchDegreeOptions(index, id || value, '');
            } else {
              // Clear degree and subject options if education type is cleared
              setCascadingDropdowns(prev => ({
                ...prev,
                [index]: {
                  degreeOptions: [],
                  degreeLoading: false,
                  subjectOptions: [],
                  subjectLoading: false,
                },
              }));
            }
          }

          if (field === 'highestDegree') {
            // Reset subject field
            updatedEducation[index].subject = [];
            updatedEducation[index].subjectName = [];

            // Clear validation errors for reset fields
            setValidationErrors(prevErrors => ({
              ...prevErrors,
              [index]: {
                ...prevErrors[index],
                subject: '',
              },
            }));

            // Clear cache entries for this degree
            Object.keys(subjectCache.current).forEach(key => {
              if (key.startsWith(`${id || value}_`)) {
                delete subjectCache.current[key];
              }
            });

            // Clear debounced functions for this index and degree
            Object.keys(debouncedSubjectSearchRefs.current).forEach(key => {
              if (key.startsWith(`${index}-`)) {
                // Cancel any pending debounced calls
                debouncedSubjectSearchRefs.current[key].cancel();
                delete debouncedSubjectSearchRefs.current[key];
              }
            });

            // Fetch subject options based on selected degree
            if (value) {
              fetchSubjectOptions(index, id || value, '');
            } else {
              // Clear subject options if degree is cleared
              setCascadingDropdowns(prev => ({
                ...prev,
                [index]: {
                  ...prev[index],
                  subjectOptions: [],
                  subjectLoading: false,
                },
              }));
            }
          }

          return { ...prev, education: updatedEducation };
        });

        // Validate field on change
        if (typeof value === 'string' || typeof value === 'boolean' || Array.isArray(value)) {
          setData(prev => {
            const education = prev.education[index];
            const error = validateEducationField(
              index,
              field as keyof EducationFormData,
              Array.isArray(value) ? value : typeof value === 'string' ? value : '',
              education,
              prev.education
            );
            setValidationErrors(prevErrors => ({
              ...prevErrors,
              [index]: {
                ...prevErrors[index],
                [field]: error,
              },
            }));

            // Clear yearOfPassing error when isPursuing is checked
            if (field === 'isPursuing' && value === true) {
              setValidationErrors(prevErrors => ({
                ...prevErrors,
                [index]: {
                  ...prevErrors[index],
                  yearOfPassing: '',
                  gpa: '', // Also clear GPA error when isPursuing is checked
                },
              }));
            }
            // Validate GPA and yearOfPassing when isPursuing is unchecked
            else if (field === 'isPursuing' && value === false) {
              const gpaError = validateEducationField(
                index,
                'gpa' as keyof EducationFormData,
                education.gpa,
                { ...education, isPursuing: false },
                data.education
              );
              const yearError = validateEducationField(
                index,
                'yearOfPassing' as keyof EducationFormData,
                education.yearOfPassing,
                { ...education, isPursuing: false },
                data.education
              );
              setValidationErrors(prevErrors => ({
                ...prevErrors,
                [index]: {
                  ...prevErrors[index],
                  gpa: gpaError,
                  yearOfPassing: yearError,
                },
              }));
            }

            return prev;
          });
        }
      },
      [
        fetchDegreeOptions,
        fetchSubjectOptions,
        educationTypeOptions,
        collegeOptions,
        universityOptions,
        cascadingDropdowns,
      ]
    );

    const handleFocus = useCallback((field: string) => {
      setFocusedField(field);
    }, []);

    const handleBlur = useCallback(() => {
      setFocusedField(null);
    }, []);

    // Helper function to sort education entries by year (earliest first, isPursuing last)
    const sortEducationByYear = useCallback((educationList: EducationFormData[]) => {
      return [...educationList].sort((a, b) => {
        // isPursuing entries go to the end
        if (a.isPursuing && !b.isPursuing) return 1;
        if (!a.isPursuing && b.isPursuing) return -1;
        if (a.isPursuing && b.isPursuing) return 0;

        // Sort by year (earliest first)
        const yearA = parseInt(a.yearOfPassing) || 0;
        const yearB = parseInt(b.yearOfPassing) || 0;
        return yearA - yearB;
      });
    }, []);

    // Send updates when focus changes or when data changes significantly
    useEffect(() => {
      if (
        !focusedField &&
        JSON.stringify(data) !== JSON.stringify(lastSentData)
      ) {
        // Auto-sort education entries by year before sending to parent
        const sortedData = {
          ...data,
          education: sortEducationByYear(data.education),
        };
        onDataChange(sortedData);
        setLastSentData(data);
      }
    }, [data, lastSentData, focusedField, onDataChange, sortEducationByYear]);

    // Trigger validation when errors change
    useEffect(() => {
      const hasErrors = Object.values(validationErrors).some(errors =>
        Object.values(errors).some(error => error !== '')
      );
      onValidationChange?.(!hasErrors);
    }, [validationErrors, onValidationChange]);

    // Initialize cascading dropdowns for existing education entries (run once on mount)
    useEffect(() => {
      data.education.forEach((education, index) => {
        // Initialize cascading state
        setCascadingDropdowns(prev => ({
          ...prev,
          [index]: {
            degreeOptions: [],
            degreeLoading: false,
            subjectOptions: [],
            subjectLoading: false,
          },
        }));

        // Fetch degree options if education type is already selected
        if (education.educationType) {
          const eduTypeOption = educationTypeOptions.find(
            opt => opt.label === education.educationType || opt.value === education.educationType
          );
          const eduTypeId = eduTypeOption?.id || eduTypeOption?.value || education.educationType;
          fetchDegreeOptions(index, eduTypeId, '');
        }

        // Fetch subject options if degree is already selected
        if (education.highestDegree) {
          fetchSubjectOptions(index, education.highestDegree, '');
        }
      });
      // eslint-disable-next-line
    }, []); // Run only once on mount

    const handleAddEducation = () => {
      if (!canUpdateCandidates) {
        console.warn('User does not have permission to update candidate data');
        return;
      }

      // Check if any existing education has isPursuing checked
      const hasAnyPursuing = data.education.some(edu => edu.isPursuing);

      const newIndex = data.education.length;
      const newData = {
        ...data,
        education: [
          ...data.education,
          {
            educationType: '',
            highestDegree: '',
            subject: [],
            college: '',
            university: '',
            gpa: '',
            yearOfPassing: '',
            isPursuing: hasAnyPursuing ? false : false, // Always initialize to false for new rows
          },
        ],
      };
      // Initialize empty cascading dropdown state for new entry
      setCascadingDropdowns(prev => ({
        ...prev,
        [newIndex]: {
          degreeOptions: [],
          degreeLoading: false,
          subjectOptions: [],
          subjectLoading: false,
        },
      }));
      setData(newData);
      onDataChange(newData);
      setLastSentData(newData);
    };

    const handleRemoveEducation = (index: number) => {
      if (!canDeleteCandidates) {
        console.warn('User does not have permission to delete candidate data');
        return;
      }
      const newData = {
        ...data,
        education: data.education.filter((_, i) => i !== index),
      };
      setData(newData);
      onDataChange(newData);
      setLastSentData(newData);
    };

    return (
      <div
        className="p-6 space-y-6"
        onFocus={e =>
          handleFocus(e.target.getAttribute('data-field') || 'unknown')
        }
        onBlur={handleBlur}
      >
        <div className="space-y-4">
          {data.education.map((education, index) => (
            <div
              key={education.id || index}
              className="p-4 border rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-900 font-semibold">Education {index + 1}</span>
                  {!data.education.some((edu, i) => i !== index && edu.isPursuing) && (
                    <Checkbox
                      checked={education.isPursuing}
                      onChange={checked =>
                        handleEducationChange(index, 'isPursuing', checked)
                      }
                      label="Currently Pursuing"
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    canDeleteCandidates
                      ? () => handleRemoveEducation(index)
                      : undefined
                  }
                  disabled={!canDeleteCandidates}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon name="trash" size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <SearchDropdown
                      label="Education Type"
                      options={educationTypeOptions}
                      value={education.educationType || ''}
                      onChange={(option: any) => {
                        handleEducationChange(
                          index,
                          'educationType',
                          option?.label || '',
                          option?.id || ''
                        );
                        setFocusedField(null);
                      }}
                      required
                      loading={educationTypeLoading}
                      placeholder="Search education type..."
                      onInputChange={(input, action) => {
                        if (
                          action.action === 'input-change' &&
                          searchEducationType
                        ) {
                          searchEducationType(input);
                        }
                      }}
                    // showAddButton={true}
                    // dropdownType="EducationType"
                    // dropdownLabel="Education Type"
                    // onOptionAdded={(newOption: any) => {
                    //   // Refresh education type options
                    //   if (searchEducationType) {
                    //     searchEducationType('');
                    //   }
                    // }}
                    />
                    {validationErrors[index]?.educationType && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.educationType}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <SearchDropdown
                      label={(() => {
                        const eduTypeOption = educationTypeOptions.find(
                          opt => opt.value === education.educationType || opt.label === education.educationType
                        );
                        const eduTypeId = eduTypeOption?.id || '';
                        return ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'].includes(eduTypeId)
                          ? 'Boards'
                          : 'Highest Degree';
                      })()}
                      options={cascadingDropdowns[index]?.degreeOptions || []}
                      value={education.highestDegree}
                      onChange={(option: any) => {
                        handleEducationChange(
                          index,
                          'highestDegree',
                          option?.label || '',
                          option?.id || ''
                        );
                        setFocusedField(null);
                      }}
                      required
                      loading={cascadingDropdowns[index]?.degreeLoading || false}
                      placeholder={
                        education.educationType
                          ? 'Search for degree...'
                          : 'Select education type first'
                      }
                      disabled={!education.educationType}
                      showAddButton={true}
                      dropdownType="Degree"
                      dropdownLabel="Degree"
                      disableFilter={true}
                      context={{
                        education_type: educationTypeOptions.find(
                          opt => opt.label === education.educationType || opt.value === education.educationType
                        )?.id || educationTypeOptions.find(
                          opt => opt.label === education.educationType || opt.value === education.educationType
                        )?.value || education.educationType
                      }}
                      onInputChange={(input: string, action: any) => {
                        // Search when user types
                        if (action.action === 'input-change' && education.educationType) {
                          const eduTypeOption = educationTypeOptions.find(
                            opt => opt.label === education.educationType || opt.value === education.educationType
                          );
                          const eduTypeId = eduTypeOption?.id || eduTypeOption?.value || education.educationType;
                          const debouncedSearch = getDebouncedDegreeSearch(index, eduTypeId);
                          debouncedSearch(input);
                        }
                      }}
                      onOptionAdded={newOption => {
                        // Refresh degree options for this index
                        if (education.educationType) {
                          const eduTypeOption = educationTypeOptions.find(
                            opt => opt.label === education.educationType || opt.value === education.educationType
                          );
                          const eduTypeId = eduTypeOption?.id || eduTypeOption?.value || education.educationType;
                          fetchDegreeOptions(index, eduTypeId, '');
                        }
                      }}
                    />
                    {validationErrors[index]?.highestDegree && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.highestDegree}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <SearchDropdown
                      label={(() => {
                        const eduTypeOption = educationTypeOptions.find(
                          opt => opt.value === education.educationType || opt.label === education.educationType
                        );
                        const eduTypeId = eduTypeOption?.id || '';
                        return ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'].includes(eduTypeId)
                          ? 'Streams'
                          : 'Subject';
                      })()}
                      options={cascadingDropdowns[index]?.subjectOptions || []}
                      value={education.subject}
                      onChange={(options: any) => {
                        const selectedValues = Array.isArray(options) ? options.map((o: any) => o.value) : [];
                        handleEducationChange(
                          index,
                          'subject',
                          selectedValues
                        );
                        setFocusedField(null);
                      }}
                      required={(() => {
                        const eduTypeOption = educationTypeOptions.find(
                          opt => opt.value === education.educationType || opt.label === education.educationType
                        );
                        const eduTypeId = eduTypeOption?.id || '';
                        // Stream is required for all EXCEPT 10th
                        return eduTypeId !== 'dhsjqj63cu2fmlc';
                      })()}
                      isMulti={true}
                      loading={cascadingDropdowns[index]?.subjectLoading || false}
                      placeholder={'Search for subject...'}
                      disabled={(() => {
                        const eduTypeOption = educationTypeOptions.find(
                          opt => opt.value === education.educationType || opt.label === education.educationType
                        );
                        const eduTypeId = eduTypeOption?.id || '';
                        // Stream is disabled ONLY for 10th
                        return eduTypeId === 'dhsjqj63cu2fmlc';
                      })()}
                      showAddButton={true}
                      dropdownType="Subject"
                      dropdownLabel="Subject"
                      disableFilter={true}
                      context={{
                        // degreeId: education.highestDegree,
                      }}
                      onInputChange={(input: string, action: any) => {
                        // Search when user types
                        if (action.action === 'input-change') {
                          const debouncedSearch = getDebouncedSubjectSearch(index, '');
                          debouncedSearch(input);
                        }
                      }}
                      onOptionAdded={(newOption: any) => {
                        // Refresh subject options for this index
                        fetchSubjectOptions(index, '', '');
                      }}
                    />
                    {validationErrors[index]?.subject && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.subject}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <SearchDropdown
                      label="College"
                      options={collegeOptions}
                      value={education.college}
                      onChange={(option: any) => {
                        handleEducationChange(
                          index,
                          'college',
                          option?.label || ''
                        );
                        setFocusedField(null);
                      }}
                      required
                      loading={collegeLoading}
                      placeholder="Search for college..."
                      onInputChange={(input: string, action: any) => {
                        if (action.action === 'input-change' && searchCollege) {
                          searchCollege(input);
                        }
                      }}
                      showAddButton={true}
                      dropdownType="College"
                      dropdownLabel="College"
                      onOptionAdded={(newOption: any) => {
                        // Refresh college options
                        if (searchCollege) {
                          searchCollege('');
                        }
                      }}
                    />
                    {validationErrors[index]?.college && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.college}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <SearchDropdown
                      label="University"
                      options={universityOptions}
                      value={education.university}
                      onChange={(option: any) => {
                        handleEducationChange(
                          index,
                          'university',
                          option?.label || ''
                        );
                        setFocusedField(null);
                      }}
                      required={(() => {
                        const eduTypeOption = educationTypeOptions.find(
                          opt => opt.value === education.educationType || opt.label === education.educationType
                        );
                        const eduTypeId = eduTypeOption?.id || '';
                        return !['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'].includes(eduTypeId);
                      })()}
                      disabled={(() => {
                        const eduTypeOption = educationTypeOptions.find(
                          opt => opt.value === education.educationType || opt.label === education.educationType
                        );
                        const eduTypeId = eduTypeOption?.id || '';
                        return !education.educationType || ['b6w93d0tqngnj5u', 'dhsjqj63cu2fmlc'].includes(eduTypeId);
                      })()}
                      loading={universityLoading}
                      placeholder="Search for university..."
                      onInputChange={(input: string, action: any) => {
                        if (
                          action.action === 'input-change' &&
                          searchUniversity
                        ) {
                          searchUniversity(input);
                        }
                      }}
                      showAddButton={false}
                      dropdownType="University"
                      dropdownLabel="University"
                      onOptionAdded={(newOption: any) => {
                        // Refresh university options
                        if (searchUniversity) {
                          searchUniversity('');
                        }
                      }}
                    />
                    {validationErrors[index]?.university && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.university}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="min-h-[76px] min-w-0">
                    <EnhancedInputField
                      label="GPA"
                      type="number"
                      value={education.gpa}
                      onChange={value =>
                        handleEducationChange(index, 'gpa', value)
                      }
                      required
                      placeholder="e.g., 3.5"
                      error={validationErrors[index]?.gpa}
                      disabled={education.isPursuing}
                    />
                  </div>
                  <div className="min-h-[76px]">
                    <SearchDropdown
                      label="Year of Passing"
                      value={education.yearOfPassing}
                      onChange={(option: any) => {
                        handleEducationChange(
                          index,
                          'yearOfPassing',
                          option?.value || ''
                        );
                        setFocusedField(null);
                      }}
                      options={Array.from(
                        { length: new Date().getFullYear() - 1950 + 1 },
                        (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return {
                            value: year.toString(),
                            label: year.toString(),
                          };
                        }
                      )}
                      required
                      placeholder="Search or select year..."
                      error={validationErrors[index]?.yearOfPassing || null}
                      disabled={education.isPursuing}
                      loading={false}
                      isClearable={true}
                      isSearchable={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={canUpdateCandidates ? handleAddEducation : undefined}
          disabled={!canUpdateCandidates}
          className="w-full"
        >
          <Icon name="plus" size={16} className="mr-2" />
          Add Education
        </Button>
      </div>
    );
  }
);

export { BulkEducationForm };
