import React from 'react';
import EnhancedInputField from '../EnhancedInputField/EnhancedInputField';
import TextAreaField from '../TextAreaField/TextAreaField';
import FileInputField from '../FileInputField/FileInputField';
import FormField from '../../atoms/FormField/FormField';
import SelectField, { SelectOption } from '../../atoms/SelectField/SelectField';
import CountryStateCity from '../CountryStateCity/CountryStateCity';
import { useDropdownData } from '../../../hooks/useDropdowns';
import { DropdownOption } from '../../../types';

// Utility functions for common validation patterns
export const ValidationPatterns = {
  email: (value: string) => {
    if (!value) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },

  phone: (value: string) => {
    if (!value) return null;
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(value)
      ? null
      : 'Phone number must be exactly 10 digits';
  },

  pan: (value: string) => {
    if (!value) return null;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(value)
      ? null
      : 'Please enter a valid PAN (e.g., ABCDE1234F)';
  },

  postalCode: (value: string) => {
    if (!value) return null;
    const postalRegex = /^\d{6}$/;
    return postalRegex.test(value)
      ? null
      : 'Postal code must be exactly 6 digits';
  },

  dateOfBirth: (value: string) => {
    if (!value) return null;
    const today = new Date();
    const birthDate = new Date(value);
    const minAge = 16; // Minimum age requirement
    const maxAge = 100; // Maximum reasonable age

    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return 'Please enter a valid date';
    }

    // Check if date is not in the future
    if (birthDate > today) {
      return 'Date of birth cannot be in the future';
    }

    // Calculate age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < minAge) {
      return `Minimum age requirement is ${minAge} years`;
    }

    if (actualAge > maxAge) {
      return `Age cannot exceed ${maxAge} years`;
    }

    return null;
  },

  yearOfPassing: (value: string) => {
    if (!value) return null;
    const currentYear = new Date().getFullYear();
    const year = parseInt(value, 10);

    // Check if it's a valid number
    if (isNaN(year)) {
      return 'Please enter a valid year';
    }

    // Check if it's a 4-digit year
    if (value.length !== 4) {
      return 'Year must be 4 digits';
    }

    // Check reasonable range (not too far in the past or future)
    const minYear = 1950;
    const maxYear = currentYear + 5; // Allow up to 5 years in future for expected graduation

    if (year < minYear) {
      return `Year cannot be earlier than ${minYear}`;
    }

    if (year > maxYear) {
      return `Year cannot be later than ${maxYear}`;
    }

    return null;
  },

  totalExperience: (value: string) => {
    if (!value) return null;

    const experience = parseFloat(value);

    // Check if it's a valid number
    if (isNaN(experience)) {
      return 'Please enter a valid number';
    }

    // Check range (0-50 years)
    if (experience < 0) {
      return 'Experience cannot be negative';
    }

    if (experience > 50) {
      return 'Maximum experience is 50 years';
    }

    // Check for reasonable decimal places (max 1 decimal place)
    if (value.includes('.') && value.split('.')[1].length > 1) {
      return 'Experience can have maximum 1 decimal place (e.g., 3.5)';
    }

    return null;
  },

  relevantExperience: (value: string, totalExperience?: string) => {
    if (!value) return null;

    const relevantExp = parseFloat(value);

    // Check if it's a valid number
    if (isNaN(relevantExp)) {
      return 'Please enter a valid number';
    }

    // Check range (0-50 years, but should not exceed total experience)
    if (relevantExp < 0) {
      return 'Experience cannot be negative';
    }

    if (relevantExp > 50) {
      return 'Maximum experience is 50 years';
    }

    // Check for reasonable decimal places (max 1 decimal place)
    if (value.includes('.') && value.split('.')[1].length > 1) {
      return 'Experience can have maximum 1 decimal place (e.g., 2.5)';
    }

    // Check against total experience if provided
    if (totalExperience) {
      const totalExp = parseFloat(totalExperience);
      if (!isNaN(totalExp) && relevantExp > totalExp) {
        return 'Relevant experience cannot exceed total experience';
      }
    }

    return null;
  },
};

