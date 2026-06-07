import React, { useEffect, useState, useCallback } from 'react';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import AsyncSelect from '../../atoms/AsyncSelect';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import Text from '../../atoms/Text/Text';
import Icon from '../../atoms/Icon/Icon';
import {
  generateDisplayName,
  shouldUpdateDisplayName,
} from './utils/nameUtils';
import { apiCall, API_ENDPOINTS, clientsAPI } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { showErrorToast } from '../../../utils/toast';

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
  const [designations, setDesignations] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [departments, setDepartments] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]); // Store parsed Excel data
  const [showPreview, setShowPreview] = useState(false); // Show preview table
  // Add state for validation errors in Excel data
  const [excelValidationErrors, setExcelValidationErrors] = useState<Record<string, string>>({});
  const [isBulkValidating, setIsBulkValidating] = useState(false);

  // Validation state - for deferred validation like BusinessStep
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);

  // Async duplicate validation state (API check)
  const [validatingFields, setValidatingFields] = useState<Record<string, boolean>>({});
  const [duplicateErrors, setDuplicateErrors] = useState<Record<string, string>>({});

  // Local duplicate validation state (within form contacts)
  const [localDuplicateErrors, setLocalDuplicateErrors] = useState<Record<string, string>>({});

  const debouncedCheckDuplicates = useDebouncedCallback(async (idx: number, field: 'email' | 'phone', value: string, countryCode?: string) => {
    if (!value || value.trim() === '') return;

    const fieldKey = `${idx}-${field}`;

    // Set loading state when the debounced function actually runs
    setValidatingFields(prev => ({ ...prev, [fieldKey]: true }));

    try {
      const params: any = {};
      if (field === 'email') params.email = value;
      if (field === 'phone') {
        // Combine country code and phone number for validation
        // Remove any spaces or special characters from phone
        const cleanPhone = value.replace(/\D/g, '');
        // Format: +919581430333 (assuming countryCode already includes +)
        const formattedPhone = countryCode ? `${countryCode}${cleanPhone}` : value;
        params.phone = formattedPhone;
        console.log('Checking duplicate phone:', formattedPhone);
      }

      const response = await clientsAPI.checkDuplicates(params);

      setDuplicateErrors(prev => {
        const newErrors = { ...prev };
        if (response.found) {
          newErrors[fieldKey] = field === 'email'
            ? 'Email already exists'
            : 'Phone number already exists';
        } else {
          delete newErrors[fieldKey];
        }
        return newErrors;
      });
    } catch (error) {
      console.error('Error checking contacts duplicates:', error);
    } finally {
      setValidatingFields(prev => ({ ...prev, [fieldKey]: false }));
    }
  }, 800);

  // Country codes state from API
  const [countryCodesData, setCountryCodesData] = useState<
    { value: string; label: string }[]
  >([]);
  const [countryCodesLoading, setCountryCodesLoading] = useState(false);

  const portalTarget =
    typeof window !== 'undefined' ? document.body : undefined;

  // Fetch designation options from API with optional search (internal function)
  const fetchDesignationOptionsInternal = async (searchTerm: string = '') => {
    setLoadingDesignations(true);
    try {
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Designation')
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
          (designation: { id: string; name: string }) => ({
            value: designation.name,
            label: designation.name,
          })
        );
        setDesignations(options);
      }
    } catch (error) {
      console.error('Error fetching designation options:', error);
      setDesignations([]);
    } finally {
      setLoadingDesignations(false);
    }
  };

  // Fetch department options from API with optional search (internal function)
  const fetchDepartmentOptionsInternal = async (searchTerm: string = '') => {
    setLoadingDepartments(true);
    try {
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Department')
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
          (department: { id: string; name: string }) => ({
            value: department.name,
            label: department.name,
          })
        );
        setDepartments(options);
      }
    } catch (error) {
      console.error('Error fetching department options:', error);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Debounced search functions
  const debouncedFetchDesignation = useDebouncedCallback(
    fetchDesignationOptionsInternal,
    500
  );
  const debouncedFetchDepartment = useDebouncedCallback(
    fetchDepartmentOptionsInternal,
    500
  );

  // Download Excel Template with dropdowns
  const downloadExcelTemplate = async () => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Contacts');

      // Define columns
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

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Fetch all designations (without limit for template)
      const designationUrl = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Designation')
      );
      designationUrl.searchParams.append('limit', '1000'); // Get all
      const designationResponse = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(designationUrl.pathname + designationUrl.search);
      const designationList =
        designationResponse.data?.data?.map((d: any) => d.name) || [];

      // Fetch all departments (without limit for template)
      const departmentUrl = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Department')
      );
      departmentUrl.searchParams.append('limit', '1000'); // Get all
      const departmentResponse = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(departmentUrl.pathname + departmentUrl.search);
      const departmentList =
        departmentResponse.data?.data?.map((d: any) => d.name) || [];

      // Add data validation for Designation column (column 8)
      if (designationList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          // Apply to rows 2-1000
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

      // Add data validation for Designation column (column 9)
      if (designationList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          // Apply to rows 2-1000
          const cell = worksheet.getCell(`I${i}`);
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

      // Add data validation for Department column (column 10)
      if (departmentList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          // Apply to rows 2-1000
          const cell = worksheet.getCell(`J${i}`);
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

      // Add data validation for Country Code column (column 5)
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

      // Add instructions in a note
      (worksheet.getCell('A2') as any).note =
        'Fill in the contact details. Display Name is optional (will be auto-generated). Use dropdowns for Designation and Department.';

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Format current date as DD-MM-YYYY
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      // Download file
      saveAs(blob, `Bulk_contacts_${formattedDate}.xlsx`);

      console.log(
        'Excel template downloaded successfully with latest dropdown data'
      );
    } catch (error) {
      console.error('Error generating Excel template:', error);
      showErrorToast('Failed to generate Excel template. Please try again.');
    }
  };

  // Parse Excel file and extract data
  const parseExcelFile = async (file: File) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file');
      }

      const rows: any[] = [];
      const headers: string[] = [];

      // Get headers from the first row
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers.push(cell.value as string);
      });

      // Get data from subsequent rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            // Handle different cell value types properly
            let cellValue = cell.value;
            if (cellValue !== null && typeof cellValue === 'object') {
              // Handle rich text and other object types
              if (
                'richText' in cellValue &&
                Array.isArray(cellValue.richText)
              ) {
                cellValue = cellValue.richText
                  .map((rt: any) => rt.text)
                  .join('');
              } else if (
                'text' in cellValue &&
                typeof cellValue.text === 'string'
              ) {
                cellValue = cellValue.text;
              } else if (
                'result' in cellValue &&
                cellValue.result !== undefined
              ) {
                cellValue = (cellValue as any).result;
              } else if (cellValue instanceof Date) {
                cellValue = cellValue.toString();
              } else {
                // For other object types, try to get a string representation
                cellValue = JSON.stringify(cellValue);
              }
            } else if (cellValue === null || cellValue === undefined) {
              cellValue = '';
            } else {
              // Convert to string if it's not already
              cellValue = String(cellValue);
            }
            rowData[header] = cellValue;

            // Capitalize First Name, Middle Name, and Last Name
            if (
              ['First Name', 'Middle Name', 'Last Name'].includes(header) &&
              typeof cellValue === 'string' &&
              cellValue.trim() !== ''
            ) {
              rowData[header] =
                cellValue.charAt(0).toUpperCase() +
                cellValue.slice(1).toLowerCase();
            }
          }
        });

        // Only add rows that have data
        if (
          Object.values(rowData).some(
            val => val !== null && val !== undefined && val !== ''
          )
        ) {
          rows.push(rowData);
        }
      });

      setExcelData(rows);
      setShowPreview(true);

      // Validate the parsed data
      await validateBulkData(rows);

      return rows;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      showErrorToast(
        'Failed to parse Excel file. Please make sure it follows the template format.'
      );
      return [];
    }
  };

  // Validate Excel data for phone and email formats (Sync & Async)
  const validateBulkData = async (data: any[]) => {
    setIsBulkValidating(true);
    const errors: Record<string, string> = {};

    // 1. Synchronous Checks (Format & Intra-file Duplicates)
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    // Get existing contacts for local duplicate check
    // For AddClient, we check against formData.contacts
    const existingContacts = formData?.contacts || [];

    data.forEach((row, index) => {
      // Create a unique identifier for duplicate checking within file
      const email = (row['Email'] || '').toLowerCase().trim();
      const phoneRaw = (row['Phone'] || '').toString();
      const phone = phoneRaw.replace(/\D/g, ''); // Remove non-digits

      // Check for duplicates within the file (Intra-file)
      if (email && seenEmails.has(email)) {
        errors[`row_${index}_email`] = 'Duplicate email in file';
      }
      if (email) seenEmails.add(email);

      if (phone && seenPhones.has(phone)) {
        errors[`row_${index}_phone`] = 'Duplicate phone in file';
      }
      if (phone) seenPhones.add(phone);


      // Check for duplicates against existing contacts (Local Check)
      let localEmailDup = false;
      let localPhoneDup = false;

      existingContacts.forEach(existing => {
        const existingEmail = (existing.email || '').toLowerCase().trim();
        const existingPhoneRaw = (existing.phone || '').toString();
        // Extract last 10 digits for comparison
        const existingPhone = existingPhoneRaw.replace(/\D/g, '').slice(-10);
        const newPhone = phone.slice(-10);

        if (email && existingEmail === email) localEmailDup = true;
        if (phone && newPhone && existingPhone === newPhone) localPhoneDup = true;
      });

      // Note: In Add Client flow, formData might contain empty initial contact, ignore it if empty
      const isInitialEmpty = existingContacts.length === 1 && !existingContacts[0].email && !existingContacts[0].phone;

      if (!isInitialEmpty) {
        if (localEmailDup && localPhoneDup) {
          errors[`row_${index}_duplicate`] = 'Email & Phone already exist in form';
        } else if (localEmailDup) {
          errors[`row_${index}_email`] = 'Email already exists in form';
        } else if (localPhoneDup) {
          errors[`row_${index}_phone`] = 'Phone already exists in form';
        }
      }

      // Validate Last Name
      const lastName = row['Last Name'] || '';
      if (!lastName || lastName.trim() === '') {
        errors[`row_${index}_lastName`] = 'Last Name is required';
      }

      // Validate phone number
      if (phoneRaw && phoneRaw.trim()) {
        if (phone.length !== 10) {
          errors[`row_${index}_phone`] = 'Phone must be exactly 10 digits';
        }
      } else {
        errors[`row_${index}_phone`] = 'Phone is required';
      }

      // Validate email
      const emailValue = row['Email'] || '';
      if (emailValue && emailValue.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          errors[`row_${index}_email`] = 'Invalid email format';
        }
      } else {
        errors[`row_${index}_email`] = 'Email is required';
      }

      // Validate Country Code
      const countryCode = String(row['Country Code'] || '').trim();
      if (countryCode) {
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
          errors[`row_${index}_countryCode`] = 'Invalid Country Code';
        }
      }
    });

    // Update errors with synchronous findings first
    setExcelValidationErrors(errors);

    // 2. Asynchronous Checks (Remote DB Duplicates)
    // Only check rows that don't already have errors
    const rowsToCheck = data.map((row, index) => ({ row, index })).filter(({ index }) => {
      // Skip if row already has a duplicate error or invalid format
      return !errors[`row_${index}_duplicate`] &&
        !errors[`row_${index}_email`] &&
        !errors[`row_${index}_phone`];
    });

    if (rowsToCheck.length > 0) {
      try {
        const checkPromises = rowsToCheck.map(async ({ row, index }) => {
          const email = (row['Email'] || '').trim();
          const phone = (row['Phone'] || '').toString().replace(/\D/g, '');
          const countryCode = (row['Country Code'] || '').toString().trim();

          // Format phone with country code for API if available
          let formattedPhone = phone;
          if (countryCode && phone) {
            let cleanCode = countryCode.split(' ')[0]; // Handle "+91 (India)"
            if (!cleanCode.startsWith('+') && /^\d+$/.test(cleanCode)) {
              cleanCode = `+${cleanCode}`;
            }
            formattedPhone = `${cleanCode}${phone}`;
          }

          if (email || phone) {
            try {
              const response = await clientsAPI.checkDuplicates({
                email: email,
                phone: formattedPhone,
              });

              if (response.found) {
                // Determine specific error based on duplicates returned
                const duplicates = response.duplicates || [];
                let emailMatch = false;
                let phoneMatch = false;

                if (duplicates.length > 0) {
                  duplicates.forEach(dup => {
                    if (dup.contacts) {
                      dup.contacts.forEach(c => {
                        if (c.email?.toLowerCase() === email.toLowerCase()) emailMatch = true;
                        // Check phone match
                        const dbPhone = (c.phone_no || '').replace(/\D/g, '').slice(-10);
                        const inputPhone = phone.slice(-10);
                        if (inputPhone && dbPhone === inputPhone) phoneMatch = true;
                      });
                    }
                  });
                } else {
                  return { index, error: 'Already exists in system', field: 'duplicate' };
                }

                if (emailMatch && phoneMatch) {
                  return { index, error: 'Already exists in system', field: 'duplicate' };
                } else if (emailMatch) {
                  return { index, error: 'Email already exists', field: 'email' };
                } else if (phoneMatch) {
                  return { index, error: 'Phone Number already exists', field: 'phone' };
                } else {
                  return { index, error: 'Already exists in system', field: 'duplicate' };
                }
              }
            } catch (err) {
              console.error(`Error checking duplicate for row ${index}:`, err);
            }
          }
          return null;
        });

        const results = await Promise.all(checkPromises);

        // Merge async errors
        const newErrors = { ...errors };
        results.forEach(result => {
          if (result) {
            if (result.field === 'email') {
              newErrors[`row_${result.index}_email`] = result.error;
            } else if (result.field === 'phone') {
              newErrors[`row_${result.index}_phone`] = result.error;
            } else {
              newErrors[`row_${result.index}_duplicate`] = result.error;
            }
          }
        });

        setExcelValidationErrors(newErrors);

      } catch (error) {
        console.error('Error during async validation:', error);
      }
    }

    setIsBulkValidating(false);
  };

  // Generate validation error message with specific row numbers
  const getValidationErrorMessage = () => {
    const rowErrors: Record<number, string[]> = {};

    // Group errors by row number
    Object.keys(excelValidationErrors).forEach(key => {
      const match = key.match(/row_(\d+)_(phone|email|lastName|duplicate|countryCode)/);
      if (match) {
        const rowIndex = parseInt(match[1]);
        const error = excelValidationErrors[key];

        if (!rowErrors[rowIndex]) {
          rowErrors[rowIndex] = [];
        }
        rowErrors[rowIndex].push(error);
      }
    });

    // Get unique row numbers with errors
    const errorRows = Object.keys(rowErrors).map(Number).sort((a, b) => a - b);

    if (errorRows.length === 0) {
      return 'Please correct the errors in the Excel file before uploading.';
    }

    // Format row numbers (1-based indexing for user display)
    const rowNumbers = errorRows.map(row => row + 1);

    if (rowNumbers.length === 1) {
      return `Please correct the errors in row ${rowNumbers[0]} before uploading.`;
    } else if (rowNumbers.length === 2) {
      return `Please correct the errors in rows ${rowNumbers[0]} & ${rowNumbers[1]} before uploading.`;
    } else {
      const lastRow = rowNumbers.pop();
      const rowList = rowNumbers.join(', ');
      return `Please correct the errors in rows ${rowList} & ${lastRow} before uploading.`;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFile(file);
    setShowPreview(false);
    setExcelData([]);
    setExcelValidationErrors({}); // Clear previous validation errors

    if (file) {
      parseExcelFile(file);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = () => {
    // Check if there are validation errors before proceeding
    if (Object.keys(excelValidationErrors).length > 0) {
      showErrorToast('Please fix validation errors before uploading');
      return;
    }

    if (excelData.length > 0) {
      // Convert Excel data to contact format
      const newContacts = excelData.map(row => {
        // Extract country code from the formatted string (e.g., "+91 (India)" -> "+91")
        let countryCode = row['Country Code']
          ? String(row['Country Code']).trim()
          : '';
        if (countryCode && countryCode.includes(' ')) {
          // Extract just the dial code part before the space
          countryCode = countryCode.split(' ')[0];
        } else if (countryCode && countryCode.startsWith('+')) {
          // Already in the correct format (e.g., "+91")
          // Keep as is
        } else if (countryCode && /^\d+$/.test(countryCode)) {
          // If it's numeric without + prefix, add + prefix
          countryCode = `+${countryCode}`;
        } else if (!countryCode && countryCodesData.length > 0) {
          // Use default country code if none provided
          countryCode = countryCodesData[0].value;
        } else if (countryCode && typeof countryCode === 'string') {
          // Check if it matches any of our known country codes
          const matchingCode = countryCodesData.find(code =>
            code.value === countryCode || code.label.startsWith(countryCode)
          );
          if (matchingCode) {
            countryCode = matchingCode.value;
          }
        }

        const firstName = row['First Name'] || '';
        const middleName = row['Middle Name'] || '';
        const lastName = row['Last Name'] || '';

        // Generate display name from first, middle, and last names
        const displayName = generateDisplayName(firstName, middleName, lastName);

        return {
          firstName,
          middleName,
          lastName,
          displayName,
          // Remove spaces from phone number
          phone: row['Phone'] ? row['Phone'].replace(/\s+/g, '') : '',
          countryCode,
          email: row['Email'] || '',
          designation: row['Designation'] || '',
          department: row['Department']
            ? Array.isArray(row['Department'])
              ? row['Department']
              : [row['Department']]
            : [],
        };
      });

      // Check if Contact 1 is completely empty and we have new contacts to upload
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
        // Contact 1 is empty, replace it with the first new contact and append the rest
        if (newContacts.length > 0) {
          updatedContacts = [newContacts[0], ...formData.contacts.slice(1), ...newContacts.slice(1)];
        } else {
          updatedContacts = [...formData.contacts];
        }
      } else {
        // Append new contacts to existing contacts
        updatedContacts = [...formData.contacts, ...newContacts];
      }

      onChange('contacts', updatedContacts);

      // Close modal and reset state
      setShowBulkModal(false);
      setBulkFile(null);
      setExcelData([]);
      setShowPreview(false);
      setExcelValidationErrors({}); // Clear validation errors
    }
  };

  // Fetch country codes from API
  useEffect(() => {
    const fetchCountryCodes = async () => {
      setCountryCodesLoading(true);
      try {
        const response = await fetch(
          'https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries/codes'
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

  // Load initial data on mount
  useEffect(() => {
    fetchDesignationOptionsInternal();
    fetchDepartmentOptionsInternal();
  }, []);

  useEffect(() => {
    // Only create default contact if there are no contacts and we're not in the middle of a bulk upload
    if ((!formData.contacts || formData.contacts.length === 0) && !showBulkModal) {
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
  }, [formData.contacts, onChange, showBulkModal]);

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
    // Shallow copy the specific contact object to avoid mutating the original reference
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto-update display name when name fields change
    if (shouldUpdateDisplayName(field)) {
      const firstName =
        field === 'firstName' ? value : updated[idx].firstName || '';
      const middleName =
        field === 'middleName' ? value : updated[idx].middleName || '';
      const lastName =
        field === 'lastName' ? value : updated[idx].lastName || '';
      const contactObj = updated[idx];

      // Use shared utility function to generate display name
      updated[idx] = {
        ...contactObj,
        displayName: generateDisplayName(firstName, middleName, lastName),
      };
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

    // Check for local duplicates (within the form contacts)
    if (field === 'email' || field === 'phone' || field === 'countryCode') {
      const newLocalDuplicateErrors: Record<string, string> = {};

      // Check ALL contacts for BOTH email and phone duplicates
      updated.forEach((contact, contactIdx) => {
        // Check email duplicates
        if (contact.email && contact.email.trim()) {
          const duplicateIndices = updated
            .map((c, i) => ({ contact: c, index: i }))
            .filter(({ contact: c, index: i }) =>
              i !== contactIdx &&
              c.email &&
              c.email.trim().toLowerCase() === contact.email.trim().toLowerCase()
            );

          if (duplicateIndices.length > 0) {
            newLocalDuplicateErrors[`${contactIdx}-email`] = 'This email is already used in another contact';
          }
        }

        // Check phone duplicates
        if (contact.phone && contact.phone.trim()) {
          const fullPhone = `${contact.countryCode}${contact.phone.replace(/\D/g, '')}`;
          const duplicateIndices = updated
            .map((c, i) => ({ contact: c, index: i }))
            .filter(({ contact: c, index: i }) => {
              if (i === contactIdx) return false;
              const otherFullPhone = `${c.countryCode}${c.phone.replace(/\D/g, '')}`;
              return otherFullPhone === fullPhone;
            });

          if (duplicateIndices.length > 0) {
            newLocalDuplicateErrors[`${contactIdx}-phone`] = 'This phone number is already used in another contact';
          }
        }
      });

      setLocalDuplicateErrors(newLocalDuplicateErrors);
    }

    // Trigger duplicate check for email, phone, or countryCode changes
    if (field === 'email' || field === 'phone' || field === 'countryCode') {
      // Determine which field to validate
      const validationField = field === 'email' ? 'email' : 'phone';
      const fieldKey = `${idx}-${validationField}`;

      // If updating countryCode, we want to validate the PHONE number
      const valueToValidate = field === 'phone' ? value : updated[idx].phone;
      const currentCountryCode = field === 'countryCode' ? value : updated[idx].countryCode;

      // Clear previous duplicate error immediately (for the target field)
      setDuplicateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });

      if (field === 'email') {
        // Trigger debounced validation for email
        if (value && typeof value === 'string' && value.trim() !== '') {
          debouncedCheckDuplicates(idx, 'email', value);
        } else {
          // Clear loading state if email is empty
          setValidatingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
      } else {
        // Phone validation (triggered by phone OR countryCode change)
        if (valueToValidate && typeof valueToValidate === 'string' && valueToValidate.trim().length >= 10) {
          // Pass country code for phone validation
          debouncedCheckDuplicates(idx, 'phone', valueToValidate, currentCountryCode);
        } else {
          // Clear loading state if phone is too short
          setValidatingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
      }
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

    // Check format validation errors, API duplicate errors, AND local duplicate errors
    const hasFormatErrors = Object.keys(newErrors).length > 0;
    const hasDuplicateErrors = Object.keys(duplicateErrors).length > 0;
    const hasLocalDuplicateErrors = Object.keys(localDuplicateErrors).length > 0;

    return !hasFormatErrors && !hasDuplicateErrors && !hasLocalDuplicateErrors;
  }, [formData.contacts, validateContactField, duplicateErrors, localDuplicateErrors]);

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
                  division: [],
                },
              ];
              onChange('contacts', updated);
            }}
          >
            + Add Contact
          </button>
          <button
            type="button"
            className="border border-blue-500 text-blue-500 px-3 py-1 rounded"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Upload
          </button>
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
                  <div className="relative">
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10 digit phone number"
                      inputMode="tel"
                      value={contact.phone}
                      onChange={e =>
                        handleFieldChange(idx, 'phone', e.target.value)
                      }
                      className={`w-full h-[42px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(getContactFieldError(idx, 'phone') || duplicateErrors[`${idx}-phone`] || localDuplicateErrors[`${idx}-phone`])
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                        } ${validatingFields[`${idx}-phone`] ? 'pr-10' : ''}`}
                    />
                    {validatingFields[`${idx}-phone`] && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {(getContactFieldError(idx, 'phone') || duplicateErrors[`${idx}-phone`] || localDuplicateErrors[`${idx}-phone`]) && (
                <p className="text-red-500 text-sm mt-1">
                  {getContactFieldError(idx, 'phone') || duplicateErrors[`${idx}-phone`] || localDuplicateErrors[`${idx}-phone`]}
                </p>
              )}
              {!validatingFields[`${idx}-phone`] && !duplicateErrors[`${idx}-phone`] && !localDuplicateErrors[`${idx}-phone`] && !getContactFieldError(idx, 'phone') && contact.phone?.length === 10 && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <span>✓</span> Phone number is Valid
                </p>
              )}
            </div>
            <div>
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
                  error={getContactFieldError(idx, 'email') || duplicateErrors[`${idx}-email`] || localDuplicateErrors[`${idx}-email`]}
                  loading={validatingFields[`${idx}-email`]}
                />
                {!validatingFields[`${idx}-email`] && !duplicateErrors[`${idx}-email`] && !localDuplicateErrors[`${idx}-email`] && !getContactFieldError(idx, 'email') && contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <span>✓</span> Email is Valid
                  </p>
                )}
              </div>
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
                options={designations}
                placeholder={
                  loadingDesignations
                    ? 'Loading designations...'
                    : 'Select Designation'
                }
                required
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    debouncedFetchDesignation(input);
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
                options={departments}
                placeholder={
                  loadingDepartments
                    ? 'Loading departments...'
                    : 'Select Departments'
                }
                required
                isMulti
                isSearchable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    debouncedFetchDepartment(input);
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
            {/* Modal Header */}
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Download the Excel template, enter the contact details, and
                upload the completed file here.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Download Template Button */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={downloadExcelTemplate}
                    type="button"
                    className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download Excel Template
                  </button>
                </div>

                {/* File Upload */}
                <div className="flex items-center justify-center">
                  <label className="flex items-center justify-center w-full cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="bulk-upload-input"
                    />
                    <div className="flex items-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition w-full justify-center">
                      <span className="font-medium">Choose File</span>
                      <span className="text-gray-500">
                        {bulkFile ? bulkFile.name : 'No File Chosen'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              {showPreview && excelData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Preview Data ({excelData.length} records)
                  </h3>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {/* Add Sr. No. column header */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sr. No.
                          </th>
                          {/* Explicitly define column headers to ensure consistent order and visibility */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            First Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Middle Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Display Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Country Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Designation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          {/* Add validation column header */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Validation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelData.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={
                              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }
                          >
                            {/* Add Sr. No. column */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rowIndex + 1}
                            </td>
                            {/* Explicitly define cell values to match header order */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['First Name'] || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['Middle Name'] || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['Last Name'] || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['Display Name'] || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {/* Format country code to always show with + prefix */}
                              {(() => {
                                const countryCode = String(row['Country Code'] || '');
                                if (!countryCode) return '';
                                // If it already starts with +, return as is
                                if (countryCode.startsWith('+')) return countryCode;
                                // If it's numeric, add + prefix
                                if (/^\d+$/.test(countryCode)) return `+${countryCode}`;
                                // Otherwise return as is
                                return countryCode;
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                // Remove spaces from phone number for display
                                const phone = String(row['Phone'] || '');
                                return phone.replace(/\s+/g, '');
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['Email'] || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['Designation'] || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(row['Department'] || '')}
                            </td>
                            {/* Add validation column */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex flex-col">
                                {excelValidationErrors[`row_${rowIndex}_duplicate`] && (
                                  <span className="text-red-500 text-xs">
                                    {excelValidationErrors[`row_${rowIndex}_duplicate`]}
                                  </span>
                                )}
                                {excelValidationErrors[`row_${rowIndex}_lastName`] && (
                                  <span className="text-red-500 text-xs">
                                    {excelValidationErrors[`row_${rowIndex}_lastName`]}
                                  </span>
                                )}
                                {excelValidationErrors[`row_${rowIndex}_phone`] && (
                                  <span className="text-red-500 text-xs">
                                    {excelValidationErrors[`row_${rowIndex}_phone`]}
                                  </span>
                                )}
                                {excelValidationErrors[`row_${rowIndex}_email`] && (
                                  <span className="text-red-500 text-xs">
                                    {excelValidationErrors[`row_${rowIndex}_email`]}
                                  </span>
                                )}
                                {excelValidationErrors[`row_${rowIndex}_countryCode`] && (
                                  <span className="text-red-500 text-xs">
                                    {excelValidationErrors[`row_${rowIndex}_countryCode`]}
                                  </span>
                                )}
                                {!excelValidationErrors[`row_${rowIndex}_duplicate`] &&
                                  !excelValidationErrors[`row_${rowIndex}_lastName`] &&
                                  !excelValidationErrors[`row_${rowIndex}_phone`] &&
                                  !excelValidationErrors[`row_${rowIndex}_email`] &&
                                  !excelValidationErrors[`row_${rowIndex}_countryCode`] && (
                                    isBulkValidating ? (
                                      <span className="text-blue-500 text-xs flex items-center gap-1">
                                        <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        Checking...
                                      </span>
                                    ) : (
                                      <span className="text-green-500 text-xs">Valid</span>
                                    )
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Show validation summary */}
                  {Object.keys(excelValidationErrors).length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-red-800 font-medium">Validation Errors Found</h4>
                      <p className="text-red-600 text-sm mt-1">
                        {getValidationErrorMessage()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button - Centered at bottom */}
              <div className="mt-8 flex justify-center">
                <button
                  className={`px-8 py-2.5 rounded-lg font-medium transition ${bulkFile && excelData.length > 0 && Object.keys(excelValidationErrors).length === 0 && !isBulkValidating
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  disabled={!bulkFile || excelData.length === 0 || Object.keys(excelValidationErrors).length > 0 || isBulkValidating}
                  onClick={handleBulkUpload}
                >
                  {isBulkValidating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Validating...
                    </span>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactsStep;
