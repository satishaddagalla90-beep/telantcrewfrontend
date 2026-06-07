import React, { useEffect, useState, useCallback } from 'react';
import Select from 'react-select';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import SelectField from '../../molecules/SelectField/SelectField';
import AsyncSelect from '../../atoms/AsyncSelect';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import Text from '../../atoms/Text/Text';
import Icon from '../../atoms/Icon/Icon';
import {
  generateDisplayName,
  shouldUpdateDisplayName,
} from './utils/nameUtils';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { showErrorToast, showSuccessToast } from '../../../utils/toast';
import { useDesignationDropdown, useDepartmentDropdown } from '../../../hooks/useSupplierDropdowns';

interface Contact {
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  phone: string;
  countryCode: string;
  email: string;
  designation: string;
  department: string[];
}

interface ContactsStepProps {
  formData: {
    contacts: Contact[];
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}

const ContactsStep = ({
  formData,
  onChange,
  errors = {},
  touched = {},
}: ContactsStepProps) => {
  // Use the new supplier dropdown hooks for designation and department
  const {
    options: designationOptions,
    loading: designationLoading,
    search: searchDesignation,
  } = useDesignationDropdown();

  const {
    options: departmentOptions,
    loading: departmentLoading,
    search: searchDepartment,
  } = useDepartmentDropdown();

  // Validation state - for deferred validation like BusinessStep
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);

  // Country codes state from API
  const [countryCodesData, setCountryCodesData] = useState<
    { value: string; label: string }[]
  >([]);
  const [countryCodesLoading, setCountryCodesLoading] = useState(false);

  const portalTarget =
    typeof window !== 'undefined' ? document.body : undefined;

  // Bulk upload states (template, parsing, preview, validation)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [excelValidationErrors, setExcelValidationErrors] = useState<Record<string, string>>({});

  // Fetch country codes from API
  useEffect(() => {
    const fetchCountryCodes = async () => {
      setCountryCodesLoading(true);
      try {
        const response = await fetch(
          'https://countriesnow.space/api/v0.1/countries/codes'
        );
        if (!response.ok) throw new Error('Failed to fetch country codes');
        const data = await response.json();

        if (data.error === false && data.data) {
          // Transform API response to options format for AsyncSelect
          const formattedCodes = data.data.map((country: any) => ({
            value: country.dial_code,
            label: country.dial_code,
          }));
          setCountryCodesData(formattedCodes);
        }
      } catch (err: any) {
        console.error('Error fetching country codes:', err);
        // Empty array if API fails - no fallback data
        setCountryCodesData([]);
      } finally {
        setCountryCodesLoading(false);
      }
    };
    fetchCountryCodes();
  }, []);

  useEffect(() => {
    if (!formData.contacts || formData.contacts.length === 0) {
      const defaultContact = {
        firstName: '',
        middleName: '',
        lastName: '',
        displayName: '',
        phone: '',
        countryCode: countryCodesData.length > 0 ? countryCodesData[0].value : '+1',
        email: '',
        designation: '',
        department: [],
      };
      onChange('contacts', [defaultContact]);
    }
  }, [formData.contacts, onChange]);

  // Download Excel Template with dropdowns
  const downloadExcelTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Contacts');