// Component for dynamic gender dropdown
const DynamicGenderField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const { options, loading, error: fetchError } = useDropdownData('gender');

  // Create options with empty option for placeholder
  const selectOptions = [
    { value: '', label: 'Select gender' },
    ...options
  ];

  return (
    <EnhancedInputField
      label="Gender"
      value={value}
      onChange={onChange}
      error={error || fetchError || undefined}
      required={true}
      type="select"
      options={selectOptions}
      gridCols="col-span-1"
      disabled={loading}
    />
  );
};

// Component for dynamic marital status dropdown
const DynamicMaritalStatusField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const { options, loading, error: fetchError } = useDropdownData('maritalStatus');

  // Create options with empty option for placeholder
  const selectOptions = [
    { value: '', label: 'Select marital status' },
    ...options
  ];

  return (
    <EnhancedInputField
      label="Marital Status"
      value={value}
      onChange={onChange}
      error={error || fetchError || undefined}
      required={true}
      type="select"
      options={selectOptions}
      gridCols="col-span-1"
      disabled={loading}
    />
  );
};

// Component for dynamic notice period dropdown
const DynamicNoticePeriodField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const { options, loading, error: fetchError } = useDropdownData('noticePeriod');

  // Create options with empty option for placeholder
  const selectOptions = [
    { value: '', label: 'Select notice period' },
    ...options
  ];

  return (
    <EnhancedInputField
      label="Notice Period"
      value={value}
      onChange={onChange}
      error={error || fetchError || undefined}
      required={true}
      type="select"
      options={selectOptions}
      gridCols="col-span-1"
      disabled={loading}
    />
  );
};

// Component for dynamic job preference dropdown
const DynamicJobPreferenceField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const { options, loading, error: fetchError } = useDropdownData('jobPreference');

  // Create options with empty option for placeholder
  const selectOptions = [
    { value: '', label: 'Select job preference' },
    ...options
  ];

  return (
    <EnhancedInputField
      label="Job Preference"
      value={value}
      onChange={onChange}
      error={error || fetchError || undefined}
      type="select"
      options={selectOptions}
      gridCols="col-span-1"
      disabled={loading}
    />
  );
};

// Utility functions for formatting
export const FormatUtils = {
  phoneNumber: (value: string) => {
    // Remove non-digits and limit to 10
    return value.replace(/\D/g, '').slice(0, 10);
  },

  panNumber: (value: string) => {
    // Convert to uppercase and remove non-alphanumeric
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
  },

  postalCode: (value: string) => {
    // Remove non-digits and limit to 6
    return value.replace(/\D/g, '').slice(0, 6);
  },

  currencyWithCommas: (value: string) => {
    if (!value) return value;
    // Add commas to numbers
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  parseCurrency: (value: string) => {
    // Remove commas for storage
    return value.replace(/,/g, '');
  },

  experienceYears: (value: string) => {
    // Allow only numbers and one decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to one decimal place
    if (parts.length === 2 && parts[1].length > 1) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 1);
    }

    // Limit to 2 digits before decimal (max 50 years)
    if (parts[0].length > 2) {
      cleaned = parts[0].substring(0, 2) + (parts[1] ? '.' + parts[1] : '');
    }

    return cleaned;
  },
};

