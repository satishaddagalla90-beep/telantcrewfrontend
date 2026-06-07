import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import Text from '../../atoms/Text/Text';
import Icon from '../../atoms/Icon/Icon';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';

interface Contract {
  contractType: string;
  taxPreference: string;
  paymentTerm: string;
  paymentType: string;
  startDate: string;
  endDate: string;
}

interface ContractStepProps {
  formData: {
    contracts: Contract[];
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ContractStep: React.FC<ContractStepProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  const [contracts, setContracts] = useState<Contract[]>(
    formData.contracts && formData.contracts.length > 0
      ? formData.contracts
      : [
          {
            contractType: '',
            taxPreference: '',
            paymentTerm: '',
            paymentType: '',
            startDate: '',
            endDate: '',
          },
        ]
  );

  // Validation state - for deferred validation like other tabs
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);
  
  const [contractTypeOptions, setContractTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingContractType, setLoadingContractType] = useState(false);
  const [paymentTermOptions, setPaymentTermOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPaymentTerm, setLoadingPaymentTerm] = useState(false);
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPaymentType, setLoadingPaymentType] = useState(false);

  // Fetch contract type options from API with optional search (internal function)
  const fetchContractTypeOptionsInternal = async (searchTerm: string = '') => {
    setLoadingContractType(true);
    try {
      // Since SUPPLIERS doesn't have DROPDOWNS, we'll use CLIENTS endpoint for now
      const url = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Contracts'));
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }
      
      const response = await apiCall<{ data: Array<{ id: string; name: string }> }>(
        url.pathname + url.search
      );
      
      if (response.data && response.data.data) {
        const options = response.data.data.map((contract: { id: string; name: string }) => ({
          value: contract.name,
          label: contract.name,
        }));
        setContractTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching contract type options:', error);
      setContractTypeOptions([]);
    } finally {
      setLoadingContractType(false);
    }
  };

  // Fetch payment term options from API with optional search (internal function)
  const fetchPaymentTermOptionsInternal = async (searchTerm: string = '') => {
    setLoadingPaymentTerm(true);
    try {
      // Since SUPPLIERS doesn't have DROPDOWNS, we'll use CLIENTS endpoint for now
      const url = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Payment_Term'));
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }
      
      const response = await apiCall<{ data: Array<{ id: string; name: string }> }>(
        url.pathname + url.search
      );
      
      if (response.data && response.data.data) {
        const options = response.data.data.map((term: { id: string; name: string }) => ({
          value: term.name,
          label: term.name,
        }));
        setPaymentTermOptions(options);
      }
    } catch (error) {
      console.error('Error fetching payment term options:', error);
      setPaymentTermOptions([]);
    } finally {
      setLoadingPaymentTerm(false);
    }
  };

  // Fetch payment type options from API with optional search (internal function)
  const fetchPaymentTypeOptionsInternal = async (searchTerm: string = '') => {
    setLoadingPaymentType(true);
    try {
      // Since SUPPLIERS doesn't have DROPDOWNS, we'll use CLIENTS endpoint for now
      const url = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Payment_Type'));
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }
      
      const response = await apiCall<{ data: Array<{ id: string; name: string }> }>(
        url.pathname + url.search
      );
      
      if (response.data && response.data.data) {
        const options = response.data.data.map((type: { id: string; name: string }) => ({
          value: type.name,
          label: type.name,
        }));
        setPaymentTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching payment type options:', error);
      setPaymentTypeOptions([]);
    } finally {
      setLoadingPaymentType(false);
    }
  };

  // Debounced search functions
  const debouncedFetchContractType = useDebouncedCallback(fetchContractTypeOptionsInternal, 500);
  const debouncedFetchPaymentTerm = useDebouncedCallback(fetchPaymentTermOptionsInternal, 500);
  const debouncedFetchPaymentType = useDebouncedCallback(fetchPaymentTypeOptionsInternal, 500);

  // Load initial data on mount
  useEffect(() => {
    fetchContractTypeOptionsInternal();
    fetchPaymentTermOptionsInternal();
    fetchPaymentTypeOptionsInternal();
  }, []);

  // Validation function for contract fields
  const validateContractField = (idx: number, field: keyof Contract) => {
    const contract = contracts[idx];
    const value = contract[field];

    switch (field) {
      case 'contractType':
        if (!value || value === '') {
          return 'Contract Type is required';
        }
        return '';
      
     
      
      case 'paymentTerm':
        if (!value || value === '') {
          return 'Payment Term is required';
        }
        return '';
      
      case 'paymentType':
        if (!value || value === '') {
          return 'Payment Type is required';
        }
        return '';
      
      // case 'startDate':
      //   if (!value || value === '') {
      //     return 'Start Date is required';
      //   }
      //   return '';
      
      // case 'endDate':
      //   if (!value || value === '') {
      //     return 'End Date is required';
      //   }
      //   // Check if end date is after start date
      //   if (contract.startDate && new Date(value) < new Date(contract.startDate)) {
      //     return 'End Date must be after Start Date';
      //   }
      //   return '';
      
      default:
        return '';
    }
  };

  // Get error for a contract field - only show errors after validation has been triggered
  const getContractFieldError = (idx: number, field: keyof Contract) => {
    if (!validationTriggered) {
      return ''; // Don't show errors until validation is triggered
    }
    const errorKey = `${idx}-${field}`;
    return localErrors[errorKey] || validateContractField(idx, field);
  };

  // Enhanced field change handler that clears errors for the field being updated
  const handleFieldChange = (
    idx: number,
    field: keyof Contract,
    value: any
  ) => {
    const updated = [...contracts];
    updated[idx][field] = value;
    setContracts(updated);
    onChange('contracts', updated);
    
    // Clear error for this field if it exists
    const errorKey = `${idx}-${field}`;
    if (localErrors[errorKey]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    
    // If changing start date, validate end date
    if (field === 'startDate' && updated[idx].endDate) {
      const endDateError = validateContractField(idx, 'endDate');
      const endDateErrorKey = `${idx}-endDate`;
      if (endDateError) {
        setLocalErrors(prev => ({
          ...prev,
          [endDateErrorKey]: endDateError
        }));
      } else if (localErrors[endDateErrorKey]) {
        setLocalErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[endDateErrorKey];
          return newErrors;
        });
      }
    }
  };

  const addContract = () => {
    setContracts([
      ...contracts,
      {
        contractType: '',
        taxPreference: '',
        paymentTerm: '',
        paymentType: '',
        startDate: '',
        endDate: '',
      },
    ]);
  };

  // Validate all contracts
  const validateContracts = () => {
    const newErrors: Record<string, string> = {};
    
    contracts.forEach((contract, idx) => {
      // Validate all required fields for this contract
      const fieldsToValidate: (keyof Contract)[] = [
        'contractType', 'taxPreference', 'paymentTerm', 'paymentType', 'startDate', 'endDate'
      ];
      
      fieldsToValidate.forEach(field => {
        const error = validateContractField(idx, field);
        if (error) {
          const errorKey = `${idx}-${field}`;
          newErrors[errorKey] = error;
        }
      });
    });

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = useCallback(() => {
    // Validate contracts before proceeding
    const isContractsValid = validateContracts();

    // If validation fails, trigger validation display and return false
    if (!isContractsValid) {
      setValidationTriggered(true);
      return false;
    }

    // All contracts are valid
    return true;
  }, [contracts]); // Recreate when contracts change

  const handlePrevious = useCallback(() => {
    // Reset validation state when going back
    setValidationTriggered(false);
    setLocalErrors({});
    return true;
  }, []);

  // Tab navigation logic for Next/Previous buttons (to match other tabs pattern)
  useEffect(() => {
    const tabNavigation = {
      handleNext,
      handlePrevious,
    };

    // Store navigation object in formData for FormWizardLayout to use
    onChange('_contractTabNavigation', tabNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleNext, handlePrevious]); // Only update when handlers change, onChange intentionally excluded to prevent infinite loop

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Text variant="h2" size="lg" weight="bold" className="text-gray-900">
          Contract Details
        </Text>
        <button
          type="button"
          className="border border-blue-500 text-blue-500 px-3 py-1 rounded"
          onClick={addContract}
        >
          + Add Contract
        </button>
      </div>
      {contracts.map((contract, idx) => (
        <div
          key={idx}
          className="bg-white rounded shadow p-6 mb-6 border border-gray-200"
        >
          <div className="mb-2 flex items-center justify-between">
            <Text
              variant="span"
              size="base"
              weight="semibold"
              className="text-gray-900"
            >
              Contract {idx + 1}
            </Text>
            {idx > 0 && (
              <button
                type="button"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                onClick={() => {
                  const updated = contracts.filter((_, i) => i !== idx);
                  setContracts(updated);
                  onChange('contracts', updated);
                }}
                aria-label="Remove contract"
              >
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <SearchDropdown
                label="Contract Type"
                value={contract.contractType}
                onChange={(value) => {
                  const contractTypeValue = Array.isArray(value) ? value[0]?.value || '' : value?.value || '';
                  handleFieldChange(idx, 'contractType', contractTypeValue);
                }}
                options={contractTypeOptions}
                placeholder={loadingContractType ? "Loading contract types..." : "Select Contract Type"}
                required
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    debouncedFetchContractType(input);
                  }
                }}
                error={getContractFieldError(idx, 'contractType')}
              />
            </div>
            
            <div>
              <SearchDropdown
                label="Payment Term"
                value={contract.paymentTerm}
                onChange={(value) => {
                  const paymentTermValue = Array.isArray(value) ? value[0]?.value || '' : value?.value || '';
                  handleFieldChange(idx, 'paymentTerm', paymentTermValue);
                }}
                options={paymentTermOptions}
                placeholder={loadingPaymentTerm ? "Loading payment terms..." : "Select Payment Term"}
                required
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    debouncedFetchPaymentTerm(input);
                  }
                }}
                error={getContractFieldError(idx, 'paymentTerm')}
              />
            </div>
            <div>
              <SearchDropdown
                label="Payment Type"
                value={contract.paymentType}
                onChange={(value) => {
                  const paymentTypeValue = Array.isArray(value) ? value[0]?.value || '' : value?.value || '';
                  handleFieldChange(idx, 'paymentType', paymentTypeValue);
                }}
                options={paymentTypeOptions}
                placeholder={loadingPaymentType ? "Loading payment types..." : "Select Payment Type"}
                required
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    debouncedFetchPaymentType(input);
                  }
                }}
                error={getContractFieldError(idx, 'paymentType')}
              />
            </div>
            {/* <div>
              <EnhancedInputField
                label="Start Date"
                value={contract.startDate}
                onChange={value =>
                  handleFieldChange(idx, 'startDate', value)
                }
                max={new Date().toISOString().split('T')[0]}
                type="date"
                required
                gridCols=""
              />
              {getContractFieldError(idx, 'startDate') && (
                <span className="text-red-500 text-sm">
                  {getContractFieldError(idx, 'startDate')}
                </span>
              )}
            </div> */}
            {/* <div>
              <EnhancedInputField
                label="End Date"
                value={contract.endDate}
                onChange={value => handleFieldChange(idx, 'endDate', value)}
                type="date"
                min={contract.startDate}
                required
                gridCols=""
              />
              {getContractFieldError(idx, 'endDate') && (
                <span className="text-red-500 text-sm">
                  {getContractFieldError(idx, 'endDate')}
                </span>
              )}
            </div> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContractStep;