import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import SearchDropdown from '../../../molecules/SearchDropdown';
import { ValidationPatterns } from '../../../molecules/CommonFormFields/CommonFormFields';
import { DropdownOption } from '../../../../types';
import debounce from 'lodash/debounce';
import {
  useSourceTypesDropdown,
  useFilteredSourceNamesDropdown,
} from '../../../../hooks/useDropdowns';

interface ProfessionalFormData {
  total_experience: string;
  relevant_experience: string;
  current_ctc: string;
  expected_ctc: string;
  current_location: string;
  preferred_location: string;
  notice_period: string;
  job_open_type: string;
  preferred_job: string;
  job_preference: string;
  shift: string;
  source_type: string;
  source_name: string;
  career_break_type?: string;
  duration?: Array<{ from_date: string | null; to_date: string | null }>;
}

interface ProfessionalDetailsFormProps {
  initialData: ProfessionalFormData;
  onDataChange: (data: any) => void;
  noticePeriodOptions: DropdownOption[];
  jobOpenTypeOptions: DropdownOption[];
  shiftsOptions: DropdownOption[];
  jobPreferenceSelectOptions: DropdownOption[];
  jobTypeSelectOptions: DropdownOption[];
  staticDropdownsLoading: boolean;
  onValidationChange?: (isValid: boolean) => void;
  careerBreakTypeOptions?: DropdownOption[]; // Optional to avoid breaking other usages if any
  careerBreakTypeLoading?: boolean;
}