      worksheet.columns = [
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Middle Name', key: 'middleName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Display Name', key: 'displayName', width: 25 },
        { header: 'Country Code', key: 'countryCode', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Designation', key: 'designation', width: 20 },
        { header: 'Department', key: 'department', width: 20 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Fetch designation and department lists for template
      const designationUrl = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Designation'));
      designationUrl.searchParams.append('limit', '1000');
      const designationResponse = await apiCall<{ data: Array<{ id: string; name: string }> }>(designationUrl.pathname + designationUrl.search);
      const designationList = designationResponse.data?.data?.map((d: any) => d.name) || [];

      const departmentUrl = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Department'));
      departmentUrl.searchParams.append('limit', '1000');
      const departmentResponse = await apiCall<{ data: Array<{ id: string; name: string }> }>(departmentUrl.pathname + departmentUrl.search);
      const departmentList = departmentResponse.data?.data?.map((d: any) => d.name) || [];

      if (designationList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          const cell = worksheet.getCell(`H${i}`);
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${designationList.join(',')}"`],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Designation',
            error: 'Please select a designation from the dropdown list',
          };
        }
      }

      if (departmentList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          const cell = worksheet.getCell(`I${i}`);
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${departmentList.join(',')}"`],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Department',
            error: 'Please select a department from the dropdown list',
          };
        }
      }

      const countryCodeList = countryCodesData.map((cc: any) => cc.value).join(',');
      for (let i = 2; i <= 1000; i++) {
        const cell = worksheet.getCell(`E${i}`);
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${countryCodeList}"`],
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid Country Code',
          error: 'Please select a country code from the dropdown list',
        };
      }

      (worksheet.getCell('A2') as any).note = 'Fill in the contact details. Display Name is optional (will be auto-generated). Use dropdowns for Designation and Department.';

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      saveAs(blob, `Bulk_contacts_${formattedDate}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel template:', error);
      showErrorToast('Failed to generate Excel template. Please try again.');
    }
  };

  // Parse Excel file and validate
  const parseExcelFile = async (file: File) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('No worksheet found in the Excel file');

      const rows: any[] = [];
      const headers: string[] = [];

      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers.push(cell.value as string);
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            let cellValue = cell.value;
            if (cellValue !== null && typeof cellValue === 'object') {
              if ('richText' in cellValue && Array.isArray(cellValue.richText)) {
                cellValue = cellValue.richText.map((rt: any) => rt.text).join('');
              } else if ('text' in cellValue && typeof cellValue.text === 'string') {
                cellValue = cellValue.text;
              } else if (cellValue instanceof Date) {
                cellValue = cellValue.toString();
              } else {
                cellValue = JSON.stringify(cellValue);
              }
            } else if (cellValue === null || cellValue === undefined) {
              cellValue = '';
            } else {
              cellValue = String(cellValue);
            }
            rowData[header] = cellValue;
          }
        });
        if (Object.values(rowData).some(val => val !== null && val !== undefined && val !== '')) {
          rows.push(rowData);
        }
      });

      setExcelData(rows);
      setShowPreview(true);
      validateExcelData(rows);
      return rows;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      showErrorToast('Failed to parse Excel file. Please make sure it follows the template format.');
      return [];
    }
  };

  const validateExcelData = (data: any[]) => {
    const errors: Record<string, string> = {};
    const seenContacts = new Set<string>();

    data.forEach((row, index) => {
      const email = (row['Email'] || '').toLowerCase().trim();
      const phone = (row['Phone'] || '').replace(/\D/g, '');
      const uniqueKey = `${email}|${phone}`;

      if (seenContacts.has(uniqueKey)) {
        errors[`row_${index}_duplicate`] = 'Duplicate contact (same email/phone)';
      } else {
        seenContacts.add(uniqueKey);
      }

      const lastName = row['Last Name'] || '';
      if (!lastName || lastName.trim() === '') {
        errors[`row_${index}_lastName`] = 'Last Name is required';
      }

      const phoneValue = row['Phone'] || '';
      if (phoneValue && phoneValue.trim()) {
        const cleanPhone = phoneValue.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          errors[`row_${index}_phone`] = 'Phone must be exactly 10 digits';
        }
      } else {
        errors[`row_${index}_phone`] = 'Phone is required';
      }

      const emailValue = row['Email'] || '';
      if (emailValue && emailValue.trim()) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailValue)) {
          errors[`row_${index}_email`] = 'Please enter a valid email address';
        }
      } else {
        errors[`row_${index}_email`] = 'Email is required';
      }

      // Validate Country Code
      const countryCode = String(row['Country Code'] || '').trim();
      if (countryCode) {
        // Valid formats:
        // 1. "+91" (Standard)
        // 2. "91" (Numeric only - will be auto-prefixed)
        // 3. "+91 (India)" (With label - will be parsed)

        let isValid = false;

        // Check if it's purely numeric
        if (/^\d+$/.test(countryCode)) {
          isValid = true;
        }
        // Check if starts with + and digits
        else if (/^\+\d+/.test(countryCode)) {
          isValid = true;
        }

        if (!isValid) {
          errors[`row_${index}_countryCode`] = 'Invalid Country Code format';
        }
      }
    });

    setExcelValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getValidationErrorMessage = () => {
    const rowErrors: Record<number, string[]> = {};
    Object.keys(excelValidationErrors).forEach(key => {
      const match = key.match(/row_(\d+)_(phone|email|lastName|duplicate|countryCode)/);
      if (match) {
        const rowIndex = parseInt(match[1]);
        const error = excelValidationErrors[key];
        if (!rowErrors[rowIndex]) rowErrors[rowIndex] = [];
        rowErrors[rowIndex].push(error);
      }
    });
    const errorRows = Object.keys(rowErrors).map(Number).sort((a, b) => a - b);
    if (errorRows.length === 0) return 'Please correct the errors in the Excel file before uploading.';
    const rowNumbers = errorRows.map(row => row + 1);
    if (rowNumbers.length === 1) return `Please correct the errors in row ${rowNumbers[0]} before uploading.`;
    if (rowNumbers.length === 2) return `Please correct the errors in rows ${rowNumbers[0]} & ${rowNumbers[1]} before uploading.`;
    const lastRow = rowNumbers.pop();
    const rowList = rowNumbers.join(', ');
    return `Please correct the errors in rows ${rowList} & ${lastRow} before uploading.`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFile(file);
    setShowPreview(false);
    setExcelData([]);
    setExcelValidationErrors({});
    if (file) parseExcelFile(file);
  };

  const handleBulkUpload = () => {
    if (Object.keys(excelValidationErrors).length > 0) {
      showErrorToast('Please fix validation errors before uploading');
      return;
    }
    if (excelData.length > 0) {
      const newContacts = excelData.map(row => {
        let countryCode = row['Country Code'] || '';
        if (countryCode && typeof countryCode === 'string' && countryCode.includes(' ')) {
          countryCode = countryCode.split(' ')[0];
        } else if (countryCode && typeof countryCode === 'string' && countryCode.startsWith('+')) {
        } else if (countryCode && typeof countryCode === 'string' && /^\d+$/.test(countryCode)) {
          countryCode = `+${countryCode}`;
        } else if (!countryCode && countryCodesData.length > 0) {
          countryCode = countryCodesData[0].value;
        } else if (countryCode && typeof countryCode === 'string') {
          const matchingCode = countryCodesData.find(code => code.value === countryCode || code.label.startsWith(countryCode));
          if (matchingCode) countryCode = matchingCode.value;
        }

        const firstName = row['First Name'] || '';
        const middleName = row['Middle Name'] || '';
        const lastName = row['Last Name'] || '';
        const displayName = generateDisplayName(firstName, middleName, lastName);

        return {
          firstName,
          middleName,
          lastName,
          displayName,
          phone: row['Phone'] ? row['Phone'].replace(/\s+/g, '') : '',
          countryCode,
          email: row['Email'] || '',
          designation: row['Designation'] || '',
          department: row['Department'] ? (Array.isArray(row['Department']) ? row['Department'] : [row['Department']]) : [],
        };
      });

      let updatedContacts;
      if (
        formData.contacts.length > 0 &&
        (!formData.contacts[0].firstName || formData.contacts[0].firstName.trim() === '') &&
        (!formData.contacts[0].lastName || formData.contacts[0].lastName.trim() === '') &&
        (!formData.contacts[0].email || formData.contacts[0].email.trim() === '') &&
        (!formData.contacts[0].phone || formData.contacts[0].phone.trim() === '') &&
        (!formData.contacts[0].designation || formData.contacts[0].designation.trim() === '') &&
        (!formData.contacts[0].department || (Array.isArray(formData.contacts[0].department) && formData.contacts[0].department.length === 0))
      ) {
        if (newContacts.length > 0) {
          updatedContacts = [newContacts[0], ...formData.contacts.slice(1), ...newContacts.slice(1)];
        } else {
          updatedContacts = [...formData.contacts];
        }
      } else {
        updatedContacts = [...formData.contacts, ...newContacts];
      }

      onChange('contacts', updatedContacts);
      setShowBulkModal(false);
      setBulkFile(null);
      setExcelData([]);
      setShowPreview(false);
      setExcelValidationErrors({});
      showSuccessToast('Contacts uploaded successfully');
    }
  };

  // Validation function for contact fields
  const validateContactField = useCallback((idx: number, field: keyof Contact) => {
    const contact = formData.contacts[idx];
    const value = contact[field];

    switch (field) {
      case 'firstName':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'First Name is required';
        }
        return '';

      case 'lastName':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Last Name is required';
        }
        return '';

      case 'countryCode':
        if (!value || value === '') {
          return 'Country Code is required';
        }
        return '';

      case 'phone':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Phone number is required';
        }
        if (typeof value === 'string' && value.length !== 10) {
          return 'Phone number must be exactly 10 digits';
        }
        return '';

      case 'email':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Email is required';
        }
        if (typeof value === 'string') {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
          }
        }
        return '';

      case 'designation':
        if (!value || value === '') {
          return 'Designation is required';
        }
        return '';

      case 'department':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return 'Department is required';
        }
        return '';

      default:
        return '';
    }
  }, [formData.contacts]);

  // Get error for a contact field - only show errors after validation has been triggered
  const getContactFieldError = (idx: number, field: keyof Contact) => {
    if (!validationTriggered) {
      return ''; // Don't show errors until validation is triggered
    }
    const errorKey = `${idx}-${field}`;
    return localErrors[errorKey] || validateContactField(idx, field);
  };

  // Enhanced field change handler that clears errors for the field being updated
  const handleFieldChange = (idx: number, field: keyof Contact, value: any) => {
    const updated = [...formData.contacts];
    updated[idx][field] = value;

    // Auto-update display name when name fields change
    if (shouldUpdateDisplayName(field)) {
      const firstName =
        field === 'firstName' ? value : updated[idx].firstName || '';
      const middleName =
        field === 'middleName' ? value : updated[idx].middleName || '';
      const lastName =
        field === 'lastName' ? value : updated[idx].lastName || '';

      // Use shared utility function to generate display name
      updated[idx].displayName = generateDisplayName(
        firstName,
        middleName,
        lastName
      );
    }

    onChange('contacts', updated);

    // Clear error for this field if it exists
    const errorKey = `${idx}-${field}`;
    if (localErrors[errorKey]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Validate all contacts
  const validateContacts = useCallback(() => {
    const newErrors: Record<string, string> = {};

    formData.contacts.forEach((contact, idx) => {
      // Validate all required fields for this contact
      const fieldsToValidate: (keyof Contact)[] = [
        'firstName',
        'lastName',
        'countryCode',
        'phone',
        'email',
        'designation',
        'department',
      ];

      fieldsToValidate.forEach(field => {
        const error = validateContactField(idx, field);
        if (error) {
          const errorKey = `${idx}-${field}`;
          newErrors[errorKey] = error;
        }
      });
    });

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.contacts, validateContactField]);

  // Create stable navigation handlers using useCallback
  const handleNext = useCallback(() => {
    // Validate contacts before proceeding
    const isContactsValid = validateContacts();

    // If validation fails, trigger validation display and return false
    if (!isContactsValid) {
      setValidationTriggered(true);
      return false;
    }

    // All contacts are valid
    return true;
  }, [validateContacts]);

  const handlePrevious = useCallback(() => {
    // Reset validation state when going back
    setValidationTriggered(false);
    setLocalErrors({});
    return true;
  }, []);

  // Tab navigation logic for Next/Previous buttons (to match BusinessStep pattern)
  useEffect(() => {
    const tabNavigation = {
      handleNext,
      handlePrevious,
    };

    // Store navigation object in formData for FormWizardLayout to use
    onChange('_contactsTabNavigation', tabNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleNext, handlePrevious]); // Only update when handlers change, onChange intentionally excluded to prevent infinite loop

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Text variant="h2" size="lg" weight="bold" className="text-gray-900">
          Contact Details
        </Text>
        <div className="flex gap-2">
          <button
            type="button"
            className="border border-blue-500 text-blue-500 px-3 py-1 rounded"
            onClick={() => {
              const updated = [
                ...formData.contacts,
                {
                  firstName: '',
                  middleName: '',
                  lastName: '',
                  displayName: '',
                  phone: '',
                  countryCode: countryCodesData.length > 0 ? countryCodesData[0].value : '+1',
                  email: '',
                  designation: '',
                  department: [],
                },
              ];
              onChange('contacts', updated);
            }}
          >
            + Add Contact
          </button>
          {/* <button
            type="button"
            className="border border-blue-500 text-blue-500 px-3 py-1 rounded"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Upload
          </button> */}
        </div>
      </div>
      {formData.contacts?.map((contact: Contact, idx: number) => (
        <div
          key={idx}
          className="bg-white rounded shadow p-6 mb-6 border border-gray-200"
        >
          <div className="mb-4 flex items-center justify-between">
            <Text
              variant="span"
              size="base"
              weight="semibold"
              className="text-gray-900"
            >
              Contact {idx + 1}
            </Text>
            {idx > 0 && (
              <button
                type="button"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                onClick={() => {
                  const updated = formData.contacts.filter(
                    (_: Contact, i: number) => i !== idx
                  );
                  onChange('contacts', updated);
                }}
                aria-label="Remove contact"
              >
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <EnhancedInputField
                label="First Name"
                value={contact.firstName}
                onChange={value => handleFieldChange(idx, 'firstName', value)}
                type="text"
                textTransform="capitalize"
                placeholder="Enter first name"
                required
                gridCols=""
              />
              {getContactFieldError(idx, 'firstName') && (
                <span className="text-red-500 text-sm">
                  {getContactFieldError(idx, 'firstName')}
                </span>
              )}
            </div>
            <div>
              <EnhancedInputField
                label="Middle Name"
                value={contact.middleName}
                onChange={value => handleFieldChange(idx, 'middleName', value)}
                type="text"
                textTransform="capitalize"
                placeholder="Enter middle name"
                gridCols=""
              />
            </div>
            <div>
              <EnhancedInputField
                label="Last Name"
                value={contact.lastName}
                onChange={value => handleFieldChange(idx, 'lastName', value)}
                type="text"
                textTransform="capitalize"
                placeholder="Enter last name"
                required
                gridCols=""
              />
              {getContactFieldError(idx, 'lastName') && (
                <span className="text-red-500 text-sm">
                  {getContactFieldError(idx, 'lastName')}
                </span>
              )}
            </div>
            <div>
              <EnhancedInputField
                label="Display Name"
                value={contact.displayName}
                onChange={() => { }} // No-op since it's auto-generated
                type="text"
                placeholder="Auto-generated from first, middle and last name"
                disabled
                textTransform="capitalize"
                readOnly
                helpText="Auto-generated from first, middle and last name"
                gridCols=""
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="w-28">
                  <AsyncSelect
                    isClearable={true}
                    isLoading={countryCodesLoading}
                    options={countryCodesData}
                    value={
                      countryCodesData.find(
                        cc => cc.value === contact.countryCode
                      ) || null
                    }
                    onChange={(option: any) => {
                      if (option) {
                        handleFieldChange(idx, 'countryCode', option.value);
                      } else {
                        // Clear action
                        handleFieldChange(idx, 'countryCode', '');
                      }
                    }}
                    onInputChange={() => {}}
                    placeholder="Search code..."
                    error={getContactFieldError(idx, 'countryCode')}
                    required={true}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10 digit phone number"
                    inputMode="tel"
                    value={contact.phone}
                    onChange={e =>
                      handleFieldChange(idx, 'phone', e.target.value)
                    }
                    className={`w-full h-[42px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getContactFieldError(idx, 'phone')
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                      }`}
                  />
                </div>
              </div>
              {getContactFieldError(idx, 'phone') && (
                <p className="text-red-500 text-sm mt-1">
                  {getContactFieldError(idx, 'phone')}
                </p>
              )}
            </div>
            <div>
              <EnhancedInputField
                label="Email"
                value={contact.email}
                onChange={value => handleFieldChange(idx, 'email', value)}
                type="email"
                textTransform="lowercase"
                placeholder="Enter email address"
                required
                autoComplete="email"
                gridCols=""
              />
              {getContactFieldError(idx, 'email') && (
                <span className="text-red-500 text-sm">
                  {getContactFieldError(idx, 'email')}
                </span>
              )}
            </div>
            <div>
              <SearchDropdown
                label="Designation"
                value={contact.designation}
                onChange={value => {
                  const designationValue = Array.isArray(value)
                    ? value[0]?.value || ''
                    : value?.value || '';
                  handleFieldChange(idx, 'designation', designationValue);
                }}
                options={designationOptions}
                placeholder={
                  designationLoading
                    ? 'Loading designations...'
                    : 'Select Designation'
                }
                required
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    searchDesignation(input);
                  }
                }}
                error={getContactFieldError(idx, 'designation')}
                showAddButton={true}
                dropdownType="Designation"
                dropdownLabel="Designation"
              />
            </div>
            <div>
              <SearchDropdown
                label="Department"
                value={contact.department || []}
                onChange={value => {
                  const departmentValue = Array.isArray(value)
                    ? value.map(v => v.value)
                    : value?.value
                      ? [value.value]
                      : [];
                  handleFieldChange(idx, 'department', departmentValue);
                }}
                options={departmentOptions}
                placeholder={
                  departmentLoading
                    ? 'Loading departments...'
                    : 'Select Departments'
                }
                required
                isMulti
                isSearchable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    searchDepartment(input);
                  }
                }}
                error={getContactFieldError(idx, 'department')}
                showAddButton={true}
                dropdownType="Department"
                dropdownLabel="Department"
              />
            </div>
          </div>
        </div>
      ))}
      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-semibold">Bulk Upload Contacts</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkFile(null);
                  setExcelData([]);
                  setShowPreview(false);
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">Download the Excel template, enter the contact details, and upload the completed file here.</p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-center justify-center">
                  <button onClick={downloadExcelTemplate} type="button" className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    Download Excel Template
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <label className="flex items-center justify-center w-full cursor-pointer">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="bulk-upload-input" />
                    <div className="flex items-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition w-full justify-center">
                      <span className="font-medium">Choose File</span>
                      <span className="text-gray-500">{bulkFile ? bulkFile.name : 'No File Chosen'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {showPreview && excelData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Preview Data ({excelData.length} records)</h3>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelData.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowIndex + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['First Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Middle Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Last Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Display Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(() => { const countryCode = String(row['Country Code'] || ''); if (!countryCode) return ''; if (countryCode.startsWith('+')) return countryCode; if (/^\d+$/.test(countryCode)) return `+${countryCode}`; return countryCode; })()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(() => { const phone = String(row['Phone'] || ''); return phone.replace(/\s+/g, ''); })()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Email'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Designation'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Department'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex flex-col">
                                {excelValidationErrors[`row_${rowIndex}_duplicate`] && (<span className="text-red-500 text-xs">{excelValidationErrors[`row_${rowIndex}_duplicate`]}</span>)}
                                {excelValidationErrors[`row_${rowIndex}_lastName`] && (<span className="text-red-500 text-xs">{excelValidationErrors[`row_${rowIndex}_lastName`]}</span>)}
                                {excelValidationErrors[`row_${rowIndex}_phone`] && (<span className="text-red-500 text-xs">{excelValidationErrors[`row_${rowIndex}_phone`]}</span>)}
                                {excelValidationErrors[`row_${rowIndex}_email`] && (<span className="text-red-500 text-xs">{excelValidationErrors[`row_${rowIndex}_email`]}</span>)}
                                {excelValidationErrors[`row_${rowIndex}_countryCode`] && (<span className="text-red-500 text-xs">{excelValidationErrors[`row_${rowIndex}_countryCode`]}</span>)}
                                {!excelValidationErrors[`row_${rowIndex}_duplicate`] && !excelValidationErrors[`row_${rowIndex}_lastName`] && !excelValidationErrors[`row_${rowIndex}_phone`] && !excelValidationErrors[`row_${rowIndex}_email`] && !excelValidationErrors[`row_${rowIndex}_countryCode`] && (<span className="text-green-500 text-xs">Valid</span>)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {Object.keys(excelValidationErrors).length > 0 && (
                    <div className="mt-4 p-4">
                      <h4 className="text-red-800 font-medium">Validation Errors Found</h4>
                      <p className="text-red-600 text-sm mt-1">{getValidationErrorMessage()}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button className={`px-8 py-2.5 rounded-lg font-medium transition ${bulkFile && excelData.length > 0 && Object.keys(excelValidationErrors).length === 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} disabled={!bulkFile || excelData.length === 0 || Object.keys(excelValidationErrors).length > 0} onClick={handleBulkUpload}>Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactsStep;