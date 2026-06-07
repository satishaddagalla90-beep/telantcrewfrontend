import React, { useEffect, useState, useRef, useCallback } from 'react';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import SelectField from '../../molecules/SelectField/SelectField';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import Text from '../../atoms/Text/Text';
import Tabs, { TabItem } from '../../atoms/Tabs/Tabs'; // Assuming you have this component
// import CheckboxField from '../../molecules/CommonFormFields/CommonFormFields'; // Assuming a checkbox component
import Checkbox from '../../atoms/Checkbox/Checkbox'; // Adjust the path as needed to your Checkbox component
import CountryStateCity from '../../molecules/CountryStateCity/CountryStateCity';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import AvatarUpload from '../../molecules/AvatarUpload/AvatarUpload';
import { useClientFieldValidation } from '../../../hooks/useClientFieldValidation';
import FileUploadService from '../../../services/fileUploadService';

// --- Options (can be moved to a constants file) ---
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'newlead', label: 'New Lead' },
  { value: 'qualified-lead', label: 'Qualified Lead' },
];
const currencyOptions = [
  { value: 'INR', label: 'INR' },
  { value: 'USD', label: 'USD' },
];
// MSP Addition options will be fetched dynamically
const indianStates = State.getStatesOfCountry('IN').map(s => ({
  value: s.isoCode,
  label: s.name,
}));

// --- Validation Helpers ---
function isAlpha(str: string) {
  return /^[A-Za-z ]+$/.test(str);
}
function isPostalCode(str: string) {
  return /^\d{4,10}$/.test(str);
}
function isURL(str: string) {
  return (
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/\S*)?$/.test(str) ||
    /^www\.[\w\-]+\.[a-z]{2,}(\/\S*)?$/.test(str)
  );
}
function isPAN(str: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(str);
}

