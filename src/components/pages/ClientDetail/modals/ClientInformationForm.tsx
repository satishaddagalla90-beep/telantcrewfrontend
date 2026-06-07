import React, { useState, useEffect } from 'react';
import SearchDropdown from '../../../molecules/SearchDropdown';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import { ClientInformationFormData } from '../helper';

interface ClientInformationFormProps {
  initialData: ClientInformationFormData;
  onDataChange: (data: ClientInformationFormData) => void;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean) => void;
}

// Client ODC options
const clientODCOptions = [
  { value: 'bengaluru', label: 'Bengaluru' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'pune', label: 'Pune' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'noida', label: 'Noida' },
  { value: 'gurgaon', label: 'Gurgaon' },
];

// Required documents options
const requiredDocumentsOptions = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'experience_certificate', label: 'Experience Certificate' },
  { value: 'educational_certificate', label: 'Educational Certificate' },
];

// Contract type options
const contractTypeOptions = [
  { value: 'fulltime', label: 'Full Time' },
  { value: 'parttime', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

// Payment term options
const paymentTermOptions = [
  { value: 'net30', label: 'Net 30' },
  { value: 'net45', label: 'Net 45' },
  { value: 'net60', label: 'Net 60' },
  { value: 'immediate', label: 'Immediate' },
];

// Payment type options
const paymentTypeOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'project', label: 'Project Based' },
];

export const ClientInformationForm: React.FC<ClientInformationFormProps> = ({
  initialData,
  onDataChange,
  errors = {},
  onValidationChange,
}) => {
  const [data, setData] = useState<ClientInformationFormData>(initialData);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localErrors, onValidationChange]);

  const handleChange = (field: keyof ClientInformationFormData, value: any) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SearchDropdown
        label="Client ODC"
        value={data.client_odc}
        onChange={(value) => handleChange('client_odc', value)}
        options={clientODCOptions}
        placeholder="Select Client ODC"
        required
        isMulti
        isSearchable
        error={localErrors.client_odc}
      />

      <SearchDropdown
        label="Required Documents"
        value={data.required_documents}
        onChange={(value) => handleChange('required_documents', value)}
        options={requiredDocumentsOptions}
        placeholder="Select Required Documents"
        required
        isMulti
        isSearchable
        error={localErrors.required_documents}
      />

      <SearchDropdown
        label="Contract Type"
        value={data.contract_type || ''}
        onChange={(value) => handleChange('contract_type', value)}
        options={contractTypeOptions}
        placeholder="Select Contract Type"
        isSearchable
        isClearable
        error={localErrors.contract_type}
      />

      <EnhancedInputField
        label="Expiry Date"
        value={data.expiry_date || ''}
        onChange={(value) => handleChange('expiry_date', value)}
        type="date"
        placeholder="dd/mm/yyyy"
        error={localErrors.expiry_date}
      />

      <SearchDropdown
        label="Payment Term"
        value={data.payment_term || ''}
        onChange={(value) => handleChange('payment_term', value)}
        options={paymentTermOptions}
        placeholder="Select Payment Term"
        isSearchable
        isClearable
        error={localErrors.payment_term}
      />

      <SearchDropdown
        label="Payment Type"
        value={data.payment_type || ''}
        onChange={(value) => handleChange('payment_type', value)}
        options={paymentTypeOptions}
        placeholder="Select Payment Type"
        isSearchable
        isClearable
        error={localErrors.payment_type}
      />
    </div>
  );
};

export default ClientInformationForm;
