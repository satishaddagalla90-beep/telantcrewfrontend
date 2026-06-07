import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import CommonFields, {
  CheckboxField,
  SectionHeader,
} from '../../molecules/CommonFormFields/CommonFormFields';
import EnhancedInputField from '../../molecules/EnhancedInputField';
import AsyncSelect from '../../atoms/AsyncSelect/AsyncSelect';
import SearchDropdown from '../../molecules/SearchDropdown';
import {
  useDropdownData,
  useStaticDropdowns,
} from '../../../hooks/useDropdowns';
import Modal from '../../atoms/Modal/Modal';
import Button from '../../atoms/Button/Button';
import { DropdownOption } from '../../../types';

// Custom hook to fetch city names from countriesnow.space API
interface CityOption {
  value: string;
  label: string;
}

interface CountryData {
  country: string;
  cities: string[];
}

const PAGE_SIZE = 50;

const useCountriesNowCitiesDropdown = () => {
  const [allCities, setAllCities] = useState<string[]>([]);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Fetch all cities on mount
  useEffect(() => {
    setLoading(true);
    fetch('https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries')
      .then(res => res.json())
      .then((data: { data: CountryData[] }) => {
        if (data && data.data) {
          const cities: string[] = data.data.flatMap(
            (country: CountryData) => country.cities || []
          );
          const uniqueCities: string[] = Array.from(new Set(cities)).sort();
          setAllCities(uniqueCities);
        } else {
          setAllCities([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch cities');
        setLoading(false);
      });
  }, []);

  // Update options whenever searchTerm, page, or allCities changes
  useEffect(() => {
    setLoading(true);
    let filtered: string[] = allCities;
    if (searchTerm) {
      filtered = allCities.filter((city: string) =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Always show only PAGE_SIZE * page results, even for search
    const paginated = filtered.slice(0, page * PAGE_SIZE);
    setOptions(paginated.map((city: string) => ({ value: city, label: city })));
    setLoading(false);
  }, [searchTerm, page, allCities]);

  // Debounced search handler
  const debouncedSearch = useRef(
    debounce((inputValue: string) => {
      setSearchTerm(inputValue);
      setPage(1); // Reset to first page on new search
    }, 400)
  ).current;

  // Search handler (with debounce)
  const search = (inputValue: string) => {
    debouncedSearch(inputValue);
  };

  // Pagination handler
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Only allow loading more if there are more filtered results
  const filtered = allCities.filter((city: string) =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return {
    options,
    loading,
    error,
    search,
    loadMore,
    hasMore: options.length < filtered.length,
  };
};
export interface ProfessionalDetailsFormProps {
  formData: {
    total_experience?: string;
    relevantExperience?: string;
    current_ctc?: string;
    expected_ctc?: string;
    notice_period?: string;
    preferred_job?: string | string[]; // "Preferred Job" field - can be multi-select
    job_preference?: string | string[]; // "Job Preference" field - can be multi-select
    job_open_type?: string | string[]; // can be multi-select
    shift?: string | string[]; // can be multi-select
    job_type?: string;
    differently_abled?: string;
    differently_abled_type?: string;
    career_break?: string;
    career_break_type?: string;
    duration?: Array<{
      from_date: string | null;
      to_date: string | null;
    }>;
    linkedin_profile?: string;
    resume?: File | null;
    resumeUrl?: string | null;
    profile_summary?: string;
    location?: string;
    preffered_location?: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  touched?: Record<string, boolean>;
  loading?: {
    cities?: boolean;
    jobs?: boolean;
  };
  onResumeParseAndPopulate?: (file: File, onChange: (field: string, value: any) => void) => Promise<void>;
  resumeUploadState?: { uploading: boolean; error: string | null };
}

const ProfessionalDetailsForm: React.FC<ProfessionalDetailsFormProps> = ({
  formData,
  errors,
  onChange,
  touched = {},
  loading = {},
  onResumeParseAndPopulate,
  resumeUploadState,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  // Fetch job open type options dynamically
  const {
    options: jobOpenTypeOptions,
    loading: jobOpenTypeLoading,
    error: jobOpenTypeError,
  } = useDropdownData('jobOpenType');

  // Fetch shifts options dynamically
  const {
    options: shiftsOptions,
    loading: shiftsLoading,
    error: shiftsError,
  } = useDropdownData('shifts');

  // Fetch job preference options dynamically (for "Preferred Job" field)
  const {
    options: jobPreferenceOptions,
    loading: jobPreferenceLoading,
    error: jobPreferenceError,
  } = useDropdownData('jobPreference');

  // Fetch job type options dynamically (for "Job Preference" field)
  const {
    options: jobTypeOptions,
    loading: jobTypeLoading,
    error: jobTypeError,
  } = useDropdownData('jobType');

  // Fetch career break type options dynamically
  const {
    options: careerBreakTypeOptions,
    loading: careerBreakTypeLoading,
    error: careerBreakTypeError,
  } = useDropdownData('careerBreakType');

  // Fetch notice period options from static dropdowns
  const { noticePeriodOptions } = useStaticDropdowns();

  // Use countriesnow.space API for current location dropdown
  const {
    options: currentLocationOptions,
    loading: currentLocationLoading,
    error: currentLocationError,
    search: searchCurrentLocation,
    loadMore: loadMoreCurrentLocation,
    hasMore: hasMoreCurrentLocation,
  } = useCountriesNowCitiesDropdown();

  const {
    options: preferredLocationOptions,
    loading: preferredLocationLoading,
    error: preferredLocationError,
    search: searchPreferredLocation,
    loadMore: loadMorePreferredLocation,
    hasMore: hasMorePreferredLocation,
  } = useCountriesNowCitiesDropdown();

  // Handle resume file upload and parsing (only textCV)
  const handleResumeFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !onResumeParseAndPopulate) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf');
    const isDocx = fileName.endsWith('.docx');

    if (!allowedTypes.includes(file.type) && !isPdf && !isDocx) {
      console.error('Invalid file type:', file.type);
      alert('Please upload a PDF or DOCX file only');
      event.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      alert('File size must be less than 10MB');
      event.target.value = ''; // Reset input
      return;
    }

    console.log('File validation passed, starting upload...');
    setIsParsing(true);
    try {
      console.log('Calling onResumeParseAndPopulate with file:', file.name);
      await onResumeParseAndPopulate(file, onChange);
      console.log('Resume upload and parse completed successfully');
    } catch (error) {
      console.error('Resume upload/parse failed:', error);
    } finally {
      setIsParsing(false);
      event.target.value = ''; // Reset input for next use
    }
  };

  // Resume upload handler removed - resume is now uploaded in Step 1 (Personal Details)

  // Create options with placeholder for notice period
  const noticePeriodSelectOptions = [
    { value: '', label: 'Select notice period' },
    ...noticePeriodOptions,
  ];

  // Create options with placeholder for career break type
  const careerBreakTypeSelectOptions = [
    { value: '', label: 'Select career break type' },
    ...careerBreakTypeOptions,
  ];

  // Modal state management
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '',
    title: '',
    placeholder: '',
    value: '',
  });

  // Modal handlers
  const openModal = (type: string, title: string, placeholder: string) => {
    setModalState({
      isOpen: true,
      type,
      title,
      placeholder,
      value: '',
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: '',
      title: '',
      placeholder: '',
      value: '',
    });
  };

  const handleModalSubmit = () => {
    if (modalState.value.trim()) {
      // For now, we'll just close the modal
      // In a real app, this would save to a backend
      closeModal();
    }
  };

  // Helper function to convert ID to label (name) by looking up in dropdown options
  const convertIdToLabel = (id: string, options: any[]): string => {
    if (!id || !options || options.length === 0) return id;
    const option = options.find(opt => opt.value === id || opt.id === id);
    return option ? option.label : id;
  };

  // Helper function to convert stored labels/array to option values for SearchDropdown display
  const getSelectedValuesFromString = (
    labels: string | string[] | undefined,
    options: DropdownOption[]
  ): string | string[] => {
    if (!labels) return [];

    // If array of labels, find matching values and return
    if (Array.isArray(labels)) {
      return labels
        .map(label => {
          const option = options.find(opt => opt.label === label);
          return option ? option.value : label;
        })
        .filter(v => v);
    }

    // If single label string, find matching value
    if (typeof labels === 'string') {
      const option = options.find(opt => opt.label === labels);
      return option ? option.value : labels;
    }

    return [];
  };

  // Helper function to convert between string values and AsyncSelectOption format for locations
  const getLocationOptionFromValue = (
    value: string,
    options: Array<{ value: string; label: string }>
  ) => {
    if (!value) return null;
    const option = options.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Store preferred locations as objects internally to preserve value-label pairs
  const [preferredLocationObjects, setPreferredLocationObjects] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Track the last processed preferred_location value to avoid re-processing
  const lastProcessedLocation = useRef<string>('');

  // Initialize/update preferred locations from formData only when it actually changes
  useEffect(() => {
    const currentValue = formData.preffered_location;

    // Handle array format (current storage format)
    if (Array.isArray(currentValue) && currentValue.length > 0) {
      if (typeof currentValue[0] === 'object') {
        // Already in object format, use as-is
        if (
          JSON.stringify(currentValue) !==
          JSON.stringify(preferredLocationObjects)
        ) {
          setPreferredLocationObjects(currentValue);
        }
        return;
      }
    }

    // Handle string format
    const locString = typeof currentValue === 'string' ? currentValue : '';

    // Only process if the value has actually changed
    if (locString !== lastProcessedLocation.current) {
      lastProcessedLocation.current = locString;

      if (locString) {
        const locationNames = locString.split(',').map(loc => loc.trim());

        // Map location names to their full value-label pairs
        const locationObjs = locationNames.map(name => {
          // Try to find matching option by label (case-insensitive)
          const matchingOption = preferredLocationOptions.find(
            (opt: CityOption) => opt.label.toLowerCase() === name.toLowerCase()
          );

          if (matchingOption) {
            return { value: matchingOption.value, label: matchingOption.label };
          } else {
            return { value: name, label: name };
          }
        });

        setPreferredLocationObjects(locationObjs);
      } else {
        setPreferredLocationObjects([]);
      }
    }
  }, [
    formData.preffered_location,
    preferredLocationOptions,
    preferredLocationObjects,
  ]);

  // One-time enrichment: When locationOptions first loads, enrich any temp locations
  const optionsEnriched = useRef(false);
  useEffect(() => {
    if (
      !optionsEnriched.current &&
      preferredLocationOptions.length > 0 &&
      preferredLocationObjects.length > 0
    ) {
      optionsEnriched.current = true;

      const enrichedLocations = preferredLocationObjects.map(loc => {
        const matchingOption = preferredLocationOptions.find(
          (opt: CityOption) =>
            opt.label.toLowerCase() === loc.label.toLowerCase()
        );

        if (matchingOption && loc.value === loc.label) {
          return { value: matchingOption.value, label: matchingOption.label };
        }
        return loc;
      });

      if (
        JSON.stringify(enrichedLocations) !==
        JSON.stringify(preferredLocationObjects)
      ) {
        setPreferredLocationObjects(enrichedLocations);
        // Update formData with enriched values
        onChange('preffered_location', enrichedLocations);
      }
    }
  }, [preferredLocationOptions, preferredLocationObjects, onChange]);

  // Merge current selections with available options
  const getMergedLocationOptions = (): DropdownOption[] => {
    const selectedAsOptions: DropdownOption[] = preferredLocationObjects.map(
      loc => ({
        value: loc.value,
        label: loc.label,
        id: loc.value,
      })
    );

    const mergedOptions = [...selectedAsOptions];
    preferredLocationOptions.forEach((opt: CityOption) => {
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

  // Handle location change
  const handleLocationChange = (selectedOptions: any) => {
    const optionsArray = Array.isArray(selectedOptions)
      ? selectedOptions
      : selectedOptions
        ? [selectedOptions]
        : [];

    const newLocationObjects = optionsArray.map((opt: any) => ({
      value: opt.value,
      label: opt.label,
    }));

    setPreferredLocationObjects(newLocationObjects);
    onChange('preffered_location', newLocationObjects);
  };

  // Differently abled type options - dummy data
  const differentlyAbledTypeOptions = [
    { value: '', label: 'Select disability type' },
    { value: 'Visual Impairment', label: 'Visual Impairment' },
    { value: 'Hearing Impairment', label: 'Hearing Impairment' },
    { value: 'Physical Disability', label: 'Physical Disability' },
    { value: 'Learning Disability', label: 'Learning Disability' },
    { value: 'Mental Health Condition', label: 'Mental Health Condition' },
    { value: 'Speech Impairment', label: 'Speech Impairment' },
    { value: 'Multiple Disabilities', label: 'Multiple Disabilities' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Professional Details
      </h3>
      {/* First Row: Experience and CTC - 4 columns */}
      <div className="grid grid-cols-4 gap-3">
        {/* Total Experience */}
        <div className="col-span-1">
          {CommonFields.totalExperience(
            formData.total_experience || '',
            (value: string) => onChange('total_experience', value),
            errors.total_experience
          )}
        </div>

        {/* Relevant Experience */}
        <div className="col-span-1">
          {CommonFields.relevantExperience(
            formData.relevantExperience || '',
            (value: string) => onChange('relevantExperience', value),
            errors.relevantExperience,
            loading.jobs || false,
            formData.total_experience || ''
          )}
        </div>

        {/* Current CTC */}
        <div className="col-span-1">
          {CommonFields.currentCTC(
            formData.current_ctc || '',
            (value: string) => onChange('current_ctc', value),
            errors.current_ctc
          )}
        </div>

        {/* Expected CTC */}
        <div className="col-span-1">
          {CommonFields.expectedCTC(
            formData.expected_ctc || '',
            (value: string) => onChange('expected_ctc', value),
            errors.expected_ctc
          )}
        </div>
      </div>
      {/* Second Row: Location and Job Preferences - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Location */}
        <div className="col-span-1">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Current Location <span className="text-red-500">*</span>
                </label>
                <AsyncSelect
                  value={getLocationOptionFromValue(
                    formData.location || '',
                    currentLocationOptions
                  )}
                  onChange={option => {
                    // Convert ID to name/label before saving
                    const locationName = option?.label || '';
                    onChange('location', locationName);
                  }}
                  onInputChange={searchCurrentLocation}
                  options={currentLocationOptions}
                  isLoading={currentLocationLoading}
                  placeholder="Search and select current location..."
                  isClearable={true}
                  disabled={false}
                  size="md"
                  error={errors.location}
                  onMenuScrollToBottom={() => {
                    if (hasMoreCurrentLocation) loadMoreCurrentLocation();
                  }}
                />
              </div>
            </div>
            {/* <Button
              variant="outline"
              size="sm"
              iconOnly
              icon="plus"
              onClick={() =>
                openModal(
                  'currentLocation',
                  'Add New Location',
                  'Enter current location'
                )
              }
              title="Add new location"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
            /> */}
          </div>
        </div>

        {/* Preferred Location - Multi-Select */}
        <div className="col-span-1">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <SearchDropdown
                label="Preferred Locations"
                options={getMergedLocationOptions()}
                value={getLocationValuesArray()}
                onChange={handleLocationChange}
                onInputChange={searchPreferredLocation}
                loading={preferredLocationLoading}
                placeholder="Search......"
                isMulti={true}
                isClearable={true}
                required
                error={
                  errors.preffered_location ||
                  preferredLocationError ||
                  undefined
                }
                onMenuScrollToBottom={() => {
                  if (hasMorePreferredLocation) loadMorePreferredLocation();
                }}
              />
            </div>
            {/* <Button
              variant="outline"
              size="sm"
              iconOnly
              icon="plus"
              onClick={() =>
                openModal(
                  'preferredLocation',
                  'Add New Location',
                  'Enter preferred location'
                )
              }
              title="Add new location"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
            /> */}
          </div>
        </div>

        {/* Notice Period */}
        <EnhancedInputField
          label="Notice Period"
          value={formData.notice_period || ''}
          onChange={(value: string) => {
            // Convert ID to name/label before saving
            const noticePeriodName = convertIdToLabel(
              value,
              noticePeriodOptions
            );
            onChange('notice_period', noticePeriodName);
          }}
          error={errors.notice_period}
          type="select"
          options={noticePeriodSelectOptions}
          gridCols="col-span-1"
          required
        />

        {/* Preferred Job - uses jobPreference API */}
        <div className="col-span-1">
          <SearchDropdown
            label="Preferred Job"
            value={formData.preferred_job || []}
            onChange={(selectedOption: DropdownOption | DropdownOption[] | null) => {
              // Store selected options as array directly
              if (Array.isArray(selectedOption)) {
                onChange('preferred_job', selectedOption.map(opt => opt.label));
              } else if (selectedOption) {
                onChange('preferred_job', [selectedOption.label]);
              } else {
                onChange('preferred_job', []);
              }
            }}
            error={errors.preferred_job || jobPreferenceError || undefined}
            // Map options to use label as value to avoid ID collision
            options={jobPreferenceOptions
              .filter(option => option.label !== 'Any')
              .map(opt => ({ ...opt, value: opt.label }))}
            isMulti={true}
            disabled={jobPreferenceLoading}
            loading={jobPreferenceLoading}
            required
            placeholder="Select preferred job(s)"
          />
        </div>
      </div>
      {/* Third Row: Job Details - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Job Open Type - dynamic dropdown with API options */}
        <SearchDropdown
          label="Job Open Type"
          value={formData.job_open_type || []}
          onChange={(selectedOption: DropdownOption | DropdownOption[] | null) => {
            // Store selected options as array directly
            if (Array.isArray(selectedOption)) {
              onChange('job_open_type', selectedOption.map(opt => opt.label));
            } else if (selectedOption) {
              onChange('job_open_type', [selectedOption.label]);
            } else {
              onChange('job_open_type', []);
            }
          }}
          error={errors.job_open_type || jobOpenTypeError || undefined}
          // Map options to use label as value to avoid ID collision
          options={jobOpenTypeOptions.map(opt => ({ ...opt, value: opt.label }))}
          isMulti={true}
          disabled={jobOpenTypeLoading}
          loading={jobOpenTypeLoading}
          required
          placeholder="Select job open type(s)"
        />

        {/* Shifts - dynamic dropdown with API options */}
        <SearchDropdown
          label="Shifts"
          value={getSelectedValuesFromString(formData.shift, shiftsOptions)}
          onChange={(selectedOption: DropdownOption | DropdownOption[] | null) => {
            // Store selected options as array directly
            if (Array.isArray(selectedOption)) {
              onChange('shift', selectedOption.map(opt => opt.label));
            } else if (selectedOption) {
              onChange('shift', [selectedOption.label]);
            } else {
              onChange('shift', []);
            }
          }}
          error={errors.shift || shiftsError || undefined}
          options={shiftsOptions}
          isMulti={true}
          disabled={shiftsLoading}
          loading={shiftsLoading}
          required
          placeholder="Select shift(s)"
        />

        {/* Job Preference - uses jobType API */}
        <SearchDropdown
          label="Job Preference"
          value={formData.job_preference || []}
          onChange={(selectedOption: DropdownOption | DropdownOption[] | null) => {
            // Store selected options as array directly
            if (Array.isArray(selectedOption)) {
              onChange('job_preference', selectedOption.map(opt => opt.label));
            } else if (selectedOption) {
              onChange('job_preference', [selectedOption.label]);
            } else {
              onChange('job_preference', []);
            }
          }}
          error={errors.job_preference || jobTypeError || undefined}
          // Map options to use label as value to avoid ID collision
          options={jobTypeOptions.map(opt => ({ ...opt, value: opt.label }))}
          isMulti={true}
          disabled={jobTypeLoading}
          loading={jobTypeLoading}
          placeholder="Select job preference(s)"
        />
      </div>

      {/* Fourth Row: Additional Information - 2 columns for checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Career Break Checkbox */}
        <CheckboxField
          label="Career Break"
          checked={formData.career_break === 'Yes'}
          onChange={checked => onChange('career_break', checked ? 'Yes' : '')}
          gridCols="col-span-1"
        />

        {/* Differently Abled Checkbox */}
        <CheckboxField
          label="Differently Abled"
          checked={formData.differently_abled === 'Yes'}
          onChange={checked =>
            onChange('differently_abled', checked ? 'Yes' : '')
          }
          gridCols="col-span-1"
        />
      </div>

      {/* Fifth Row: Conditional dropdowns for Career Break Type and Disability Type - 2 columns */}
      {/* Fifth Row: Conditional dropdowns for Career Break Type and Disability Type - 3 columns */}
      {(formData.career_break === 'Yes' ||
        formData.differently_abled === 'Yes') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Career Break Type - conditional */}
            {formData.career_break === 'Yes' && (
              <div className="col-span-1">
                <EnhancedInputField
                  label="Career Break Type"
                  value={formData.career_break_type || ''}
                  onChange={(value: string) => {
                    // Convert ID to name/label before saving
                    const careerBreakTypeName = convertIdToLabel(
                      value,
                      careerBreakTypeOptions
                    );
                    onChange('career_break_type', careerBreakTypeName);
                    // Reset duration when career break type changes
                    onChange('duration', []);
                  }}
                  error={
                    errors.career_break_type || careerBreakTypeError || undefined
                  }
                  type="select"
                  options={careerBreakTypeSelectOptions}
                  loading={careerBreakTypeLoading}
                  disabled={careerBreakTypeLoading}
                  gridCols="col-span-1"
                />
              </div>
            )}

            {/* Duration - conditional */}
            {formData.career_break === 'Yes' && (
              <div className="col-span-1 flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <EnhancedInputField
                      type="date"
                      placeholder="From Date"
                      disabled={!formData.career_break_type}
                      value={formData.duration?.[0]?.from_date || ''}
                      onChange={(value: string) => {
                        const newDuration = [...(formData.duration || [])];
                        if (newDuration.length === 0) {
                          newDuration.push({ from_date: value, to_date: null });
                        } else {
                          newDuration[0] = { ...newDuration[0], from_date: value };
                        }
                        onChange('duration', newDuration);
                      }}
                      gridCols="col-span-1"
                    />
                  </div>
                  <span className="text-gray-500 font-medium px-1">To</span>
                  <div className="flex-1">
                    <EnhancedInputField
                      type="date"
                      placeholder="To Date"
                      disabled={!formData.career_break_type}
                      min={formData.duration?.[0]?.from_date || ''}
                      value={formData.duration?.[0]?.to_date || ''}
                      onChange={(value: string) => {
                        const newDuration = [...(formData.duration || [])];
                        if (newDuration.length === 0) {
                          newDuration.push({ from_date: null, to_date: value });
                        } else {
                          newDuration[0] = { ...newDuration[0], to_date: value };
                        }
                        onChange('duration', newDuration);
                      }}
                      gridCols="col-span-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Differently Abled Type - conditional */}
            {formData.differently_abled === 'Yes' && (
              <div className="col-span-1">
                <EnhancedInputField
                  label="Disability Type"
                  value={formData.differently_abled_type || ''}
                  onChange={(value: string) => {
                    // Convert ID to name/label before saving (using dummy options array)
                    const disabilityTypeName = convertIdToLabel(
                      value,
                      differentlyAbledTypeOptions
                    );
                    onChange('differently_abled_type', disabilityTypeName);
                  }}
                  error={errors.differently_abled_type}
                  type="select"
                  options={differentlyAbledTypeOptions}
                  gridCols="col-span-1"
                />
              </div>
            )}
          </div>
        )}
      {/* Sixth Row: LinkedIn Profile and Resume Upload/Parse */}
      <div className="grid grid-cols-2 gap-3">
        {/* LinkedIn Profile */}
        <div className="col-span-1">
          {CommonFields.linkedinProfile(
            formData.linkedin_profile || '',
            (value: string) => onChange('linkedin_profile', value),
            errors.linkedin_profile
          )}
        </div>

        <div className="col-span-1">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Resume <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <label className="relative inline-flex items-center w-full">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleResumeFileSelect}
                  disabled={isParsing}
                  className="hidden"
                />
                <span
                    className={`w-full h-[42px] px-4 py-2 border rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center justify-center ${
                      isParsing
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                >
                  {isParsing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload Resume
                    </>
                  )}
                </span>
              </label>
              {formData.resumeUrl && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Resume uploaded
                </div>
              )}
              {resumeUploadState?.error && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {resumeUploadState.error}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              PDF or DOCX only, max 10MB
            </p>
          </div>
        </div>
      </div>
      {/* Profile Summary - Separate Full Width Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Profile Summary</h4>
        <div className="grid grid-cols-1 gap-6">
          {CommonFields.profileSummary(
            formData.profile_summary || '',
            (value: string) => onChange('profile_summary', value),
            errors.profile_summary
          )}
        </div>
      </div>
      {/* Modal for adding new locations */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModalSubmit}>
              Add
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalState.title}
            </label>
            <input
              type="text"
              value={modalState.value}
              onChange={e =>
                setModalState(prev => ({ ...prev, value: e.target.value }))
              }
              placeholder={modalState.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfessionalDetailsForm;
