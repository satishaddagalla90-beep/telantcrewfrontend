import React, { useState, useEffect, useCallback } from 'react';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import SearchDropdown from '../../../molecules/SearchDropdown';
import AvatarUpload from '../../../molecules/AvatarUpload';
import CountryStateCity from '../../../molecules/CountryStateCity';
import { ClientFormData } from '../helper';

interface HeaderFormProps {
  initialData: ClientFormData;
  onDataChange: (data: ClientFormData) => void;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean) => void;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'newlead', label: 'New Lead' },
];

export const HeaderForm: React.FC<HeaderFormProps> = ({
  initialData,
  onDataChange,
  errors = {},
  onValidationChange,
}) => {
  const [data, setData] = useState<ClientFormData>(initialData);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setLocalErrors(errors);
  }, [errors]);

  useEffect(() => {
    const isValid = Object.keys(localErrors).length === 0;
    onValidationChange?.(isValid);
  }, [localErrors, onValidationChange]);

  const handleChange = (field: keyof ClientFormData, value: any) => {
    const updatedData = { ...data, [field]: value };
    setData(updatedData);
    onDataChange(updatedData);

    // Clear error for this field
    if (localErrors[field]) {
      const newErrors = { ...localErrors };
      delete newErrors[field];
      setLocalErrors(newErrors);
    }
  };

  const handleLogoChange = (file: File | null) => {
    const updatedData = {
      ...data,
      client_logo: file,
      client_logo_preview: file
        ? URL.createObjectURL(file)
        : data.client_logo_preview,
    };
    setData(updatedData);
    onDataChange(updatedData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EnhancedInputField
        label="Client Name"
        value={data.client_name}
        onChange={value => handleChange('client_name', value)}
        error={localErrors.client_name}
        required
        placeholder="Enter client name"
        gridCols="col-span-1"
        
      />

      <EnhancedInputField
        label="Client Code"
        value={data.client_id}
        onChange={value => handleChange('client_id', value)}
        error={localErrors.client_id}
        required
        placeholder="Enter client code"
        gridCols="col-span-1"
        disabled
        readOnly
      />

      {/* Client Display Name Field */}
      <EnhancedInputField
        label="Client Display Name"
        value={data.client_display_name}
        onChange={value => handleChange('client_display_name', value)}
        error={localErrors.client_display_name}
        placeholder="Enter client display name"
        gridCols="col-span-1"
      />

      {/* Client Logo Upload */}
      <div className="col-span-2">
        <AvatarUpload
          label="Client Logo"
          value={data.client_logo}
          preview={data.client_logo_preview}
          onChange={handleLogoChange}
          error={localErrors.client_logo}
          accept=".jpg,.jpeg,.png,.gif"
          maxSize={5}
          size="md"
          fallbackIcon="upload"
          showFileName={true}
        />
      </div>

      <div className="col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Billing Address
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EnhancedInputField
            label="Attention"
            value={data.billing_attention}
            onChange={value => handleChange('billing_attention', value)}
            error={localErrors.billing_attention}
            placeholder="Enter attention line"
            gridCols="col-span-2"
          />

          <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <CountryStateCity
              type="country"
              label="Country"
              value={data.billing_country}
              onChange={(value: string) =>
                handleChange('billing_country', value)
              }
              error={localErrors.billing_country}
              required={true}
              placeholder="Select country"
            />

            <CountryStateCity
              type="state"
              label="State"
              value={data.billing_state}
              onChange={(value: string) => handleChange('billing_state', value)}
              error={localErrors.billing_state}
              required={true}
              country={data.billing_country}
              placeholder="Select state"
            />

            <CountryStateCity
              type="city"
              label="City"
              value={data.billing_city}
              onChange={(value: string) => handleChange('billing_city', value)}
              error={localErrors.billing_city}
              required={true}
              country={data.billing_country}
              state={data.billing_state}
              placeholder="Select city"
            />
          </div>

          <EnhancedInputField
            label="Street Address 1"
            value={data.billing_street1}
            onChange={value => handleChange('billing_street1', value)}
            error={localErrors.billing_street1}
            required
            placeholder="Enter street address line 1"
            gridCols="col-span-2"
          />

          <EnhancedInputField
            label="Street Address 2"
            value={data.billing_street2}
            onChange={value => handleChange('billing_street2', value)}
            error={localErrors.billing_street2}
            placeholder="Enter street address line 2 (optional)"
            gridCols="col-span-2"
          />

          <EnhancedInputField
            label="PIN Code"
            value={data.billing_pin_code}
            onChange={value => handleChange('billing_pin_code', value)}
            error={localErrors.billing_pin_code}
            required
            placeholder="Enter PIN code"
            gridCols="col-span-1"
          />
        </div>
      </div>

      <EnhancedInputField
        label="Website"
        value={data.website}
        onChange={value => handleChange('website', value)}
        error={localErrors.website}
        type="url"
        placeholder="Enter website URL"
        gridCols="col-span-1"
      />

      <EnhancedInputField
        label="Client Portal"
        value={data.client_portal}
        onChange={value => handleChange('client_portal', value)}
        error={localErrors.client_portal}
        placeholder="Enter client portal URL"
        gridCols="col-span-1"
      />

      <SearchDropdown
        label="Status"
        value={data.status}
        onChange={value => handleChange('status', value)}
        options={statusOptions}
        placeholder="Select status"
        required
        isSearchable
        isClearable
        error={localErrors.status}
      />
    </div>
  );
};

export default HeaderForm;