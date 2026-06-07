import React, { useState, useEffect, useCallback, useRef } from 'react';
import Text from '../../atoms/Text/Text';
import Tabs, { TabItem } from '../../atoms/Tabs/Tabs';
import CountryStateCity from '../../molecules/CountryStateCity/CountryStateCity';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import SelectField from '../../molecules/SelectField/SelectField';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import { Country, State, City } from 'country-state-city';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
// Import the new supplier dropdown hooks
import {
  useSupplierCategoryDropdown,
  useEmpanelmentStatusDropdown,
  useSupplierTypeDropdown,
  useSkillCategoryDropdown,
  useSkillCapabilityDropdown,
  useIndustryDropdown,
  useZoneDropdown,
  useBranchesDropdown
} from '../../../hooks/useSupplierDropdowns';
import AvatarUpload from '../../molecules/AvatarUpload/AvatarUpload';
// Import the supplier ID hook - REMOVED
// import { useSupplierId } from '../../../hooks/useSupplierId';

// Helper function to convert text to title case (first letter of each word capitalized)
const toTitleCase = (value: string) => {
  return value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

// Helper function to validate website
const isValidWebsite = (url: string) => {
  // Accept only www.xyz.com format
  return /^www\.[\w\-]+\.[a-z]{2,}(\/\S*)?$/.test(url);
};

// Helper function to format website URL for display (removes protocol)
const formatWebsiteDisplay = (url: string) => {
  if (!url) return '';
  // Remove protocol (http:// or https://) if present
  return url.replace(/^https?:\/\//i, '');
};

// Helper function to format website URL for storage (converts to lowercase only)
const formatWebsiteStorage = (url: string) => {
  if (!url) return '';
  // Convert to lowercase only, preserve the original format
  return url.toLowerCase();
};

const BusinessStep = ({ formData, onChange, errors, touched, onFileUpload, uploadStates }: any) => {
  const [activeTab, setActiveTab] = useState('core-info');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);
  const [supplierTypeSearch, setSupplierTypeSearch] = useState('');

  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Supplier ID hook removed as per requirement for manual input
  // const { supplierId, loading: supplierIdLoading, error: supplierIdError, refreshSupplierId } = useSupplierId();

  // Supplier dropdown hooks
  const {
    options: supplierCategoryOptions,
    loading: supplierCategoryLoading,
    search: searchSupplierCategory
  } = useSupplierCategoryDropdown();

  const {
    options: empanelmentStatusOptions,
    loading: empanelmentStatusLoading,
    search: searchEmpanelmentStatus
  } = useEmpanelmentStatusDropdown();

  const {
    options: supplierTypeOptions,
    loading: supplierTypeLoading,
    search: searchSupplierType,
    reset: resetSupplierType
  } = useSupplierTypeDropdown();

  const {
    options: skillCategoryOptions,
    loading: skillCategoryLoading,
    search: searchSkillCategory
  } = useSkillCategoryDropdown();

  const {
    options: skillCapabilityOptions,
    loading: skillCapabilityLoading,
    search: searchSkillCapability,
    reset: resetSkillCapability
  } = useSkillCapabilityDropdown();

  const {
    options: industryOptions,
    loading: industryLoading,
    search: searchIndustry,
    reset: resetIndustry
  } = useIndustryDropdown();

  const {
    options: zoneOptions,
    loading: zoneLoading,
    search: searchZone
  } = useZoneDropdown();

  const {
    options: branchesOptions,
    loading: branchesLoading,
    search: searchBranches
  } = useBranchesDropdown();

  // Reset dropdowns when component unmounts or when needed
  useEffect(() => {
    return () => {
      resetSupplierType();
      resetSkillCapability();
      resetIndustry();
    };
  }, [resetSupplierType, resetSkillCapability, resetIndustry]);

  // Define tabs
  const tabs: TabItem[] = [
    { id: 'core-info', label: 'Supplier Information' },
    { id: 'address-details', label: 'Address Details' },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Tab navigation logic for Next/Previous buttons
  useEffect(() => {
    const tabNavigation = {
      handleNext,
      handlePrevious,
      activeTab,
      isFirstSubTab: activeTab === 'core-info',
    };

    // Store navigation object in formData for FormWizardLayout to use
    onChange('_businessTabNavigation', tabNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleNext, handlePrevious]); // Only update when handlers change, onChange intentionally excluded to prevent infinite loop

  // Get error for a field - only show errors after validation has been triggered
  const getFieldError = (fieldName: string) => {
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
        'supplier_id', // Added supplier_id as a required field
        'supplier_category',
        'supplier_name',
        'empanelment_status',
        'supplier_type',
        'website',
        'skill_category',
        'skill_capability',
        'industry',
        'branches',
        'zone',
      ],
      'address-details': [
        'registered_address',
        'address.country',
        'address.state',
        'address.city',
        'address.postal_code',
      ],
    };

    const fieldsToValidate = tabFields[activeTab] || [];

    fieldsToValidate.forEach(field => {
      const fieldValue = getNestedValue(formDataRef.current, field);
      const error = validateField(field, fieldValue);
      if (error) {
        newErrors[field] = error;
      }
    });

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to get nested values from formData
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  };

  // Validation function for mandatory fields
  const validateField = (fieldName: string, value: any) => {
    switch (fieldName) {
      case 'supplier_id':
        // Supplier ID is auto-generated, but we still validate it's not empty
        if (!value || value.trim() === '') {
          return 'Supplier ID is required';
        }
        return '';

      case 'supplier_category':
        if (!value || value.trim() === '') {
          return 'Supplier Category is required';
        }
        return '';

      case 'supplier_name':
        if (!value || value.trim() === '') {
          return 'Supplier Name is required';
        }
        return '';

      case 'empanelment_status':
        if (!value || value === '') {
          return 'Empanelment Status is required';
        }
        return '';

      case 'supplier_type':
        // Handle multi-select value (array)
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return 'Supplier Type is required';
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Supplier Type is required';
        }
        return '';

      case 'registered_address':
        if (!value || value.trim() === '') {
          return 'Registered Address is required';
        }
        return '';

      case 'address.country':
        if (!value || value === '') {
          return 'Country is required';
        }
        return '';

      case 'address.state':
        if (!value || value === '') {
          return 'State is required';
        }
        return '';

      case 'address.city':
        if (!value || value === '') {
          return 'City is required';
        }
        return '';

      case 'address.postal_code':
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

      case 'website':
        if (!value || value.trim() === '') {
          return 'Website is required';
        }
        // Allow www.xyz.com format
        if (!/^www\.[\w\-]+\.[a-z]{2,}(\/\S*)?$/.test(value)) {
          return 'Please enter a valid website in format www.example.com';
        }
        return '';

      case 'skill_category':
        // Handle multi-select value (array)
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return 'Skill Category is required';
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Skill Category is required';
        }
        return '';

      case 'zone':
        if (!value || value.trim() === '') {
          return 'Zone is required';
        }
        return '';


      // case 'skill_capability':
      //   // Handle multi-select value (array)
      //   if (Array.isArray(value)) {
      //     if (value.length === 0) {
      //       return 'Skill Capability is required';
      //     }
      //   } else if (!value || (typeof value === 'string' && value.trim() === '')) {
      //     return 'Skill Capability is required';
      //   }
      //   return '';

      case 'branches':
        // Handle multi-select value (array)
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return 'Branches is required';
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Branches is required';
        }
        return '';

      case 'industry':
        // Handle multi-select value (array)
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return 'Industry is required';
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Industry is required';
        }
        return '';

      default:
        return '';
    }
  };

  // Enhanced onChange handler that clears errors for the field being updated
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    // Update the form data
    onChange(fieldName, value);

    // Clear error for this field if it exists
    setLocalErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // onChange intentionally excluded to prevent infinite loop

  // Effect to update form data with supplier ID when it changes - REMOVED
  // useEffect(() => {
  //   if (supplierId) {
  //     handleFieldChange('supplier_id', supplierId);
  //   }
  // }, [supplierId, handleFieldChange]);

  // Handle nested object changes
  const handleNestedChange = useCallback((parent: string, field: string, value: any) => {
    const updatedObj = { ...formData[parent], [field]: value };
    handleFieldChange(parent, updatedObj);

    // Clear error for this nested field if it exists
    const errorKey = `${parent}.${field}`;
    setLocalErrors(prev => {
      if (prev[errorKey]) {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prev;
    });
  }, [formData, handleFieldChange]);

  const handleLogoChange = (file: File | null) => {
    onChange('supplier_logo', file);
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

  return (
    <div className="p-8 bg-white rounded shadow text-left space-y-6">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId: string) => {
          setActiveTab(tabId);
          // Reset validation state when manually switching tabs
          setValidationTriggered(false);
          setLocalErrors({});
        }}
      />

      {/* --- Tab 1: Supplier Information --- */}
      {activeTab === 'core-info' && (
        <div className="grid grid-cols-4 gap-6">
          {/* Supplier ID as input field */}
          <div>
            <EnhancedInputField
              label="Supplier ID"
              value={formData.supplier_id || ''}
              onChange={value => handleFieldChange('supplier_id', value)}
              type="text"
              placeholder="Enter Supplier ID"
              required
              gridCols=""
              disabled={false}
              error={getFieldError('supplier_id')}
            />
          </div>

          {/* Supplier Category - Dropdown with search */}
          <div>
            <SelectField
              label="Supplier Category"
              value={formData.supplier_category || ''}
              onChange={(value: string) => handleFieldChange('supplier_category', value)}
              options={supplierCategoryOptions}
              loadOptions={searchSupplierCategory}
              isSearchable={true}
              isAsync={true}
              isLoading={supplierCategoryLoading}
              placeholder="Search or select supplier category"
              required
              error={getFieldError('supplier_category')}
            />
          </div>

          {/* Supplier Name */}
          <div>
            <EnhancedInputField
              label="Supplier Name"
              value={formData.supplier_name || ''}
              onChange={value => handleFieldChange('supplier_name', value)}
              type="text"
              textTransform="capitalize"
              placeholder="Enter supplier name"
              required
              gridCols=""
              error={getFieldError('supplier_name')}
            />
          </div>

          {/* Supplier Display Name */}
          <div>
            <EnhancedInputField
              label="Supplier Display Name"
              value={formData.supplier_display_name || ''}
              onChange={value => handleFieldChange('supplier_display_name', value)}
              type="text"
              textTransform="capitalize"
              placeholder="Enter display name"
              gridCols=""
            />
          </div>

          {/* Supplier Logo Upload */}
          <div>
            <AvatarUpload
              label="Supplier Logo"
              value={formData.supplier_logo}
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

          {/* Empanelment Status - Dropdown with search */}
          <div>
            <SelectField
              label="Empanelment Status"
              value={formData.empanelment_status || ''}
              onChange={(value: string) => handleFieldChange('empanelment_status', value)}
              options={empanelmentStatusOptions}
              loadOptions={searchEmpanelmentStatus}
              isSearchable={true}
              isAsync={true}
              isLoading={empanelmentStatusLoading}
              placeholder="Search or select empanelment status"
              required
              error={getFieldError('empanelment_status')}
            />
          </div>

          {/* Supplier Type - Multi-select Dropdown with search */}
          <div>
            <SearchDropdown
              label="Supplier Type"
              value={formData.supplier_type || []}
              onChange={(val: any) => handleFieldChange('supplier_type', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : [])}
              options={supplierTypeOptions}
              isMulti={true}
              isSearchable={true}
              onInputChange={(v: string) => {
                setSupplierTypeSearch(v);
                searchSupplierType(v);
              }}
              placeholder="Search supplier type"
              required
              error={getFieldError('supplier_type')}
              loading={supplierTypeLoading}
            />
          </div>

          {/* Website */}
          <div>
            <EnhancedInputField
              label="Website"
              value={formData.website ? formatWebsiteDisplay(formData.website) : ''}
              onChange={value => handleFieldChange('website', formatWebsiteStorage(value))}
              type="text"
              placeholder="www.example.com"
              required
              gridCols=""
              error={getFieldError('website')}
            />
          </div>
          {/* Skill Category - Dropdown with search */}
          <div>
            <SearchDropdown
              label="Skill Category"
              value={formData.skill_category || []}
              onChange={(val: any) => handleFieldChange('skill_category', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : [])}
              options={skillCategoryOptions}
              onInputChange={(v: string, action: any) => {
                if (action.action === 'input-change') {
                  searchSkillCategory(v);
                }
              }}
              isSearchable={true}
              isMulti={true}
              loading={skillCategoryLoading}
              required
              error={getFieldError('skill_category')}
              placeholder="Search skill category"
            />
          </div>

          {/* Skill Capability - Multi-select Dropdown with search */}
          {/* <div>
            <SelectField
              label="Skill Capability"
              value={formData.skill_capability || []}
              onChange={(value: string | string[]) => handleFieldChange('skill_capability', value)}
              options={skillCapabilityOptions}
              loadOptions={searchSkillCapability}
              isSearchable={true}
              isAsync={true}
              isMulti={true}
              isLoading={skillCapabilityLoading}
              placeholder="Search or select skill capability"
              required
              error={getFieldError('skill_capability')}
            />
          </div> */}

          {/* Industry - Multi-select Dropdown with search */}
          <div>
            <SearchDropdown
              label="Industry"
              value={formData.industry || []}
              onChange={(val: any) => handleFieldChange('industry', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : [])}
              options={industryOptions}
              onInputChange={(v: string, action: any) => {
                if (action.action === 'input-change') {
                  searchIndustry(v);
                }
              }}
              isSearchable={true}
              isMulti={true}
              loading={industryLoading}
              placeholder="Search or select industry"
              required
              error={getFieldError('industry')}
            />
          </div>

          {/* Branches - Dropdown with search */}
          <div>
            <SearchDropdown
              label="Branches"
              value={formData.branches || []}
              onChange={(val: any) => handleFieldChange('branches', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : [])}
              options={branchesOptions}
              onInputChange={(v: string, action: any) => {
                if (action.action === 'input-change') {
                  searchBranches(v);
                }
              }}
              isSearchable={true}
              isMulti={true}
              loading={branchesLoading}
              required
              error={getFieldError('branches')}
              placeholder="Search branches"
            />
          </div>

          {/* MSME Certified */}
          <div>
            <Text
              variant="label"
              size="sm"
              weight="medium"
              className="text-gray-700 mb-1 block"
            >
              MSME Certified
            </Text>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.msme_certified || false}
                onChange={e => handleFieldChange('msme_certified', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Yes
              </label>
            </div>
          </div>

          {/* Zone - Dropdown with search */}
          <div>
            <SelectField
              label="Zone"
              value={formData.zone || ''}
              onChange={(value: string) => handleFieldChange('zone', value)}
              options={zoneOptions}
              loadOptions={searchZone}
              isSearchable={true}
              isAsync={true}
              isLoading={zoneLoading}
              required
              error={getFieldError('zone')}
              placeholder="Search or select zone"
            />
          </div>
        </div>
      )}

      {/* --- Tab 2: Address Details --- */}
      {activeTab === 'address-details' && (
        <div className="grid grid-cols-4 gap-6">
          {/* Registered Address */}
          <div className="col-span-2">
            <EnhancedInputField
              label="Registered Address"
              value={formData.registered_address || ''}
              onChange={value => handleFieldChange('registered_address', value)}
              type="text"
              placeholder="Enter registered address"
              required
              gridCols="col-span-2"
              error={getFieldError('registered_address')}
            />
          </div>

          {/* Country */}
          <div>
            <CountryStateCity
              type="country"
              label="Country"
              value={formData.address?.country || ''}
              onChange={(value: string) => handleNestedChange('address', 'country', value)}
              required
              error={getFieldError('address.country')}
            />
          </div>

          {/* State */}
          <div>
            <CountryStateCity
              type="state"
              label="State"
              value={formData.address?.state || ''}
              onChange={(value: string) => handleNestedChange('address', 'state', value)}
              country={formData.address?.country}
              disabled={!formData.address?.country}
              required
              error={getFieldError('address.state')}
            />
          </div>

          {/* City */}
          <div>
            <CountryStateCity
              type="city"
              label="City"
              value={formData.address?.city || ''}
              onChange={(value: string) => handleNestedChange('address', 'city', value)}
              country={formData.address?.country}
              state={formData.address?.state}
              disabled={!formData.address?.country || !formData.address?.state}
              placeholder="Select City"
              required
              error={getFieldError('address.city')}
            />
          </div>

          {/* Postal Code */}
          <div>
            <EnhancedInputField
              label="Postal Code"
              value={formData.address?.postal_code || ''}
              onChange={value => handleNestedChange('address', 'postal_code', value)}
              type="text"
              inputMode="numeric"
              placeholder="Enter postal code"
              required
              gridCols=""
              maxLength={6}
              error={getFieldError('address.postal_code')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessStep;