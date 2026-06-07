import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import SearchDropdown from '../../../molecules/SearchDropdown';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import DateInput from '../../../atoms/DateInput/DateInput';
import { useCitiesDropdown } from '../../../../hooks/useCitiesDropdown';
import { useEmployersDropdown, useDesignationsDropdown, useJobTypesDropdown } from '../../../../hooks/useDropdowns';

interface EmploymentFormData {
  id?: string;
  organizationName: string;
  jobType: string;
  payrollOrganization: string;
  designation: string;
  location: string;
  country: string;
  state: string;
  city: string;
  fromDate: string;
  toDate: string;
  isCurrentJob: boolean;
}

interface BulkEmploymentFormProps {
  initialData: { employment: EmploymentFormData[] };
  onDataChange: (data: any) => void;
  canUpdateCandidates: boolean;
  canDeleteCandidates: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

const BulkEmploymentForm = forwardRef<any, BulkEmploymentFormProps>(
  (
    {
      initialData,
      onDataChange,
      canUpdateCandidates,
      canDeleteCandidates,
      onValidationChange,
    },
    ref
  ) => {
    // Expose validateAllFields to parent via ref
    useImperativeHandle(ref, () => ({
      validateAllFields: () => {
        // Validate all fields for all employments
        let allValid = true;
        data.employment.forEach((employment, index) => {
          Object.keys(employment).forEach(field => {
            const value = (employment as any)[field];
            const error = validateEmploymentField(
              index,
              field,
              value,
              employment,
              data.employment
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
          });
        });
        return allValid;
      },
    }));

    // Use searchable dropdown hooks
    const {
      options: employerOptions,
      loading: employerLoading,
      search: searchEmployers,
    } = useEmployersDropdown();

    const {
      options: designationOptions,
      loading: designationLoading,
      search: searchDesignations,
    } = useDesignationsDropdown();

    const {
      options: jobTypeOptions,
      loading: jobTypeLoading,
      search: searchJobTypes,
    } = useJobTypesDropdown();

    const {
      options: locationOptions,
      loading: locationLoading,
      search: searchLocations,
    } = useCitiesDropdown();

    const [data, setData] = useState(initialData);
    const [lastSentData, setLastSentData] = useState(initialData);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<
      Record<string, Record<string, string>>
    >({});

    // Helper function to sort employment entries by date (latest first, isCurrentJob last)
    const sortEmploymentByDate = useCallback((employmentList: EmploymentFormData[]) => {
      return [...employmentList].sort((a, b) => {
        // isCurrentJob entries go to the end
        if (a.isCurrentJob && !b.isCurrentJob) return 1;
        if (!a.isCurrentJob && b.isCurrentJob) return -1;
        if (a.isCurrentJob && b.isCurrentJob) return 0;

        // Sort by fromDate (latest first)
        const dateA = a.fromDate ? new Date(a.fromDate).getTime() : 0;
        const dateB = b.fromDate ? new Date(b.fromDate).getTime() : 0;
        return dateB - dateA;
      });
    }, []);

    // Send updates when focus changes or when data changes significantly
    useEffect(() => {
      if (
        !focusedField &&
        JSON.stringify(data) !== JSON.stringify(lastSentData)
      ) {
        // Auto-sort employment entries by date before sending to parent
        const sortedData = {
          ...data,
          employment: sortEmploymentByDate(data.employment),
        };
        onDataChange(sortedData);
        setLastSentData(data);
      }
    }, [data, lastSentData, focusedField, onDataChange, sortEmploymentByDate]);

    // Trigger validation when errors change
    useEffect(() => {
      const hasErrors = Object.values(validationErrors).some(errors =>
        Object.values(errors).some(error => error !== '')
      );
      onValidationChange?.(!hasErrors);
    }, [validationErrors, onValidationChange]);

    // Validation functions
    const validateEmploymentField = useCallback(
      (
        index: number,
        field: string,
        value: string,
        employment: EmploymentFormData,
        allEmployment?: EmploymentFormData[]
      ) => {
        const parseRange = (emp: EmploymentFormData) => {
          const start = emp.fromDate ? new Date(emp.fromDate).getTime() : NaN;
          const end = emp.isCurrentJob
            ? new Date().getTime()
            : emp.toDate
              ? new Date(emp.toDate).getTime()
              : NaN;
          return { start, end };
        };

        const hasOverlap = (current: EmploymentFormData) => {
          if (!allEmployment) return false;
          const { start, end } = parseRange(current);
          if (Number.isNaN(start) || Number.isNaN(end)) return false;

          return allEmployment.some((other, otherIndex) => {
            if (otherIndex === index) return false;
            const { start: otherStart, end: otherEnd } = parseRange(other);
            if (Number.isNaN(otherStart) || Number.isNaN(otherEnd)) return false;
            return start < otherEnd && end > otherStart;
          });
        };

        let error = '';
        // Required fields validation
        switch (field) {
          case 'organizationName':
            if (!value.trim()) error = 'Organization name is required';
            break;
          case 'jobType':
            if (!value.trim()) error = 'Job type is required';
            break;
          case 'payrollOrganization':
            if (!value.trim()) error = 'Payroll organization is required';
            break;
          case 'designation':
            if (!value.trim()) error = 'Designation is required';
            break;
          case 'location':
            if (!value.trim()) error = 'Location is required';
            break;
          case 'fromDate':
            if (!value.trim()) {
              error = 'From date is required';
            } else {
              const fromDate = new Date(value);
              const today = new Date();
              if (fromDate > today) {
                error = 'From date cannot be in the future';
              }
              // No sequential date validation - allow any order, data will be auto-sorted
            }
            break;
          case 'toDate':
            if (!employment.isCurrentJob && !value.trim()) {
              error = 'To date is required';
            } else if (value.trim() && employment.fromDate) {
              const fromDate = new Date(employment.fromDate);
              const toDate = new Date(value);
              if (toDate < fromDate) {
                error = 'To date cannot be before from date';
              }
              if (toDate > new Date()) {
                error = 'To date cannot be in the future';
              }
            }
            break;
        }

        // Cross-entry overlap validation (only for date fields when both dates are available)
        if (!error && (field === 'fromDate' || field === 'toDate' || field === 'isCurrentJob')) {
          const updatedEmployment: EmploymentFormData = {
            ...employment,
            [field]: value,
          };

          const { start, end } = parseRange(updatedEmployment);
          if (!Number.isNaN(start) && !Number.isNaN(end) && hasOverlap(updatedEmployment)) {
            error = 'Employment date range overlaps with another employment entry';
          }
        }

        return error;
      },
      []
    );

    const handleEmploymentChange = useCallback(
      (index: number, field: keyof EmploymentFormData, value: any) => {
        setData(prev => {
          const updatedEmployment = [...prev.employment];

          // Handle current job logic - clear toDate when isCurrentJob state changes
          if (field === 'isCurrentJob') {
            updatedEmployment[index] = {
              ...updatedEmployment[index],
              [field]: value,
              toDate: '', // Reset toDate when checkbox state changes
            };
          } else if (field === 'jobType' && value === 'FTE') {
            // If jobType is set to 'FTE', set payrollOrganization to organizationName
            updatedEmployment[index] = {
              ...updatedEmployment[index],
              [field]: value,
              payrollOrganization: updatedEmployment[index].organizationName,
            };
            // Clear payrollOrganization validation error when disabled
            setValidationErrors(prev => ({
              ...prev,
              [index]: {
                ...prev[index],
                payrollOrganization: '',
              },
            }));
          } else {
            updatedEmployment[index] = {
              ...updatedEmployment[index],
              [field]: value,
            };
          }

          return { ...prev, employment: updatedEmployment };
        });

        // Validate field on change
        if (typeof value === 'string') {
          setData(prev => {
            const employment = prev.employment[index];
            const error = validateEmploymentField(
              index,
              field,
              value,
              employment,
              prev.employment
            );
            setValidationErrors(prevErrors => ({
              ...prevErrors,
              [index]: {
                ...prevErrors[index],
                [field]: error,
              },
            }));

            // Also revalidate toDate when fromDate changes
            if (field === 'fromDate' && employment.toDate) {
              const toDateError = validateEmploymentField(
                index,
                'toDate',
                employment.toDate,
                { ...employment, fromDate: value },
                prev.employment
              );
              setValidationErrors(prevErrors => ({
                ...prevErrors,
                [index]: {
                  ...prevErrors[index],
                  toDate: toDateError,
                },
              }));
            }

            return prev;
          });
        }
      },
      [validateEmploymentField]
    );

    const handleFocus = useCallback((field: string) => {
      setFocusedField(field);
    }, []);

    const handleBlur = useCallback(() => {
      setFocusedField(null);
    }, []);

    const handleAddEmployment = () => {
      if (!canUpdateCandidates) {
        console.warn('User does not have permission to update candidate data');
        return;
      }

      // Check if any existing employment has isCurrentJob checked
      const hasAnyCurrentJob = data.employment.some(emp => emp.isCurrentJob);

      const newData = {
        ...data,
        employment: [
          ...data.employment,
          {
            organizationName: '',
            jobType: '',
            payrollOrganization: '',
            designation: '',
            location: '',
            country: '',
            state: '',
            city: '',
            fromDate: '',
            toDate: '',
            isCurrentJob: hasAnyCurrentJob ? false : false, // Always initialize to false for new rows
          },
        ],
      };
      setData(newData);
      onDataChange(newData);
      setLastSentData(newData);
    };

    const handleRemoveEmployment = (index: number) => {
      if (!canDeleteCandidates) {
        console.warn('User does not have permission to delete candidate data');
        return;
      }
      const newData = {
        ...data,
        employment: data.employment.filter((_, i) => i !== index),
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
          {data.employment.map((employment, index) => (
            <div
              key={employment.id || index}
              className="p-4 border rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-900 font-semibold">Employment {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    canDeleteCandidates
                      ? () => handleRemoveEmployment(index)
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
                  <div>
                    <SearchDropdown
                      label="Organization Name"
                      options={employerOptions}
                      value={employment.organizationName}
                      onChange={(option: any) => {
                        handleEmploymentChange(index, 'organizationName', option?.label || '');
                        setFocusedField(null);
                      }}
                      required
                      loading={employerLoading}
                      placeholder="Search for organization..."
                      showAddButton={true}
                      dropdownType="Employer"
                      dropdownLabel="Organization"
                      onInputChange={(input: string, action: any) => {
                        // Search when user types
                        if (action.action === 'input-change') {
                          searchEmployers(input);
                        }
                      }}
                      onOptionAdded={(newOption: any) => {
                        // Refresh employer options
                        searchEmployers('');
                      }}
                    />
                    {validationErrors[index]?.organizationName && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.organizationName}
                      </div>
                    )}
                  </div>
                <div>
                  <SearchDropdown
                    label="Job Type"
                    options={jobTypeOptions.filter(option => option.label !== 'Any')}
                    value={employment.jobType}
                    onChange={(option: any) => {
                      handleEmploymentChange(index, 'jobType', option?.label || '');
                      setFocusedField(null);
                    }}
                    required
                    loading={jobTypeLoading}
                    placeholder="Search for job type..."
                    // showAddButton={true}
                    // dropdownType="Job_Type"
                    // dropdownLabel="Job Type"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchJobTypes(input);
                      }
                    }}
                    onOptionAdded={(newOption: any) => {
                      // Refresh job type options
                      searchJobTypes('');
                    }}
                  />
                  {validationErrors[index]?.jobType && (
                    <div className="text-red-500 text-xs mt-1">
                      {validationErrors[index]?.jobType}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SearchDropdown
                    label="Payroll Organization"
                    options={employerOptions}
                    value={employment.payrollOrganization}
                    onChange={(option: any) => {
                      handleEmploymentChange(
                        index,
                        'payrollOrganization',
                        option?.label || ''
                      );
                      setFocusedField(null);
                    }}
                    required
                    loading={employerLoading}
                    placeholder="Search for payroll organization..."
                    disabled={employment.jobType === 'FTE'}
                    showAddButton={true}
                    dropdownType="Employer"
                    dropdownLabel="Payroll Organization"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchEmployers(input);
                      }
                    }}
                    onOptionAdded={(newOption: any) => {
                      // Refresh employer options
                      searchEmployers('');
                    }}
                  />
                  {employment.jobType !== 'FTE' &&
                    validationErrors[index]?.payrollOrganization && (
                      <div className="text-red-500 text-xs mt-1">
                        {validationErrors[index]?.payrollOrganization}
                      </div>
                    )}
                </div>
                <div>
                  <SearchDropdown
                    label="Designation"
                    options={designationOptions}
                    value={employment.designation}
                    onChange={(option: any) => {
                      handleEmploymentChange(index, 'designation', option?.label || '');
                      setFocusedField(null);
                    }}
                    required
                    loading={designationLoading}
                    placeholder="Search for designation..."
                    showAddButton={true}
                    dropdownType="Designation"
                    dropdownLabel="Designation"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchDesignations(input);
                      }
                    }}
                    onOptionAdded={(newOption: any) => {
                      // Refresh designation options
                      searchDesignations('');
                    }}
                  />
                  {validationErrors[index]?.designation && (
                    <div className="text-red-500 text-xs mt-1">
                      {validationErrors[index]?.designation}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="min-h-[76px]">
                  <SearchDropdown
                    label="Location"
                    options={locationOptions}
                    value={employment.location}
                    onChange={(option: any) => {
                      handleEmploymentChange(index, 'location', option?.value || '');
                      setFocusedField(null);
                    }}
                    required
                    onInputChange={searchLocations}
                    loading={locationLoading}
                    placeholder="Search for location..."
                  />
                  {validationErrors[index]?.location && (
                    <div className="text-red-500 text-xs mt-1">
                      {validationErrors[index]?.location}
                    </div>
                  )}
                </div>
                <div className="min-h-[76px]">
                  <DateInput
                    label="From Date"
                    mode="month"
                    value={employment.fromDate}
                    onChange={value =>
                      handleEmploymentChange(index, 'fromDate', value)
                    }
                    required
                    error={validationErrors[index]?.fromDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="min-h-[76px]">
                  <DateInput
                    label="To Date"
                    mode="month"
                    value={employment.toDate}
                    onChange={value =>
                      handleEmploymentChange(index, 'toDate', value)
                    }
                    required
                    disabled={employment.isCurrentJob}
                    min={employment.fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    error={validationErrors[index]?.toDate}
                  />
                </div>
              </div>
              <div className="flex items-center">
                {/* Show checkbox only if no other employment has isCurrentJob checked */}
                {!data.employment.some((emp, i) => i !== index && emp.isCurrentJob) && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={employment.isCurrentJob}
                      onChange={e =>
                        handleEmploymentChange(
                          index,
                          'isCurrentJob',
                          e.target.checked
                        )
                      }
                    />
                    <span className="text-sm">This is my current job</span>
                  </label>
                )}
              </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={canUpdateCandidates ? handleAddEmployment : undefined}
          disabled={!canUpdateCandidates}
          className="w-full"
        >
          <Icon name="plus" size={16} className="mr-2" />
          Add Employment
        </Button>
      </div>
    );
  }
);

export { BulkEmploymentForm };