// Common field configurations
export const CommonFields = {
  // Utility methods for dynamic field creation
  createField: (
    label: string,
    type:
      | 'text'
      | 'email'
      | 'password'
      | 'tel'
      | 'url'
      | 'number'
      | 'search'
      | 'date',
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    required?: boolean,
    error?: string,
    disabled?: boolean
  ) => (
    <FormField
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),

  createSelectField: (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: SelectOption[],
    placeholder?: string,
    required?: boolean,
    error?: string
  ) => (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      required={required}
      error={error}
    />
  ),

  // Legacy Skills Fields
  primarySkills: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Primary Skills"
      value={value}
      onChange={onChange}
      error={error}
      helpText="List your main technical skills"
    />
  ),

  secondarySkills: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Secondary Skills"
      value={value}
      onChange={onChange}
      error={error}
      helpText="Additional skills and competencies"
    />
  ),

  certifications: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Certifications"
      value={value}
      onChange={onChange}
      error={error}
      helpText="Professional certifications and courses"
    />
  ),

  languages: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Languages Known"
      value={value}
      onChange={onChange}
      error={error}
      helpText="Languages you can speak, read, or write"
    />
  ),

  // Personal Details Fields
  candidateId: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Applicant ID"
      value={value}
      onChange={onChange}
      error={error}
      disabled={true}
      readOnly={true}
      gridCols="col-span-1"
      helpText="Auto-generated ID"
    />
  ),

  panNumber: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    loading?: boolean
  ) => (
    <EnhancedInputField
      label="PAN No"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      loading={loading}
      maxLength={10}
      textTransform="uppercase"
      parseValue={FormatUtils.panNumber}
      validate={ValidationPatterns.pan}
      gridCols="col-span-1"
      helpText="Format: ABCDE1234F"
      pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
    />
  ),

  dateOfBirth: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Date of Birth"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      type="date"
      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
      gridCols="col-span-1"
      validate={ValidationPatterns.dateOfBirth}

    />
  ),

  yearOfPassing: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    required: boolean = false
  ) => (
    <EnhancedInputField
      label="Year of Passing"
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      type="number"
      gridCols="col-span-1"
      validate={ValidationPatterns.yearOfPassing}
      helpText="Enter graduation/passing year"
      inputMode="numeric"
      maxLength={4}
      placeholder="e.g., 2022"
    />
  ),

  firstName: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="First Name"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      textTransform="capitalize"
      gridCols="col-span-1"
    />
  ),

  middleName: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Middle Name"
      value={value}
      onChange={onChange}
      error={error}
      textTransform="capitalize"
      gridCols="col-span-1"
    />
  ),

  lastName: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Last Name"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      textTransform="capitalize"
      gridCols="col-span-1"
    />
  ),

  displayName: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Display Name"
      value={value}
      onChange={onChange}
      error={error}
      disabled={true}
      readOnly={true}
      gridCols="col-span-1"
      helpText="Auto-generated from first and last name"
    />
  ),

  phone: (value: string, onChange: (value: string) => void, error?: string) => (
    <EnhancedInputField
      label="Phone No"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      type="tel"
      maxLength={10}
      parseValue={FormatUtils.phoneNumber}
      validate={ValidationPatterns.phone}
      gridCols="col-span-1"
      helpText="10-digit mobile number"
    />
  ),

  alternatePhone: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Alternate Phone No"
      value={value}
      onChange={onChange}
      error={error}
      type="tel"
      maxLength={10}
      parseValue={FormatUtils.phoneNumber}
      validate={val => (val ? ValidationPatterns.phone(val) : null)}
      gridCols="col-span-1"
    />
  ),

  email: (value: string, onChange: (value: string) => void, error?: string) => (
    <EnhancedInputField
      label="Email ID"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      type="email"
      textTransform="lowercase"
      validate={ValidationPatterns.email}
      gridCols="col-span-1"
      autoComplete="email"
    />
  ),

  alternateEmail: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Alternate Email ID"
      value={value}
      onChange={onChange}
      error={error}
      type="email"
      textTransform="lowercase"
      validate={val => (val ? ValidationPatterns.email(val) : null)}
      gridCols="col-span-1"
    />
  ),

  // Address Fields
  currentAddress: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Current Address"
      value={value}
      onChange={onChange}
      error={error}
      required={false}
      gridCols="col-spa-4"
    />
  ),

  permanentAddress: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    disabled?: boolean
  ) => (
    <EnhancedInputField
      label="Permanent Address"
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={false}
    />
  ),

  currentPostalCode: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Postal Code"
      value={value}
      onChange={onChange}
      error={error}
      required={false}
      maxLength={6}
      parseValue={FormatUtils.postalCode}
      validate={ValidationPatterns.postalCode}
      gridCols="col-span-1"
    />
  ),

  permanentPostalCode: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    disabled?: boolean
  ) => (
    <EnhancedInputField
      label="Postal Code"
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={false}
      maxLength={6}
      parseValue={FormatUtils.postalCode}
      validate={ValidationPatterns.postalCode}
    />
  ),

  // Professional Fields
  currentCTC: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Current CTC (Annual)"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      formatValue={FormatUtils.currencyWithCommas}
      parseValue={(val: string) => val.replace(/[^0-9]/g, '')}
      gridCols="col-span-3"
      helpText="Enter amount in INR"
      inputMode="numeric"
    />
  ),

  expectedCTC: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Expected CTC (Annual)"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      formatValue={FormatUtils.currencyWithCommas}
      parseValue={(val: string) => val.replace(/[^0-9]/g, '')}
      gridCols="col-span-3"
      helpText="Enter amount in INR"
      inputMode="numeric"
    />
  ),

  totalExperience: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="Total Experience (Years)"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      type="text"
      gridCols="col-span-1"
      placeholder="e.g., 3.5"
      validate={ValidationPatterns.totalExperience}
      parseValue={FormatUtils.experienceYears}
      inputMode="decimal"
      helpText="Enter experience in years (1-50)"
    />
  ),

  relevantExperience: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    loading?: boolean,
    totalExperience?: string
  ) => (
    <EnhancedInputField
      label="Relevant Experience (Years)"
      value={value}
      onChange={onChange}
      required
      error={error}
      type="text"
      loading={loading}
      gridCols="col-span-1"
      placeholder="e.g., 2.5"
      validate={(val) => ValidationPatterns.relevantExperience(val, totalExperience)}
      parseValue={FormatUtils.experienceYears}
      inputMode="decimal"
      helpText="Enter relevant experience (cannot exceed total experience)"
    />
  ),

  preferredLocation: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    loading?: boolean
  ) => (
    <EnhancedInputField
      label="Preferred Location"
      value={value}
      onChange={onChange}
      error={error}
      type="async-select"
      loadOptions={async (searchValue: string) => {
        const mockLocations = [
          { value: 'mumbai', label: 'Mumbai' },
          { value: 'delhi', label: 'Delhi' },
          { value: 'bangalore', label: 'Bangalore' },
          { value: 'hyderabad', label: 'Hyderabad' },
          { value: 'pune', label: 'Pune' },
          { value: 'chennai', label: 'Chennai' },
          { value: 'kolkata', label: 'Kolkata' },
          { value: 'ahmedabad', label: 'Ahmedabad' },
          { value: 'remote', label: 'Remote' },
          { value: 'anywhere', label: 'Anywhere in India' },
        ];
        return mockLocations.filter(location =>
          location.label.toLowerCase().includes(searchValue.toLowerCase())
        );
      }}
      loading={loading}
      gridCols="col-span-1"
      placeholder="Select or search location"
    />
  ),

  noticePeriod: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <DynamicNoticePeriodField
      value={value}
      onChange={onChange}
      error={error}
    />
  ),

  jobPreference: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <DynamicJobPreferenceField
      value={value}
      onChange={onChange}
      error={error}
    />
  ),

  linkedinProfile: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <EnhancedInputField
      label="LinkedIn Profile"
      value={value}
      onChange={onChange}
      error={error}
      type="url"
      placeholder="https://www.linkedin.com/in/username"
      gridCols="col-span-3"
      validate={val => {
        if (!val) return null;
        const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/;
        return linkedinRegex.test(val)
          ? null
          : 'Please enter a valid LinkedIn profile URL';
      }}
    />
  ),

  profileSummary: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <TextAreaField
      label="Profile Summary"
      value={value}
      onChange={onChange}
      error={error}
      required={true}
      rows={4}
      maxLength={3000}
      showCharacterCount={true}
      gridCols="col-span-12"
      helpText="Describe your professional background and key achievements"
    />
  ),

  comments: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <TextAreaField
      label="Comments"
      value={value}
      onChange={onChange}
      error={error}
      rows={4}
      maxLength={3000}
      showCharacterCount={true}
      gridCols="col-span-12"
    />
  ),

  resume: (
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error?: string,
    currentFile?: { name: string }
  ) => (
    <FileInputField
      label="Upload Resume"
      onChange={onChange}
      error={error}
      required={true}
      accept=".pdf,.doc,.docx"
      buttonText="Upload Resume"
      maxSize={10} // 10MB
      allowedTypes={['.pdf', '.doc', '.docx']}
      currentFile={currentFile}
      gridCols="col-span-3"
      helpText="PDF, DOC, or DOCX files only (max 10MB)"
    />
  ),

  // City and State Fields with Country-State-City Integration
  currentCity: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    country?: string,
    state?: string,
    disabled?: boolean
  ) => (
    <CountryStateCity
      type="city"
      label="Current City"
      value={value}
      onChange={onChange}
      error={error}
      country={country}
      state={state}
      disabled={disabled}
      required={false}
    />
  ),

  currentState: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    country?: string,
    disabled?: boolean
  ) => (
    <CountryStateCity
      type="state"
      label="Current State"
      value={value}
      onChange={onChange}
      error={error}
      country={country}
      disabled={disabled}
      required={false}
    />
  ),

  currentCountry: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    disabled?: boolean
  ) => (
    <CountryStateCity
      type="country"
      label="Current Country"
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={false}
    />
  ),

  permanentCity: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    country?: string,
    state?: string,
    disabled?: boolean
  ) => (
    <CountryStateCity
      type="city"
      label="Permanent City"
      value={value}
      onChange={onChange}
      error={error}
      country={country}
      state={state}
      disabled={disabled}
      required={false}
    />
  ),

  permanentState: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    country?: string,
    disabled?: boolean
  ) => (
    <CountryStateCity
      type="state"
      label="Permanent State"
      value={value}
      onChange={onChange}
      error={error}
      country={country}
      disabled={disabled}
      required={false}
    />
  ),

  permanentCountry: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    disabled?: boolean
  ) => (
    <CountryStateCity
      type="country"
      label="Permanent Country"
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={false}
    />
  ),

  // Gender and Marital Status with predefined options
  gender: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <DynamicGenderField
      value={value}
      onChange={onChange}
      error={error}
    />
  ),

  maritalStatus: (
    value: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <DynamicMaritalStatusField
      value={value}
      onChange={onChange}
      error={error}
    />
  ),

  // Candidate Photo Upload
  candidatePhoto: (
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error?: string,
    currentFile?: { name: string; preview?: string }
  ) => (
    <FileInputField
      label="Upload Photo"
      onChange={onChange}
      error={error}
      accept=".jpg,.jpeg,.png,.gif"
      buttonText="Upload Photo"
      maxSize={5} // 5MB
      allowedTypes={['.jpg', '.jpeg', '.png', '.gif']}
      currentFile={currentFile}
      gridCols="col-span-1"
      helpText="JPG, PNG, or GIF files only (max 5MB)"
    />
  ),

  // Country State City Components
  countryField: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    disabled?: boolean,
    required?: boolean
  ) => (
    <CountryStateCity
      type="country"
      label="Country"
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={required}
    />
  ),

  stateField: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    country?: string,
    disabled?: boolean,
    required?: boolean
  ) => (
    <CountryStateCity
      type="state"
      label="State"
      value={value}
      onChange={onChange}
      error={error}
      country={country}
      disabled={disabled}
      required={required}
    />
  ),

  cityField: (
    value: string,
    onChange: (value: string) => void,
    error?: string,
    country?: string,
    state?: string,
    disabled?: boolean,
    required?: boolean
  ) => (
    <CountryStateCity
      type="city"
      label="City"
      value={value}
      onChange={onChange}
      error={error}
      country={country}
      state={state}
      disabled={disabled}
      required={required}
    />
  ),
};