// Helper function to convert text to title case (first letter of each word capitalized)
const toTitleCase = (value: string) => {
  return value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

const BusinessStep = ({
  formData,
  onChange,
  errors,
  touched,
  onFileUpload,
  uploadStates,
}: any) => {
  const [activeTab, setActiveTab] = useState('core-info');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);
  const [ownershipOptions, setOwnershipOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingOwnership, setLoadingOwnership] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingIndustry, setLoadingIndustry] = useState(false);
  const [odcOptions, setOdcOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingOdc, setLoadingOdc] = useState(false);
  const [documentTypeOptions, setDocumentTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingDocumentType, setLoadingDocumentType] = useState(false);
  const [gstTreatmentOptions, setGstTreatmentOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingGstTreatment, setLoadingGstTreatment] = useState(false);
  const [placeOfSupplyOptions, setPlaceOfSupplyOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingPlaceOfSupply, setLoadingPlaceOfSupply] = useState(false);
  const [mspOptions, setMspOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingMspOptions, setLoadingMspOptions] = useState(false);
  const [mspAdditionOptions, setMspAdditionOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingMspAdditionOptions, setLoadingMspAdditionOptions] =
    useState(false);

  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    console.log('MSP Addition options updated:', mspAdditionOptions);
  }, [mspAdditionOptions]);

  // Effect to fetch presigned URL for the logo preview if it's a raw URL
  useEffect(() => {
    const fetchLogoPreview = async () => {
      if (formData.logoUrl && (!formData.logoPreview || formData.logoPreview === formData.logoUrl)) {
        try {
          const url = await FileUploadService.getFileViewUrl(formData.logoUrl);
          onChange('logoPreview', url);
        } catch (error) {
          console.error('Error fetching logo preview URL:', error);
        }
      }
    };
    fetchLogoPreview();
  }, [formData.logoUrl]);

  // Fetch MSP options from API with optional search (internal function)
  const fetchMspOptionsInternal = async (searchTerm: string = '') => {
    setLoadingMspOptions(true);
    try {
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('MSP')
      );
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }
      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);
      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setMspOptions(options);
      }
    } catch (error) {
      console.error('Error fetching MSP options:', error);
      setMspOptions([]);
    } finally {
      setLoadingMspOptions(false);
    }
  };

  // Fetch MSP Addition options from API with optional search (internal function)
  const fetchMspAdditionOptionsInternal = async (searchTerm: string = '') => {
    setLoadingMspAdditionOptions(true);
    try {
      const url = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.LIST);
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      // Add filter for MSP clients when Client Type is "ThroughMSP"
      if (formData.msp === 'ThroughMSP') {
        url.searchParams.append('msp_type', 'IsMSP');
      }

      console.log(
        'Fetching MSP Addition options with URL:',
        url.pathname + url.search
      );
      const response = await apiCall<{ Client: Array<any> }>(
        url.pathname + url.search
      );
      console.log('MSP Addition API response:', response);

      if (response.data && response.data.Client) {
        const options = response.data.Client.map((client: any) => ({
          value: client.client_name,
          label: client.client_name,
        }));
        console.log('MSP Addition options:', options);
        console.log('Current MSP Addition value:', formData.mspAddition);
        setMspAdditionOptions(options);

        // Log search results for debugging
        if (searchTerm) {
          console.log(
            `Search for "${searchTerm}" returned ${response.data.Client.length} results`
          );
        }
      } else {
        console.log('No clients found in response');
        setMspAdditionOptions([]);
      }
    } catch (error) {
      console.error('Error fetching MSP Addition options:', error);
      setMspAdditionOptions([]);
    } finally {
      setLoadingMspAdditionOptions(false);
    }
  };

  // Fetch ownership options from API with optional search (internal function)
  const fetchOwnershipOptionsInternal = async (searchTerm: string = '') => {
    setLoadingOwnership(true);
    try {
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Users')
      );
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (user: { id: string; name: string }) => ({
            value: user.name,
            label: user.name,
          })
        );
        setOwnershipOptions(options);
      }
    } catch (error) {
      console.error('Error fetching ownership options:', error);
      setOwnershipOptions([]);
    } finally {
      setLoadingOwnership(false);
    }
  };

  // Fetch industry options from API with optional search (internal function)
  const fetchIndustryOptionsInternal = async (searchTerm: string = '') => {
    setLoadingIndustry(true);
    try {
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Industry')
      );
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (industry: { id: string; name: string }) => ({
            value: industry.name,
            label: industry.name,
          })
        );
        setIndustryOptions(options);
      }
    } catch (error) {
      console.error('Error fetching industry options:', error);
      setIndustryOptions([]);
    } finally {
      setLoadingIndustry(false);
    }
  };

  // Fetch ODC location options from API with optional search (internal function)
  // Fetch ODC location options from external countries API and filter client-side
  // ODC dropdown: fetch countries with cities, flatten cities, filter by search term
  const [allOdcCities, setAllOdcCities] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const fetchAllOdcCities = async () => {
    setLoadingOdc(true);
    try {
      const response = await fetch(
        'https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries'
      );
      const data = await response.json();
      if (data && data.data) {
        // Flatten all cities from all countries
        const allCities = data.data.flatMap(
          (country: { country: string; cities: string[] }) =>
            country.cities.map(city => ({
              value: city,
              label: city,
            }))
        );

        // Remove duplicates by creating a Map with city names as keys
        const uniqueCitiesMap = new Map<string, { value: string; label: string }>();
        allCities.forEach((city: { value: string; label: string }) => {
          // Use lowercase city name as key to ensure case-insensitive deduplication
          const key = city.label.toLowerCase();
          // Only set if not already present (preserves first occurrence)
          if (!uniqueCitiesMap.has(key)) {
            uniqueCitiesMap.set(key, city);
          }
        });

        // Convert Map values back to array
        const uniqueCities = Array.from(uniqueCitiesMap.values());

        setAllOdcCities(uniqueCities);
        setOdcOptions(uniqueCities.slice(0, 50)); // Default: top 50
      } else {
        setAllOdcCities([]);
        setOdcOptions([]);
      }
    } catch (error) {
      console.error('Error fetching ODC cities:', error);
      setAllOdcCities([]);
      setOdcOptions([]);
    } finally {
      setLoadingOdc(false);
    }
  };

  // Debounced search for ODC countries
  const [odcSearchTerm, setOdcSearchTerm] = useState('');
  const debouncedSetOdcSearchTerm = useDebouncedCallback(
    (searchTerm: string) => {
      setOdcSearchTerm(searchTerm);
    },
    400
  );

  useEffect(() => {
    if (!allOdcCities.length) return;
    setLoadingOdc(true);
    let filtered = allOdcCities;
    if (odcSearchTerm && odcSearchTerm.trim()) {
      const lower = odcSearchTerm.trim().toLowerCase();
      filtered = allOdcCities.filter(opt =>
        opt.label.toLowerCase().includes(lower)
      );
    }
    setOdcOptions(filtered.slice(0, 50)); // Limit to top 50
    setLoadingOdc(false);
  }, [odcSearchTerm, allOdcCities]);

  // Fetch document type options from API with optional search (internal function)
  const fetchDocumentTypeOptionsInternal = async (searchTerm: string = '') => {
    setLoadingDocumentType(true);
    try {
      const url = new URL(
        window.location.origin +
        API_ENDPOINTS.CLIENTS.DROPDOWNS('Document_type')
      );
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (doc: { id: string; name: string }) => ({
            value: doc.name,
            label: doc.name,
          })
        );
        setDocumentTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching document type options:', error);
      setDocumentTypeOptions([]);
    } finally {
      setLoadingDocumentType(false);
    }
  };

  // Fetch GST Treatment options from API with optional search (internal function)
  const fetchGstTreatmentOptionsInternal = async (searchTerm: string = '') => {
    setLoadingGstTreatment(true);
    try {
      const url = new URL(
        window.location.origin +
        API_ENDPOINTS.CLIENTS.DROPDOWNS('GST_Treatment')
      );
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setGstTreatmentOptions(options);
      }
    } catch (error) {
      console.error('Error fetching GST Treatment options:', error);
      setGstTreatmentOptions([]);
    } finally {
      setLoadingGstTreatment(false);
    }
  };

  // Fetch Place of Supply options from API with optional search (internal function)
  const fetchPlaceOfSupplyOptionsInternal = async (searchTerm: string = '') => {
    setLoadingPlaceOfSupply(true);
    try {
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Locations')
      );
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        // Create a Set to store unique states
        const uniqueStates = new Set<string>();

        response.data.data.forEach((location: { id: string; name: string }) => {
          // Extract state name from format "India/State/City"
          const parts = location.name.split('/');
          if (parts.length >= 2) {
            const stateName = parts[1].trim(); // Get the middle part (state)
            uniqueStates.add(stateName);
          }
        });

        // Convert Set to array of options
        const options = Array.from(uniqueStates).map(state => ({
          value: state,
          label: state,
        }));

        // Sort alphabetically for better UX
        options.sort((a, b) => a.label.localeCompare(b.label));

        setPlaceOfSupplyOptions(options);
      }
    } catch (error) {
      console.error('Error fetching Place of Supply options:', error);
      setPlaceOfSupplyOptions([]);
    } finally {
      setLoadingPlaceOfSupply(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    onChange('logo', file);
    if (file) {
      onChange('logoPreview', URL.createObjectURL(file));
    } else {
      onChange('logoPreview', '');
    }
    if (onFileUpload?.logo) {
      onFileUpload.logo(file, onChange);
    }
    // Clear logoUrl error when file is selected
    if (file && localErrors.logoUrl) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.logoUrl;
        return newErrors;
      });
    }
  };

  // Debounced search functions
  const debouncedFetchOwnership = useDebouncedCallback(
    fetchOwnershipOptionsInternal,
    500
  );
  const debouncedFetchIndustry = useDebouncedCallback(
    fetchIndustryOptionsInternal,
    500
  );
  // debouncedFetchOdc is now defined above with countries API logic
  const debouncedFetchDocumentType = useDebouncedCallback(
    fetchDocumentTypeOptionsInternal,
    500
  );
  const debouncedFetchGstTreatment = useDebouncedCallback(
    fetchGstTreatmentOptionsInternal,
    500
  );
  const debouncedFetchPlaceOfSupply = useDebouncedCallback(
    fetchPlaceOfSupplyOptionsInternal,
    500
  );
  const debouncedFetchMsp = useDebouncedCallback(fetchMspOptionsInternal, 500);
  const debouncedFetchMspAddition = useDebouncedCallback(
    (searchTerm: string) => {
      console.log('Debounced fetch MSP Addition called with:', searchTerm);
      return fetchMspAdditionOptionsInternal(searchTerm);
    },
    500
  );

  // Use hook for PAN validation
  const {
    isValidating: panValidating,
    error: panError,
    isValid: panIsValid,
    handleChange: handlePanChange
  } = useClientFieldValidation({
    value: formData.pan || '',
    type: 'pan',
    onChange: (value: string) => handleFieldChange('pan', value),
    onValidationChange: (isValid, error) => {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        if (!isValid && error) {
          newErrors.pan = error;
        } else {
          delete newErrors.pan;
        }
        return newErrors;
      });
    },
    excludeId: formData.id // Exclude current client ID if editing
  });



  // Load initial data on mount
  useEffect(() => {
    console.log('Loading initial dropdown data...');
    fetchOwnershipOptionsInternal();
    fetchIndustryOptionsInternal();
    fetchAllOdcCities();
    fetchDocumentTypeOptionsInternal();
    fetchGstTreatmentOptionsInternal();
    fetchPlaceOfSupplyOptionsInternal();
    fetchMspOptionsInternal();
    fetchMspAdditionOptionsInternal();
  }, []);

  // Refresh MSP Addition options when MSP type changes
  useEffect(() => {
    if (formData.msp === 'ThroughMSP') {
      fetchMspAdditionOptionsInternal();
    } else {
      // Clear options when not ThroughMSP
      setMspAdditionOptions([]);
    }
  }, [formData.msp]);

  // Handle "Same as Billing" checkbox
  const handleSameAsBillingChange = (checked: boolean) => {
    onChange('sameAsBilling', checked);
    if (checked) {
      // Copy billing address fields to shipping address fields
      onChange('shippingAttention', formData.billingAttention);
      onChange('shippingCountry', formData.billingCountry);
      onChange('shippingState', formData.billingState);
      onChange('shippingCity', formData.billingCity);
      onChange('shippingStreet1', formData.billingStreet1);
      onChange('shippingStreet2', formData.billingStreet2);
      onChange('shippingPinCode', formData.billingPinCode);
      onChange('shippingPhone', formData.billingPhone);
    } else {
      // Reset all shipping address fields when unchecked
      onChange('shippingAttention', '');
      onChange('shippingCountry', '');
      onChange('shippingState', '');
      onChange('shippingCity', '');
      onChange('shippingStreet1', '');
      onChange('shippingStreet2', '');
      onChange('shippingPinCode', '');
      onChange('shippingPhone', '');
    }
  };

  // Define tabs
  const tabs: TabItem[] = [
    { id: 'core-info', label: 'Client Information' },
    { id: 'billing-shipping', label: 'Billing & Shipping Address' },
  ];

  const handleNext = useCallback(() => {
    const isCurrentTabValid = validateCurrentTab();

    // If validation fails, trigger validation display and return false
    if (!isCurrentTabValid) {
      setValidationTriggered(true);
      return false;
    }

    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    const isLastTab = currentTabIndex === tabs.length - 1;

    if (isLastTab) {
      // Last tab: proceed to next main step
      return true;
    } else {
      // Not last tab: navigate to next sub-tab
      const nextTab = tabs[currentTabIndex + 1];
      setActiveTab(nextTab.id);
      // Reset validation state when moving to a new tab
      setValidationTriggered(false);
      setLocalErrors({});
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false; // Don't proceed to next main step yet
    }
  }, [activeTab, panError]);

  const handlePrevious = useCallback(() => {
    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    const isFirstTab = currentTabIndex === 0;

    if (isFirstTab) {
      // First tab: proceed to previous main step
      return true;
    } else {
      // Not first tab: navigate to previous sub-tab
      const previousTab = tabs[currentTabIndex - 1];
      setActiveTab(previousTab.id);
      // Reset validation state when moving to a new tab
      setValidationTriggered(false);
      setLocalErrors({});
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false; // Don't proceed to previous main step yet
    }
  }, [activeTab]);

  useEffect(() => {
    const tabNavigation = {
      handleNext,
      handlePrevious,
      activeTab,
      isFirstSubTab: activeTab === 'core-info',
    };

    // Store navigation object in formData for FormWizardLayout to use
    onChange('_businessTabNavigation', tabNavigation);
  }, [handleNext, handlePrevious]); // Only update when handlers change, onChange intentionally excluded to prevent infinite loop

  // Options for country/state/city dropdowns
  const countryOptions = Country.getAllCountries().map(c => ({
    value: c.isoCode,
    label: c.name,
  }));
  const stateOptions = (countryCode: string) =>
    countryCode
      ? State.getStatesOfCountry(countryCode).map(s => ({
        value: s.isoCode,
        label: s.name,
      }))
      : [];
  const cityOptions = (countryCode: string, stateCode: string) =>
    countryCode && stateCode
      ? City.getCitiesOfState(countryCode, stateCode).map(c => ({
        value: c.name,
        label: c.name,
      }))
      : [];

  // Get error for a field - only show errors after validation has been triggered
  const getFieldError = (fieldName: string) => {
    // Skip validation for shipping fields when "Same as Billing Address" is checked
    if (formData.sameAsBilling && fieldName.startsWith('shipping')) {
      return '';
    }

    if (!validationTriggered) {
      return ''; // Don't show errors until validation is triggered
    }
    return (
      localErrors[fieldName] || validateField(fieldName, formData[fieldName])
    );
  };

  // Validate all fields in the current tab
  const validateCurrentTab = () => {
    const newErrors: Record<string, string> = {};

    // Define fields for each tab
    const tabFields: Record<string, string[]> = {
      'core-info': [
        'clientId', // Add clientId to the validation fields
        'clientName',
        'logoUrl',
        'website',
        'empanelmentStatus',
        'requiredDocs',
        'odc',
        'registeredAddress',
        'ownership',
        'msp',
        'mspAddition',
        'industry',
        'currentCountry',
        'currentState',
        'currentCity',
        'clientPostalCode',
        'pan',
      ],
      'billing-shipping': [
        // TODO: Uncomment these fields when validation is needed in future
        // 'billingAttention',
        // 'billingCountry',
        // 'billingState',
        // 'billingCity',
        // 'billingStreet1',
        // 'billingStreet2',
        // 'billingPinCode',
        // 'billingPhone',
        // 'shippingAttention',
        // 'shippingCountry',
        // 'shippingState',
        // 'shippingCity',
        // 'shippingStreet1',
        // 'shippingStreet2',
        // 'shippingPinCode',
        // 'shippingPhone',
        // 'gstTreatment',
        // 'placeOfSupply',
      ],
    };

    const fieldsToValidate = tabFields[activeTab] || [];

    fieldsToValidate.forEach(field => {
      const fieldValue = formDataRef.current[field];

      // Skip mspAddition validation when MSP type is not 'ThroughMSP'
      // This guards against async parent state updates where mspAddition
      // may not yet be cleared after switching away from ThroughMSP
      if (field === 'mspAddition' && formDataRef.current.msp !== 'ThroughMSP') {
        return;
      }

      const error = validateField(field, fieldValue);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (!newErrors.pan && panError) {
      newErrors.pan = panError;
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation function for mandatory fields
  const validateField = (fieldName: string, value: any) => {
    switch (fieldName) {
      case 'clientName':
        if (!value || value.trim() === '') {
          return 'Client Name is required';
        }
        if (!isAlpha(value)) {
          return 'Client Name must contain only letters';
        }
        return '';

      case 'logoUrl':
        // Make Client Logo optional - removed validation
        return '';

      case 'msp':
        if (!value || value === '') {
          return 'Client Type is required';
        }
        return '';

      case 'mspAddition': {
        // Only required when MSP is 'ThroughMSP'
        // Use formDataRef.current.msp to avoid stale closure issues in validateCurrentTab
        const currentMsp = formDataRef.current?.msp ?? formData.msp;
        if (currentMsp === 'ThroughMSP' && (!value || value === '')) {
          return 'MSP Associated With is required';
        }
        return '';
      }

      case 'ownership': {
        // Ownership is optional when client type is IsMSP
        const currentMspForOwnership = formDataRef.current?.msp ?? formData.msp;
        if (currentMspForOwnership === 'IsMSP') {
          return '';
        }
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return 'Ownership is required';
        }
        return '';
      }

      case 'odc':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return 'ODC is required';
        }
        return '';

      case 'registeredAddress':
        if (!value || value.trim() === '') {
          return 'Registered Address is required';
        }
        return '';

      case 'website':
        if (!value || value.trim() === '') {
          return 'Website is required';
        }
        if (!isURL(value)) {
          return 'Please enter a valid URL';
        }
        return '';

      case 'requiredDocs':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return 'Required Documents is required';
        }
        return '';

      case 'empanelmentStatus':
        if (!value || value === '') {
          return 'Empanelment Status is required';
        }
        return '';

      case 'industry':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return 'Industry is required';
        }
        return '';

      // TODO: Uncomment billing and shipping validations when needed in future
      case 'billingAttention':
        // if (!value || value.trim() === '') {
        //   return 'Attention is required';
        // }
        return '';

      case 'billingCountry':
        // if (!value || value === '') {
        //   return 'Country is required';
        // }
        return '';

      case 'billingState':
        // if (!value || value === '') {
        //   return 'State is required';
        // }
        return '';

      case 'billingCity':
        // if (!value || value === '') {
        //   return 'City is required';
        // }
        return '';

      case 'billingStreet1':
        // if (!value || value.trim() === '') {
        //   return 'Street 1 is required';
        // }
        return '';

      case 'billingStreet2':
        // Street 2 is optional, so no validation required
        return '';

      case 'billingPinCode':
        // if (!value || value.trim() === '') {
        //   return 'Pin Code is required';
        // }
        // if (value.length !== 6) {
        //   return 'Pin Code must be exactly 6 digits';
        // }
        // if (!/^\d+$/.test(value)) {
        //   return 'Pin Code must contain only numbers';
        // }
        return '';

      case 'billingPhone':
        // if (!value || value.trim() === '') {
        //   return 'Phone is required';
        // }
        // if (value.length !== 10) {
        //   return 'Phone number must be exactly 10 digits';
        // }
        // if (!/^\d+$/.test(value)) {
        //   return 'Phone number must contain only numbers';
        // }
        return '';

      case 'shippingAttention':
        // if (!value || value.trim() === '') {
        //   return 'Attention is required';
        // }
        return '';

      case 'shippingCountry':
        // if (!value || value === '') {
        //   return 'Country is required';
        // }
        return '';

      case 'shippingState':
        // if (!value || value === '') {
        //   return 'State is required';
        // }
        return '';

      case 'shippingCity':
        // if (!value || value === '') {
        //   return 'City is required';
        // }
        return '';

      case 'shippingStreet1':
        // if (!value || value.trim() === '') {
        //   return 'Street 1 is required';
        // }
        return '';

      case 'shippingStreet2':
        // Street 2 is optional, so no validation required
        return '';

      case 'shippingPinCode':
        // if (!value || value.trim() === '') {
        //   return 'Pin Code is required';
        // }
        // if (value.length !== 6) {
        //   return 'Pin Code must be exactly 6 digits';
        // }
        // if (!/^\d+$/.test(value)) {
        //   return 'Pin Code must contain only numbers';
        // }
        return '';

      case 'shippingPhone':
        // if (!value || value.trim() === '') {
        //   return 'Phone is required';
        // }
        // if (value.length !== 10) {
        //   return 'Phone number must be exactly 10 digits';
        // }
        // if (!/^\d+$/.test(value)) {
        //   return 'Phone number must contain only numbers';
        // }
        return '';

      case 'gstTreatment':
        // if (!value || value === '') {
        //   return 'GST Treatment is required';
        // }
        return '';

      case 'placeOfSupply':
        // if (!value || value === '') {
        //   return 'Place of Supply is required';
        // }
        return '';

      case 'pan':
        if (!value || value.trim() === '') {
          return 'PAN is required';
        }
        if (!isPAN(value)) {
          return 'Invalid PAN format';
        }
        if (panError) {
          return panError;
        }
        return '';

      case 'exemptionReason':
        // Skip validation for exemptionReason as per user request
        return '';

      case 'currentCity':
        if (!value || value === '') {
          return 'City is required';
        }
        return '';

      case 'currentCountry':
        if (!value || value === '') {
          return 'Country is required';
        }
        return '';

      case 'currentState':
        if (!value || value === '') {
          return 'State is required';
        }
        return '';

      case 'clientPostalCode':
        if (!value || value.trim() === '') {
          return 'Postal Code is required';
        }
        if (value.length !== 6) {
          return 'Postal Code must be exactly 6 digits';
        }
        if (!/^\d+$/.test(value)) {
          return 'Postal Code must contain only numbers';
        }
        return '';

      case 'billingAttention':
        if (!value || value.trim() === '') {
          return 'Attention is required';
        }
        return '';

      case 'clientId':
        if (!value || value.trim() === '') {
          return 'Client ID is required';
        }
        // Add any additional validation rules for clientId here if needed
        return '';

      default:
        return '';
    }
  };

  // Enhanced onChange handler that clears errors for the field being updated
  const handleFieldChange = (fieldName: string, value: any) => {
    // Update the form data
    onChange(fieldName, value);

    // Special handling for MSP field - reset mspAddition when not 'ThroughMSP'
    if (fieldName === 'msp' && value !== 'ThroughMSP') {
      onChange('mspAddition', '');
    }

    // Special handling for MSP field - reset ownership when 'IsMSP'
    if (fieldName === 'msp' && value === 'IsMSP') {
      onChange('ownership', []);
    }

    // Clear error for this field if it exists
    if (localErrors[fieldName]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Special handling - clear ownership error when MSP changes to 'IsMSP'
    if (fieldName === 'msp' && value === 'IsMSP' && localErrors.ownership) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ownership;
        return newErrors;
      });
    }

    // Special handling - clear mspAddition error when MSP changes (e.g. to 'MSP' or empty)
    if (fieldName === 'msp' && localErrors.mspAddition) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.mspAddition;
        return newErrors;
      });
    }
  };

  return (
    <div className="p-8 bg-white rounded shadow text-left space-y-6">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={tabId => {
          setActiveTab(tabId);
          // Reset validation state when manually switching tabs
          setValidationTriggered(false);
          setLocalErrors({});
        }}
      />

      {/* --- Tab 1: Client Information --- */}
      {activeTab === 'core-info' && (
        <div className="grid grid-cols-4 gap-6">
          {/* Client ID with Generate Button - Modified to simple input */}
          <div>
            <div>
              <Text
                variant="label"
                size="sm"
                weight="medium"
                className="text-gray-700 mb-1 block"
              >
                Client ID <span className="text-red-500 mr-1">*</span>
              </Text>
              <input
                type="text"
                value={formData.clientId || ''}
                onChange={e => handleFieldChange('clientId', e.target.value)}
                placeholder="Enter client ID"
                className={`w-full border rounded px-2 py-1 ${getFieldError('clientId') ? 'border-red-500' : ''}`}
              />
              {getFieldError('clientId') && (
                <span className="text-red-500 text-sm">
                  {getFieldError('clientId')}
                </span>
              )}

            </div>
          </div>
          {/* Client Name */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Client Name <span className="text-red-500 mr-1">*</span>
            </Text>
            <input
              type="text"
              value={formData.clientName || ''}
              onChange={e => handleFieldChange('clientName', toTitleCase(e.target.value))}
              className={`w-full border rounded px-2 py-1 ${getFieldError('clientName') ? 'border-red-500' : ''}`}
            />
            {getFieldError('clientName') && (
              <span className="text-red-500 text-sm">
                {getFieldError('clientName')}
              </span>
            )}
          </div>

          {/* Client Display Name */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Client Display Name
            </Text>
            <input
              type="text"
              value={formData.clientDisplayName || ''}
              onChange={e =>
                handleFieldChange(
                  'clientDisplayName',
                  toTitleCase(e.target.value)
                )
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>

            {/* Client Logo Upload */}
          <div>
            <AvatarUpload
              label="Client Logo"
              value={formData.logo}
              preview={formData.logoPreview}
              onChange={handleLogoChange}
              error={getFieldError('logoUrl')}
              accept=".jpg,.jpeg,.png,.gif"
              maxSize={5}
              size="lg"
              fallbackIcon="upload"
              showFileName={true}
              uploading={uploadStates?.logo?.uploading}
              uploadError={uploadStates?.logo?.error || undefined}
            />
          </div>
          
          {/* MSP */}
          <div>
            <SearchDropdown
              label="Client Type"
              value={formData.msp || ''}
              onChange={value => {
                const mspValue = Array.isArray(value)
                  ? value[0]?.value || ''
                  : value?.value || '';
                handleFieldChange('msp', mspValue);
              }}
              options={mspOptions}
              placeholder={loadingMspOptions ? 'Loading MSP...' : 'Select MSP'}
              isClearable
              required
              onInputChange={(input, action) => {
                if (action.action === 'input-change') {
                  debouncedFetchMsp(input);
                }
              }}
              loading={loadingMspOptions}
              error={getFieldError('msp')}
            />
          </div>
          {/* MSP Addition - Only enabled when MSP is "throughMSP" */}
          <div>
            <SearchDropdown
              label="MSP Associated With"
              value={formData.mspAddition || ''}
              onChange={value => {
                const mspAdditionValue = Array.isArray(value)
                  ? value[0]?.value || ''
                  : value?.value || '';
                handleFieldChange('mspAddition', mspAdditionValue);
              }}
              options={mspAdditionOptions}
              placeholder={
                loadingMspAdditionOptions
                  ? 'Loading MSP Addition...'
                  : 'Select MSP Addition'
              }
              isClearable
              disabled={formData.msp !== 'ThroughMSP'}
              onInputChange={(input, action) => {
                if (action.action === 'input-change') {
                  debouncedFetchMspAddition(input);
                }
              }}
              loading={loadingMspAdditionOptions}
              error={getFieldError('mspAddition')}
              required={formData.msp === 'ThroughMSP'}
            />
          </div>
          {/* Client Code */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Client Code
            </Text>
            <input
              type="text"
              value={formData.clientCode || ''}
              onChange={e => handleFieldChange('clientCode', e.target.value)}
              className="w-full border rounded px-2 py-1"

            />
          </div>
          {/* Ownership */}
          <div>
            <SearchDropdown
              label="Ownership"
              value={formData.ownership || []}
              required={formData.msp !== 'IsMSP'}
              onChange={value => {
                const ownershipValue = Array.isArray(value)
                  ? value.map(v => v.value)
                  : value?.value
                    ? [value.value]
                    : [];
                handleFieldChange('ownership', ownershipValue);
              }}
              options={ownershipOptions}
              placeholder={
                loadingOwnership ? 'Loading users...' : 'Select Ownership'
              }
              isMulti
              disabled={formData.msp === 'MSP'}
              onInputChange={(input, action) => {
                if (action.action === 'input-change') {
                  debouncedFetchOwnership(input);
                }
              }}
              error={formData.msp === 'MSP' ? '' : getFieldError('ownership')}
            />
          </div>
          {/* Website */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Website <span className="text-red-500 mr-1">*</span>
            </Text>
            <input
              type="text"
              value={formData.website || ''}
              onChange={e => handleFieldChange('website', e.target.value)}
              className={`w-full border rounded px-2 py-1 ${getFieldError('website') ? 'border-red-500' : ''}`}
            />
            {getFieldError('website') && (
              <span className="text-red-500 text-sm">
                {getFieldError('website')}
              </span>
            )}
          </div>
          {/* Industry */}
          <div>
            <SearchDropdown
              label="Industry"
              value={formData.industry || []}
              onChange={value => {
                const industryValue = Array.isArray(value)
                  ? value.map(v => v.value)
                  : value?.value
                    ? [value.value]
                    : [];
                handleFieldChange('industry', industryValue);
              }}
              options={industryOptions}
              placeholder={
                loadingIndustry ? 'Loading industries...' : 'Select Industry'
              }
              required
              isMulti
              onInputChange={(input, action) => {
                if (action.action === 'input-change') {
                  debouncedFetchIndustry(input);
                }
              }}
              error={getFieldError('industry')}
            />
          </div>
          {/* Empanelment Status */}
          <div>
            <SearchDropdown
              label="Empanelment Status"
              value={formData.empanelmentStatus || ''}
              onChange={value => {
                const statusValue = Array.isArray(value)
                  ? value[0]?.value || ''
                  : value?.value || '';
                handleFieldChange('empanelmentStatus', statusValue);
              }}
              required
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'New Lead', label: 'New Lead' },
              ]}
              error={getFieldError('empanelmentStatus')}
            />
          </div>

          {/* Required Documents */}
          <div>
            <SearchDropdown
              label="Required Documents"
              value={formData.requiredDocs || []}
              onChange={value => {
                const docsValue = Array.isArray(value)
                  ? value.map(v => v.value)
                  : value?.value
                    ? [value.value]
                    : [];
                handleFieldChange('requiredDocs', docsValue);
              }}
              required
              options={documentTypeOptions}
              placeholder={
                loadingDocumentType
                  ? 'Loading documents...'
                  : 'Select Required Documents'
              }
              isMulti
              onInputChange={(input, action) => {
                if (action.action === 'input-change') {
                  debouncedFetchDocumentType(input);
                }
              }}
              error={getFieldError('requiredDocs')}
            />
          </div>
          {/* Client Portal */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Client Portal
            </Text>
            <input
              type="text"
              value={formData.clientPortal || ''}
              onChange={e => handleFieldChange('clientPortal', e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {/* ODC */}
          <div className="col-span-2">
            <SearchDropdown
              label="ODC"
              value={formData.odc || []}
              required
              onChange={value => {
                const odcValue = Array.isArray(value)
                  ? value.map(v => v.value)
                  : value?.value
                    ? [value.value]
                    : [];
                handleFieldChange('odc', odcValue);
              }}
              options={odcOptions}
              placeholder={
                loadingOdc ? 'Loading countries...' : 'Select ODC Locations'
              }
              isMulti
              onInputChange={(input, action) => {
                if (action.action === 'input-change') {
                  debouncedSetOdcSearchTerm(input);
                }
              }}
              error={getFieldError('odc')}
            />
          </div>
          {/* PAN */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              PAN <span className="text-red-500">*</span>
            </Text>
            <input
              type="text"
              value={formData.pan || ''}
              onChange={e =>
                handlePanChange(e.target.value.toUpperCase())
              }
              className={`w-full border rounded px-2 py-1 ${getFieldError('pan') ? 'border-red-500' : ''}`}
              maxLength={10}
            />
            {panValidating && (
              <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full"></div>
                Checking availability...
              </div>
            )}
            {panIsValid && !panValidating && (
              <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <span>✓</span>
                PAN is Unique
              </div>
            )}
            {(panError || getFieldError('pan')) && (
              <span className="text-red-500 text-sm">
                {panError || getFieldError('pan')}
              </span>
            )}
          </div>
          {/* Currency */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Currency
            </Text>
            <SearchDropdown
              value={formData.currency || ''}
              onChange={value => {
                const currencyValue = Array.isArray(value)
                  ? value[0]?.value || ''
                  : value?.value || '';
                onChange('currency', currencyValue);
              }}
              options={currencyOptions}
              label={''}
            />
          </div>
          {/* Registered Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registered Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.registeredAddress || ''}
              onChange={e =>
                handleFieldChange(
                  'registeredAddress',
                  toTitleCase(e.target.value)
                )
              }
              placeholder="Enter registered address"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('registeredAddress')
                ? 'border-red-500'
                : 'border-gray-300'
                }`}
            />
            {getFieldError('registeredAddress') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('registeredAddress')}
              </p>
            )}
          </div>

          {/* Current Country */}
          <div>
            <CountryStateCity
              type="country"
              label="Current Country"
              value={formData.currentCountry || ''}
              onChange={value => handleFieldChange('currentCountry', value)}
              required
              error={getFieldError('currentCountry')}
            />
          </div>

          {/* Current State */}
          <div>
            <CountryStateCity
              type="state"
              label="Current State"
              value={formData.currentState || ''}
              onChange={value => handleFieldChange('currentState', value)}
              country={formData.currentCountry}
              disabled={!formData.currentCountry}
              required
              error={getFieldError('currentState')}
            />
          </div>

          {/* Current City */}
          <div>
            <CountryStateCity
              type="city"
              label="Current City"
              value={formData.currentCity || ''}
              onChange={value => handleFieldChange('currentCity', value)}
              country={formData.currentCountry}
              state={formData.currentState}
              disabled={!formData.currentCountry || !formData.currentState}
              placeholder="Select City"
              required
              error={getFieldError('currentCity')}
            />
          </div>

          {/* Postal Code */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              Postal Code <span className="text-red-500">*</span>
            </Text>
            <input
              type="text"
              value={formData.clientPostalCode || ''}
              onChange={e => {
                const value = e.target.value;
                // Only allow digits and max 6 characters
                if (/^\d{0,6}$/.test(value)) {
                  handleFieldChange('clientPostalCode', value);
                }
              }}
              className={`w-full border rounded px-2 py-1 ${getFieldError('clientPostalCode') ? 'border-red-500' : ''}`}
              placeholder="Enter 6 digit postal code"
              maxLength={6}
            />
            {getFieldError('clientPostalCode') && (
              <span className="text-red-500 text-sm">
                {getFieldError('clientPostalCode')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* --- Tab 2: Billing & Shipping Address --- */}
      {activeTab === 'billing-shipping' && (
        <div className="space-y-8">
          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
              Billing Address
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Attention
                </Text>
                <input
                  type="text"
                  value={formData.billingAttention || ''}
                  onChange={e =>
                    handleFieldChange(
                      'billingAttention',
                      toTitleCase(e.target.value)
                    )
                  }
                  className={`w-full border rounded px-2 py-1 ${getFieldError('billingAttention') ? 'border-red-500' : ''}`}
                />
                {getFieldError('billingAttention') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('billingAttention')}
                  </span>
                )}
              </div>
              <div>
                <CountryStateCity
                  type="country"
                  label="Country/Region"
                  value={formData.billingCountry || ''}
                  onChange={value => handleFieldChange('billingCountry', value)}
                  error={getFieldError('billingCountry')}

                />
              </div>
              <div>
                <CountryStateCity
                  type="state"
                  label="State"
                  value={formData.billingState || ''}
                  onChange={value => handleFieldChange('billingState', value)}
                  country={formData.billingCountry}
                  disabled={!formData.billingCountry}
                  error={getFieldError('billingState')}

                />
              </div>
              <div>
                <CountryStateCity
                  type="city"
                  label="City"
                  value={formData.billingCity || ''}
                  onChange={value => handleFieldChange('billingCity', value)}
                  country={formData.billingCountry}
                  state={formData.billingState}
                  disabled={!formData.billingCountry || !formData.billingState}
                  placeholder="Select City"
                  error={getFieldError('billingCity')}

                />
              </div>
              <div className="col-span-2">
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Street 1
                </Text>
                <input
                  type="text"
                  value={formData.billingStreet1 || ''}
                  onChange={e =>
                    handleFieldChange(
                      'billingStreet1',
                      toTitleCase(e.target.value)
                    )
                  }
                  className={`w-full border rounded px-2 py-1 ${getFieldError('billingStreet1') ? 'border-red-500' : ''}`}
                />
                {getFieldError('billingStreet1') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('billingStreet1')}
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Street 2
                </Text>
                <input
                  type="text"
                  value={formData.billingStreet2 || ''}
                  onChange={e =>
                    handleFieldChange(
                      'billingStreet2',
                      toTitleCase(e.target.value)
                    )
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Pin Code
                </Text>
                <input
                  type="text"
                  value={formData.billingPinCode || ''}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow digits and max 6 characters
                    if (/^\d{0,6}$/.test(value)) {
                      handleFieldChange('billingPinCode', value);
                    }
                  }}
                  className={`w-full border rounded px-2 py-1 ${getFieldError('billingPinCode') ? 'border-red-500' : ''}`}
                  placeholder="Enter 6 digit pin code"
                  maxLength={6}
                />
                {getFieldError('billingPinCode') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('billingPinCode')}
                  </span>
                )}
              </div>
              <div>
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Phone
                </Text>
                <input
                  type="tel"
                  value={formData.billingPhone || ''}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow digits and exactly 10 digits
                    if (/^\d{0,10}$/.test(value)) {
                      handleFieldChange('billingPhone', value);
                    }
                  }}
                  className={`w-full border rounded px-2 py-1 ${getFieldError('billingPhone') ? 'border-red-500' : ''}`}
                  placeholder="Enter 10 digit phone number"
                  maxLength={10}
                />
                {getFieldError('billingPhone') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('billingPhone')}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Shipping Address */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <Text
                variant="h3"
                size="lg"
                weight="semibold"
                className="text-gray-900"
              >
                Shipping Address
              </Text>
              <Checkbox
                label="Same as Billing Address"
                checked={formData.sameAsBilling || false}
                onChange={handleSameAsBillingChange}
              />
            </div>
            <div className="grid grid-cols-4 gap-6">
              {/* Fields are identical to billing but with 'shipping' prefix and are disabled if checkbox is checked */}
              <div>
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Attention
                </Text>
                <input
                  type="text"
                  value={formData.shippingAttention || ''}
                  onChange={e =>
                    handleFieldChange(
                      'shippingAttention',
                      toTitleCase(e.target.value)
                    )
                  }
                  className={`w-full border rounded px-2 py-1 ${getFieldError('shippingAttention') ? 'border-red-500' : ''}`}
                  disabled={formData.sameAsBilling}
                />
                {getFieldError('shippingAttention') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('shippingAttention')}
                  </span>
                )}
              </div>
              <div>
                <CountryStateCity
                  type="country"
                  label="Country/Region"
                  value={formData.shippingCountry || ''}
                  onChange={value =>
                    handleFieldChange('shippingCountry', value)
                  }
                  error={getFieldError('shippingCountry')}

                  disabled={formData.sameAsBilling}
                />
              </div>
              <div>
                <CountryStateCity
                  type="state"
                  label="State"
                  value={formData.shippingState || ''}
                  onChange={value => handleFieldChange('shippingState', value)}
                  country={formData.shippingCountry}
                  disabled={formData.sameAsBilling || !formData.shippingCountry}
                  error={getFieldError('shippingState')}

                />
              </div>
              <div>
                <CountryStateCity
                  type="city"
                  label="City"
                  value={formData.shippingCity || ''}
                  onChange={value => handleFieldChange('shippingCity', value)}
                  country={formData.shippingCountry}
                  state={formData.shippingState}
                  disabled={
                    formData.sameAsBilling ||
                    !formData.shippingCountry ||
                    !formData.shippingState
                  }
                  placeholder="Select City"
                  error={getFieldError('shippingCity')}

                />
              </div>
              <div className="col-span-2">
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Street 1
                </Text>
                <input
                  type="text"
                  value={formData.shippingStreet1 || ''}
                  onChange={e =>
                    handleFieldChange(
                      'shippingStreet1',
                      toTitleCase(e.target.value)
                    )
                  }
                  className={`w-full border rounded px-2 py-1 ${getFieldError('shippingStreet1') ? 'border-red-500' : ''}`}
                  disabled={formData.sameAsBilling}
                />
                {getFieldError('shippingStreet1') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('shippingStreet1')}
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Street 2
                </Text>
                <input
                  type="text"
                  value={formData.shippingStreet2 || ''}
                  onChange={e =>
                    handleFieldChange(
                      'shippingStreet2',
                      toTitleCase(e.target.value)
                    )
                  }
                  className="w-full border rounded px-2 py-1"
                  disabled={formData.sameAsBilling}
                />
              </div>
              <div>
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Pin Code
                </Text>
                <input
                  type="text"
                  value={formData.shippingPinCode || ''}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow digits and max 6 characters
                    if (/^\d{0,6}$/.test(value)) {
                      handleFieldChange('shippingPinCode', value);
                    }
                  }}
                  className={`w-full border rounded px-2 py-1 ${getFieldError('shippingPinCode') ? 'border-red-500' : ''}`}
                  disabled={formData.sameAsBilling}
                  placeholder="Enter 6 digit pin code"
                  maxLength={6}
                />
                {getFieldError('shippingPinCode') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('shippingPinCode')}
                  </span>
                )}
              </div>
              <div>
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Phone
                </Text>
                <input
                  type="tel"
                  value={formData.shippingPhone || ''}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow digits and exactly 10 digits
                    if (/^\d{0,10}$/.test(value)) {
                      handleFieldChange('shippingPhone', value);
                    }
                  }}
                  className={`w-full border rounded px-2 py-1 ${getFieldError('shippingPhone') ? 'border-red-500' : ''}`}
                  disabled={formData.sameAsBilling}
                  placeholder="Enter 10 digit phone number"
                  maxLength={10}
                />
                {getFieldError('shippingPhone') && (
                  <span className="text-red-500 text-sm">
                    {getFieldError('shippingPhone')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tax Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
              Tax Details
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <SearchDropdown
                  label="GST Treatment"
                  value={formData.gstTreatment || ''}
                  onChange={value => {
                    const gstValue = Array.isArray(value)
                      ? value[0]?.value || ''
                      : value?.value || '';
                    handleFieldChange('gstTreatment', gstValue);
                  }}
                  options={gstTreatmentOptions}
                  placeholder={
                    loadingGstTreatment
                      ? 'Loading GST treatments...'
                      : 'Select GST Treatment'
                  }

                  onInputChange={(input, action) => {
                    if (action.action === 'input-change') {
                      debouncedFetchGstTreatment(input);
                    }
                  }}
                  error={getFieldError('gstTreatment')}
                />
              </div>
              <div>
                <SearchDropdown
                  label="Place of Supply"
                  value={formData.placeOfSupply || ''}
                  onChange={value => {
                    const supplyValue = Array.isArray(value)
                      ? value[0]?.value || ''
                      : value?.value || '';
                    handleFieldChange('placeOfSupply', supplyValue);
                  }}
                  options={placeOfSupplyOptions}
                  placeholder={
                    loadingPlaceOfSupply
                      ? 'Loading locations...'
                      : 'Select Place of Supply'
                  }

                  onInputChange={(input, action) => {
                    if (action.action === 'input-change') {
                      debouncedFetchPlaceOfSupply(input);
                    }
                  }}
                  error={getFieldError('placeOfSupply')}
                />
              </div>
              <div className="col-span-2">
                <Text
                  variant="label"
                  size="sm"
                  weight="medium"
                  className="text-gray-700 mb-1 block"
                >
                  Tax Preference
                </Text>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taxPreference"
                      value="taxable"
                      checked={formData.taxPreference === 'taxable'}
                      onChange={e => onChange('taxPreference', e.target.value)}
                      className="mr-2"
                    />{' '}
                    Taxable
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taxPreference"
                      value="tax_exempt"
                      checked={formData.taxPreference === 'tax_exempt'}
                      onChange={e => onChange('taxPreference', e.target.value)}
                      className="mr-2"
                    />{' '}
                    Tax Exempt
                  </label>
                </div>
              </div>
              {formData.taxPreference === 'tax_exempt' && (
                <div className="col-span-2">
                  <Text
                    variant="label"
                    size="sm"
                    weight="medium"
                    className="text-gray-700 mb-1 block"
                  >
                    Exemption Reason <span className="text-red-500 mr-1">*</span>
                  </Text>
                  <input
                    type="text"
                    value={formData.exemptionReason || ''}
                    onChange={e =>
                      onChange('exemptionReason', toTitleCase(e.target.value))
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BusinessStep;