const ProfessionalDetailsFormInner = (
  props: ProfessionalDetailsFormProps,
  ref: React.Ref<any>
) => {
  const {
    initialData,
    onDataChange,
    noticePeriodOptions,
    jobOpenTypeOptions,
    shiftsOptions,
    jobPreferenceSelectOptions,
    jobTypeSelectOptions,
    staticDropdownsLoading,
    onValidationChange,
    careerBreakTypeOptions = [],
    careerBreakTypeLoading = false,
  } = props;

  // State for location dropdown
  const [locationOptions, setLocationOptions] = useState<DropdownOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [countriesData, setCountriesData] = useState<any>(null);

  // Fetch countries data from API
  useEffect(() => {
    const fetchCountries = async () => {
      setLocationLoading(true);
      setLocationError(null);
      try {
        const response = await fetch(
          'https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries'
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setCountriesData(data);

        // Flatten all cities for initial dropdown options (first 50)
        if (data.data) {
          const allCities = data.data
            .flatMap((country: any) =>
              country.cities.map((city: string) => ({
                value: city,
                label: city,
              }))
            )
            .slice(0, 50);
          setLocationOptions(allCities);
        }
      } catch (err: any) {
        setLocationError(err.message || 'Failed to fetch countries');
        setLocationOptions([]);
      } finally {
        setLocationLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Search locations function
  const searchLocations = useCallback(
    debounce((search: string) => {
      setLocationSearchTerm(search);
      if (!countriesData?.data) return;

      if (!search.trim()) {
        // If search is empty, show first 50 cities
        const allCities = countriesData.data
          .flatMap((country: any) =>
            country.cities.map((city: string) => ({
              value: city,
              label: city,
            }))
          )
          .slice(0, 50);
        setLocationOptions(allCities);
        return;
      }

      // Filter cities based on search term
      const filteredCities = countriesData.data
        .flatMap((country: any) =>
          country.cities
            .filter((city: string) =>
              city.toLowerCase().includes(search.toLowerCase())
            )
            .map((city: string) => ({
              value: city,
              label: city,
            }))
        )
        .slice(0, 50); // Limit to 50 results

      setLocationOptions(filteredCities);
    }, 400),
    [countriesData]
  );

  // State for source type selection (to filter source names)
  const [selectedSourceType, setSelectedSourceType] = useState<string>('');

  // Source type and source name dropdowns
  const {
    options: sourceTypeOptions,
    loading: sourceTypeLoading,
    search: searchSourceType,
  } = useSourceTypesDropdown();

  const {
    options: sourceNameOptions,
    loading: sourceNameLoading,
    search: searchSourceName,
  } = useFilteredSourceNamesDropdown(selectedSourceType);

  // Helper function to convert comma-separated strings to arrays for multi-select fields
  const convertToArrayFormat = (data: any) => {
    if (!data) return data;

    // Helper to find matching option label (case-insensitive)
    const findMatchingLabel = (value: string, options: DropdownOption[]): string | null => {
      const trimmedValue = value.trim();
      const match = options.find(
        opt => opt.label === trimmedValue || opt.label.toLowerCase() === trimmedValue.toLowerCase()
      );
      return match ? match.label : trimmedValue;
    };

    const convertField = (fieldValue: any, options: DropdownOption[]): string[] => {
      if (typeof fieldValue === 'string') {
        return fieldValue.split(',').map(s => findMatchingLabel(s, options)).filter((s): s is string => s !== null);
      }
      return fieldValue || [];
    };

    return {
      ...data,
      job_open_type: convertField(data.job_open_type, jobOpenTypeOptions),
      preferred_job: convertField(data.preferred_job, jobPreferenceSelectOptions),
      job_preference: convertField(data.job_preference, jobTypeSelectOptions),
      shift: convertField(data.shift, shiftsOptions),
    };
  };

  const [data, setData] = useState(
    convertToArrayFormat(initialData) || {
      total_experience: '',
      relevant_experience: '',
      current_ctc: '',
      expected_ctc: '',
      current_location: '',
      preferred_location: '',
      notice_period: '',
      job_open_type: [],
      preferred_job: [],
      job_preference: [],
      shift: [],
      source_type: '',
      source_name: '',
      career_break_type: '',
      duration: [],
    }
  );

  // Store preferred locations as objects internally to preserve value-label pairs
  const [preferredLocationObjects, setPreferredLocationObjects] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Track the last processed preferred_location value to avoid re-processing
  const lastProcessedLocation = useRef<string>('');

  // Initialize/update preferred locations from initial data only when it actually changes
  useEffect(() => {
    const locString =
      typeof initialData?.preferred_location === 'string'
        ? initialData.preferred_location
        : '';

    // Only process if the value has actually changed from external source (initialData)
    if (locString !== lastProcessedLocation.current) {
      lastProcessedLocation.current = locString;

      if (locString) {
        const locationNames = locString.split(',').map(loc => loc.trim());

        // Map location names to their full value-label pairs
        // For each name, try to find matching option or use name as-is
        const locationObjs = locationNames.map(name => {
          // Try to find matching option by label (case-insensitive)
          const matchingOption = locationOptions.find(
            opt => opt.label.toLowerCase() === name.toLowerCase()
          );

          if (matchingOption) {
            // Use the full path as value, city name as label
            return { value: matchingOption.value, label: matchingOption.label };
          } else {
            // If not found in options, store the name as both value and label
            // The SearchDropdown will handle it as a temporary option
            return { value: name, label: name };
          }
        });

        setPreferredLocationObjects(locationObjs);
      } else {
        setPreferredLocationObjects([]);
      }
    }
    // Note: We intentionally don't include locationOptions in deps to prevent re-initialization
    // when user searches. The SearchDropdown handles missing options via temporary options.
  }, [initialData?.preferred_location]);

  // One-time enrichment: When locationOptions first loads, enrich any temp locations
  const optionsEnriched = useRef(false);
  useEffect(() => {
    if (
      !optionsEnriched.current &&
      locationOptions.length > 0 &&
      preferredLocationObjects.length > 0
    ) {
      optionsEnriched.current = true;

      // Check if any current locations can be enriched with proper values from loaded options
      const enrichedLocations = preferredLocationObjects.map(loc => {
        // If location is using name as value (temp location), try to find proper option
        const matchingOption = locationOptions.find(
          opt => opt.label.toLowerCase() === loc.label.toLowerCase()
        );

        if (matchingOption && loc.value === loc.label) {
          // Replace temp location with proper value
          return { value: matchingOption.value, label: matchingOption.label };
        }
        return loc;
      });

      // Only update if something changed
      if (
        JSON.stringify(enrichedLocations) !==
        JSON.stringify(preferredLocationObjects)
      ) {
        setPreferredLocationObjects(enrichedLocations);
      }
    }
  }, [locationOptions, preferredLocationObjects]);

  // Merge current selections with available options to pass to SearchDropdown
  // This ensures selected locations always show correct labels even when not in current search results
  const getMergedLocationOptions = (): DropdownOption[] => {
    // Get all currently selected location objects
    const selectedAsOptions: DropdownOption[] = preferredLocationObjects.map(
      loc => ({
        value: loc.value,
        label: loc.label,
        id: loc.value,
      })
    );

    // Merge with current search results, avoiding duplicates
    const mergedOptions = [...selectedAsOptions];
    locationOptions.forEach(opt => {
      if (!mergedOptions.find(m => m.value === opt.value)) {
        mergedOptions.push(opt);
      }
    });

    return mergedOptions;
  };

  // Convert location objects to values array for SearchDropdown
  const getLocationValuesArray = (): string[] => {
    return preferredLocationObjects.map(loc => loc.value);
  };

  // Handle location change - store objects and update form data with names
  const handleLocationChange = (selectedOptions: any) => {
    const optionsArray = Array.isArray(selectedOptions)
      ? selectedOptions
      : selectedOptions
        ? [selectedOptions]
        : [];

    // Map to objects
    const newLocationObjects = optionsArray.map((opt: any) => ({
      value: opt.value,
      label: opt.label,
    }));

    setPreferredLocationObjects(newLocationObjects);

    // Update form data with comma-separated labels (names) for API
    const locationString = newLocationObjects.map(loc => loc.label).join(', ');
    handleChange('preferred_location', locationString);
  };

  const [lastSentData, setLastSentData] = useState(data);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (initialData) {
      const convertedData = convertToArrayFormat(initialData);
      setData(convertedData);
      setLastSentData(convertedData);
      // Note: Do NOT set selectedSourceType here - it will be set below after label->ID conversion
    }
  }, [initialData]);

  // Convert source_type from Label to ID once options are loaded and set selectedSourceType
  // This ensures selectedSourceType is ONLY ever set to an ID value, never a label
  useEffect(() => {
    if (initialData?.source_type && sourceTypeOptions.length > 0) {
      // Check if current data.source_type is the Name (mismatching option value which is ID)
      const matchingOption = sourceTypeOptions.find(
        opt => opt.label === initialData.source_type
      );

      if (matchingOption) {
        // Update both data and selectedSourceType to the ID value
        setSelectedSourceType(matchingOption.value);
        setData((prev: ProfessionalFormData) => ({ ...prev, source_type: matchingOption.value }));
      }
    }
  }, [sourceTypeOptions, initialData?.source_type]);

  // Helper to send data with transformed source_type (ID -> label)
  const sendData = useCallback((currentData: ProfessionalFormData) => {
    const selectedSourceOption = sourceTypeOptions.find(opt => opt.value === currentData.source_type);
    const transformedData = {
      ...currentData,
      source_type: selectedSourceOption ? selectedSourceOption.label : currentData.source_type
    };
    onDataChange(transformedData);
    setLastSentData(currentData);
  }, [onDataChange, sourceTypeOptions]);

  // Send updates when focus changes or when data changes significantly
  useEffect(() => {
    if (
      !focusedField &&
      JSON.stringify(data) !== JSON.stringify(lastSentData)
    ) {
      sendData(data);
    }
  }, [data, lastSentData, focusedField, sendData]);

  // Trigger validation when errors change
  useEffect(() => {
    const isValid = Object.keys(validationErrors).length === 0;
    onValidationChange?.(isValid);
  }, [validationErrors, onValidationChange]);

  // Validation functions
  const validateField = useCallback(
    (field: string, value: string) => {
      let error = '';
      switch (field) {
        case 'total_experience':
          if (!value.trim()) {
            error = 'Total experience is required';
          } else {
            error = ValidationPatterns.totalExperience(value) || '';
          }
          break;
        case 'relevant_experience':
          if (!value.trim()) {
            error = 'Relevant experience is required';
          } else {
            error =
              ValidationPatterns.relevantExperience(
                value,
                data.total_experience
              ) || '';
          }
          break;
        case 'current_ctc':
          if (!value.trim()) {
            error = 'Current CTC is required';
          } else {
            const numValue = parseInt(value.replace(/,/g, ''), 10);
            if (isNaN(numValue) || numValue < 0) {
              error = 'Please enter a valid positive integer';
            }
          }
          break;
        case 'expected_ctc':
          if (!value.trim()) {
            error = 'Expected CTC is required';
          } else {
            const numValue = parseInt(value.replace(/,/g, ''), 10);
            if (isNaN(numValue) || numValue < 0) {
              error = 'Please enter a valid positive integer';
            }
          }
          break;
        case 'current_location':
          if (!value.trim()) {
            error = 'Current location is required';
          }
          break;
        case 'preferred_location':
          if (!value.trim()) {
            error = 'Preferred location is required';
          }
          break;
        case 'notice_period':
          if (!value || value === '') {
            error = 'Notice period is required';
          }
          break;
        case 'job_open_type':
          if (!value || value === '') {
            error = 'Job open type is required';
          }
          break;
        case 'shift':
          if (!value || value === '') {
            error = 'Shift is required';
          }
          break;
        case 'preferred_job':
          if (!value || value === '') {
            error = 'Preferred job is required';
          }
          break;


        case 'source_type':
          if (!value || value === '') {
            error = 'Source type is required';
          }
          break;
        case 'source_name':
          if (!value || value === '') {
            error = 'Source name is required';
          }
          break;
        case 'linkedin_profile':
          if (value) {
            const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/;
            if (!linkedinRegex.test(value)) {
              error = 'Please enter a valid LinkedIn profile URL';
            }
          }
          break;
        default:
          break;
      }
      return error;
    },
    [data.total_experience]
  );

  const handleChange = useCallback(
    (field: keyof ProfessionalFormData, value: any) => {
      setData((prev: ProfessionalFormData) => ({ ...prev, [field]: value }));

      // Validate field on change
      if (typeof value === 'string') {
        const error = validateField(field, value);
        setValidationErrors(prev => ({
          ...prev,
          [field]: error,
        }));

        // Also revalidate relevant_experience when total_experience changes
        if (field === 'total_experience' && data.relevant_experience) {
          const relevantError = validateField(
            'relevant_experience',
            data.relevant_experience
          );
          setValidationErrors(prev => ({
            ...prev,
            relevant_experience: relevantError,
          }));
        }
      }
    },
    [validateField, data.relevant_experience]
  );

  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      validateAllFields: () => {
        // Unfocus any focused field and ensure data is sent
        setFocusedField(null);

        // Manually trigger data send if there are unsent changes
        if (JSON.stringify(data) !== JSON.stringify(lastSentData)) {
          sendData(data);
        }

        // Validate all fields and set errors
        const fields = Object.keys(data) as (keyof ProfessionalFormData)[];
        let hasError = false;
        const newErrors: Record<string, string> = {};
        fields.forEach(field => {
          const error = validateField(field, data[field] || '');
          if (error) hasError = true;
          newErrors[field] = error;
        });
        setValidationErrors(newErrors);
        return !hasError;
      },
    }),
    [data, lastSentData, onDataChange, validateField]
  );

  return (
    <div
      className="p-6 space-y-6"
      onFocus={e =>
        handleFocus(e.target.getAttribute('data-field') || 'unknown')
      }
      onBlur={handleBlur}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedInputField
          label="Total Experience (Years)"
          type="number"
          value={data.total_experience}
          onChange={value => handleChange('total_experience', value)}
          required
          error={validationErrors.total_experience}
        />
        <EnhancedInputField
          label="Relevant Experience (Years)"
          type="number"
          value={data.relevant_experience}
          onChange={value => handleChange('relevant_experience', value)}
          required
          error={validationErrors.relevant_experience}
        />
        <EnhancedInputField
          label="Current CTC"
          type="text"
          value={data.current_ctc}
          onChange={value => handleChange('current_ctc', value)}
          formatValue={value => {
            // Format number with Indian comma system (integers only)
            if (!value || value === '') return '';
            const numStr = value.toString().replace(/[^0-9]/g, ''); // Remove all non-numeric characters
            if (!numStr || isNaN(Number(numStr))) return '';
            return Number(numStr).toLocaleString('en-IN');
          }}
          parseValue={value => {
            // Remove all non-numeric characters (commas, decimals, etc.) for storage (integers only)
            const cleaned = value.replace(/[^0-9]/g, '');
            return cleaned;
          }}
          inputMode="numeric"
          placeholder="e.g., 4,90,000"
          required
          error={validationErrors.current_ctc}
        />
        <EnhancedInputField
          label="Expected CTC"
          type="text"
          value={data.expected_ctc}
          onChange={value => handleChange('expected_ctc', value)}
          formatValue={value => {
            // Format number with Indian comma system (integers only)
            if (!value || value === '') return '';
            const numStr = value.toString().replace(/[^0-9]/g, ''); // Remove all non-numeric characters
            if (!numStr || isNaN(Number(numStr))) return '';
            return Number(numStr).toLocaleString('en-IN');
          }}
          parseValue={value => {
            // Remove all non-numeric characters (commas, decimals, etc.) for storage (integers only)
            const cleaned = value.replace(/[^0-9]/g, '');
            return cleaned;
          }}
          inputMode="numeric"
          placeholder="e.g., 6,00,000"
          required
          error={validationErrors.expected_ctc}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchDropdown
          label="Current Location"
          options={locationOptions}
          value={data.current_location}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            handleChange(
              'current_location',
              value && !Array.isArray(value) ? value.label : ''
            );
            setFocusedField(null);
          }}
          onInputChange={searchLocations}
          loading={locationLoading}
          placeholder="Select current location..."
          required
          error={validationErrors.current_location}
        />
        <SearchDropdown
          label="Preferred Locations"
          options={getMergedLocationOptions()}
          value={getLocationValuesArray()}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            const optionsArray = Array.isArray(value)
              ? value
              : value
                ? [value]
                : [];

            handleLocationChange(
              optionsArray.map(v => ({ value: v.value, label: v.label }))
            );
            setFocusedField(null);
          }}
          onInputChange={searchLocations}
          loading={locationLoading}
          placeholder="Select preferred locations..."
          isMulti={true}
          required
          error={validationErrors.preferred_location}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchDropdown
          label="Job Open Type"
          options={jobOpenTypeOptions}
          value={data.job_open_type}
          isMulti={true}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            if (Array.isArray(value)) {
              handleChange('job_open_type', value.map(opt => opt.label));
            } else if (value) {
              handleChange('job_open_type', [value.label]);
            } else {
              handleChange('job_open_type', []);
            }
            setFocusedField(null);
          }}
          loading={staticDropdownsLoading}
          placeholder="Select job open type..."
          required
          error={validationErrors.job_open_type}
        />
        <SearchDropdown
          label="Preferred Job"
          value={data.preferred_job}
          isMulti={true}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            if (Array.isArray(value)) {
              handleChange('preferred_job', value.map(opt => opt.label));
            } else if (value) {
              handleChange('preferred_job', [value.label]);
            } else {
              handleChange('preferred_job', []);
            }
            setFocusedField(null);
          }}
          options={jobPreferenceSelectOptions.filter(option => option.label !== 'Any')}
          disabled={staticDropdownsLoading}
          required
          error={validationErrors.preferred_job}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchDropdown
          label="Job Preference"
          value={data.job_preference}
          isMulti={true}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            if (Array.isArray(value)) {
              handleChange('job_preference', value.map(opt => opt.label));
            } else if (value) {
              handleChange('job_preference', [value.label]);
            } else {
              handleChange('job_preference', []);
            }
            setFocusedField(null);
          }}
          options={jobTypeSelectOptions}
          disabled={staticDropdownsLoading}
          error={validationErrors.job_preference}
        />
        <SearchDropdown
          label="Shift"
          options={shiftsOptions}
          value={data.shift}
          isMulti={true}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            if (Array.isArray(value)) {
              handleChange('shift', value.map(opt => opt.label));
            } else if (value) {
              handleChange('shift', [value.label]);
            } else {
              handleChange('shift', []);
            }
            setFocusedField(null);
          }}
          loading={staticDropdownsLoading}
          placeholder="Select shift preference..."
          required
          error={validationErrors.shift}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchDropdown
          label="Notice Period"
          options={noticePeriodOptions}
          value={data.notice_period}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            handleChange(
              'notice_period',
              value && !Array.isArray(value) ? value.label : ''
            );
            setFocusedField(null);
          }}
          loading={staticDropdownsLoading}
          placeholder="Select notice period..."
          required
          error={validationErrors.notice_period}
        />
        <SearchDropdown
          label="Source Type"
          options={sourceTypeOptions}
          value={data.source_type}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            const sourceTypeValue = value && !Array.isArray(value) ? value.value : '';
            handleChange('source_type', sourceTypeValue);
            setSelectedSourceType(sourceTypeValue);
            // Clear source name when source type changes
            handleChange('source_name', '');
            setFocusedField(null);
          }}
          onInputChange={searchSourceType}
          loading={sourceTypeLoading}
          placeholder="Select source type..."
          required
          error={validationErrors.source_type}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchDropdown
          label="Source Name"
          options={sourceNameOptions}
          value={data.source_name}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            handleChange(
              'source_name',
              value && !Array.isArray(value) ? value.label : ''
            );
            setFocusedField(null);
          }}
          onInputChange={searchSourceName}
          loading={sourceNameLoading}
          placeholder="Select source name..."
          disabled={!selectedSourceType}
          required
          error={validationErrors.source_name}
        />
        <SearchDropdown
          label="Career Break Type"
          options={careerBreakTypeOptions}
          value={data.career_break_type}
          onChange={(value: DropdownOption | DropdownOption[] | null) => {
            handleChange(
              'career_break_type',
              value && !Array.isArray(value) ? value.label : ''
            );
            // Reset duration when career break type changes
            handleChange('duration', []);
            setFocusedField(null);
          }}
          loading={careerBreakTypeLoading}
          placeholder="Select career break type..."
        />
      </div>

      {data.career_break_type && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <EnhancedInputField
                  type="date"
                  placeholder="From Date"
                  value={data.duration?.[0]?.from_date || ''}
                  onChange={(value: string) => {
                    const newDuration = [...(data.duration || [])];
                    if (newDuration.length === 0) {
                      newDuration.push({ from_date: value, to_date: null });
                    } else {
                      newDuration[0] = { ...newDuration[0], from_date: value };
                    }
                    handleChange('duration', newDuration);
                  }}
                />
              </div>
              <span className="text-gray-500 font-medium px-1">To</span>
              <div className="flex-1">
                <EnhancedInputField
                  type="date"
                  placeholder="To Date"
                  min={data.duration?.[0]?.from_date || ''}
                  value={data.duration?.[0]?.to_date || ''}
                  onChange={(value: string) => {
                    const newDuration = [...(data.duration || [])];
                    if (newDuration.length === 0) {
                      newDuration.push({ from_date: null, to_date: value });
                    } else {
                      newDuration[0] = { ...newDuration[0], to_date: value };
                    }
                    handleChange('duration', newDuration);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfessionalDetailsForm = forwardRef(ProfessionalDetailsFormInner);