// Checkbox component for form consistency
export const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  gridCols?: string;
  helpText?: string;
  id?: string;
  className?: string;
}> = ({
  label,
  checked,
  onChange,
  disabled = false,
  gridCols = 'col-span-3',
  helpText,
  id,
  className,
}) => {
    const inputId = id || `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className={`${gridCols} ${className}`}>
        <div className="flex items-center h-10">
          <input
            type="checkbox"
            id={inputId}
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label
            htmlFor={inputId}
            className={`ml-2 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}
          >
            {label}
          </label>
        </div>
        {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      </div>
    );
  };

// Section header component
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
}> = ({ title, subtitle, className = '' }) => (
  <div className={`col-span-12 ${className}`}>
    <h6 className="text-lg font-semibold text-gray-900 mt-6 mb-2">{title}</h6>
    {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
  </div>
);

// Utility function for generating display name from name components
export const generateDisplayName = (
  firstName?: string,
  middleName?: string,
  lastName?: string
): string => {
  // Helper function to capitalize each word
  const capitalizeWords = (text: string): string => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const nameParts = [
    firstName || '',
    middleName || '',
    lastName || ''
  ]
    .filter(part => part.trim() !== '')
    .map(part => capitalizeWords(part.trim()));

  return nameParts.join(' ');
};

export default CommonFields;
