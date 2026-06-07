import React, { useState } from 'react';
import { useDebounce, useDebouncedCallback } from '../../../hooks/useDebounce';
import { usePermissions } from '../../../hooks/usePermissions';
import AsyncSelect from '../../atoms/AsyncSelect';
import FileUpload from '../../molecules/FileUpload';
import SearchBox from '../../atoms/SearchBox';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { formatPhoneNumber } from '../../../utils/textUtils';
import { useAuth } from '../../auth/AuthContext';

import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../organisms/BreadCrumb';
import DetailHeader from '../../organisms/DetailHeader';
import DetailTemplate from '../../templates/DetailTemplate';
import Text from '../../atoms/Text';
import DataTable from '../../molecules/DataTable';
import Card from '../../molecules/Card';
import EditModal from '../../molecules/EditModal';
import EnhancedInputField from '../../molecules/EnhancedInputField';
import CountryStateCity from '../../molecules/CountryStateCity';
import SearchDropdown from '../../molecules/SearchDropdown';
import AvatarUpload from '../../molecules/AvatarUpload';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import { API_ENDPOINTS, useSWR, apiCall } from '../../../utils/api';
import { Client, ClientsResponse } from '../../../utils/api/types';
import { clientsAPI } from '../../../utils/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import FileUploadService from '../../../services/fileUploadService';
import { formatUIDate } from '../../../utils/dateFormat';

const ClientDetailPage: React.FC = () => {
  // Initialize permissions hook
  const { canUpdateClients, loading: permissionsLoading } = usePermissions();
  const { user } = useAuth();

  // Department dropdown logic for contacts
  const [departmentSearch, setDepartmentSearch] = useState('');
  const departmentUrl = `/client/dropdowns/Department?page=1&limit=100${departmentSearch ? `&search=${encodeURIComponent(departmentSearch)}` : ''}`;
  const { data: departmentsData } = useSWR(departmentUrl);
  const departmentOptions =
    departmentsData && Array.isArray((departmentsData as any).data)
      ? (departmentsData as any).data.map((department: any) => ({
        value: department.name,
        label: department.name,
      }))
      : [];
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clientContacts');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [searchContact, setSearchContact] = useState('');
  const [searchDocument, setSearchDocument] = useState('');
  // Pagination states for contacts
  const [contactsCurrentPage, setContactsCurrentPage] = useState(1);
  const contactsPerPage = 5;

  // Fetch related clients filtered by msp_type: "MSP"
  const relatedClientsUrl = `/client/?msp_type=MSP`;
  const { data: relatedClientsData, loading: relatedClientsLoading } =
    useSWR<ClientsResponse>(relatedClientsUrl);

  // Process related clients data for the table
  const relatedClientsTableData =
    relatedClientsData?.Client?.map((client: Client) => ({
      id: client.id, // Add the id field for navigation
      client_id: client.client_id || 'N/A',
      client_name: client.client_name || 'N/A',
      client_code: client.client_code || 'N/A',
      msp_type: client.msp_type || 'N/A',
      associate_msp: client.associate_msp || 'N/A',
      client_website: client.client_website || 'N/A',
      industry: client.industry || 'N/A',
      location:
        `${client.client_city || ''}, ${client.client_state || ''}`.replace(
          /^,\s*|,\s*$/g,
          ''
        ) || 'N/A',
      ownership: client.ownership || 'N/A',
      client_status: client.client_status || 'N/A',
      contract_type:
        client.contracts?.map(c => c.contract_type).join(', ') || 'N/A',
      primary_contact:
        client.contacts && client.contacts.length > 0
          ? `${client.contacts[0].first_name || ''} ${client.contacts[0].last_name || ''}`.trim() ||
          client.contacts[0].display_name ||
          'N/A'
          : 'N/A',
      created_by: client.created_by || 'N/A',
      created: client.created
        ? new Date(client.created).toLocaleDateString()
        : 'N/A',
    })) || [];

  // Edit client modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    client_name: '',
    client_id: '',
    client_code: '',
    client_logo: null as File | null,
    client_logo_preview: '',
    billing_attention: '',
    billing_country: '',
    billing_state: '',
    billing_city: '',
    billing_street1: '',
    billing_street2: '',
    registered_pin_code: '',
    billing_postal_code: '',
    billing_phone: '',
    website: '',
    client_portal: '',
    status: '',
    // New fields for registered address
    client_registered_address: '',
    client_country: '',
    client_state: '',
    client_city: '',
    // Client display name field
    client_display_name: '',
  });  // Client Information edit modal states
  const [showClientInfoModal, setShowClientInfoModal] = useState(false);
  const [isUpdatingClientInfo, setIsUpdatingClientInfo] = useState(false);
  const [clientInfoFormData, setClientInfoFormData] = useState({
    client_odc: [] as string[],
    required_documents: [] as string[],
    // MSP fields
    msp_type: '',
    msp_associate: '',
  });
  const [clientInfoErrors, setClientInfoErrors] = useState<
    Record<string, string>
  >({});

  // Search states for dropdowns
  const [locationSearch, setLocationSearch] = useState('');
  const debouncedLocationSearch = useDebounce(locationSearch, 300);
  const [documentSearch, setDocumentSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [designationSearch, setDesignationSearch] = useState('');
  // MSP search states
  const [mspAssociateSearch, setMspAssociateSearch] = useState('');

  // Contact validation states for Manage Contacts modal
  const [validatingContactFields, setValidatingContactFields] = useState<Record<string, boolean>>({});
  const [contactDuplicateErrors, setContactDuplicateErrors] = useState<Record<string, string>>({});
  const [contactLocalDuplicateErrors, setContactLocalDuplicateErrors] = useState<Record<string, string>>({});

  // Debounced duplicate check for contacts
  const debouncedCheckContactDuplicates = useDebouncedCallback(async (idx: number, field: 'email' | 'phone', value: string, countryCode?: string) => {
    if (!value || value.trim() === '') return;

    const fieldKey = `${idx}_${field}`;

    // Set loading state when the debounced function actually runs
    setValidatingContactFields(prev => ({ ...prev, [fieldKey]: true }));

    try {
      const params: any = {};
      if (field === 'email') params.email = value;
      if (field === 'phone') {
        // Combine country code and phone number for validation
        const cleanPhone = value.replace(/\D/g, '');
        const formattedPhone = countryCode ? `${countryCode}${cleanPhone}` : value;
        params.phone = formattedPhone;
      }

      const response = await clientsAPI.checkDuplicates(params);

      setContactDuplicateErrors(prev => {
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
      console.error('Error checking contact duplicates:', error);
    } finally {
      setValidatingContactFields(prev => ({ ...prev, [fieldKey]: false }));
    }
  }, 800);


  // Status options for dropdown
  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'New Lead', label: 'New Lead' },
  ];

  // Type definitions for dropdown API responses
  interface DropdownItem {
    id: string;
    name: string;
    requires_expiry?: boolean;
    requires_issue?: boolean;
    requires_number?: boolean;
    requires_document_number_field?: boolean;
    requires_file?: boolean;
  }

  interface DropdownResponse {
    dropdown_type: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    data: DropdownItem[];
  }

  // Fetch Client ODC options from API with search and pagination
  // Fetch Client ODC options from new countries API
  interface CountryApiResponse {
    error: boolean;
    msg: string;
    data: Array<{
      country: string;
      cities: string[];
    }>;
  }
  // React state for countries API data
  const [countriesData, setCountriesData] =
    React.useState<CountryApiResponse | null>(null);
  const [countriesLoading, setCountriesLoading] = React.useState<boolean>(true);
  const [, setCountriesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true);
      try {
        const response = await fetch(
          'https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries'
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setCountriesData(data);
        setCountriesError(null);
      } catch (err: any) {
        setCountriesError(err.message || 'Failed to fetch countries');
        setCountriesData(null);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch country codes from API
  React.useEffect(() => {
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
        // If API fails, keep empty array - only use fetched data
        setCountryCodesData([]);
      } finally {
        setCountryCodesLoading(false);
      }
    };
    fetchCountryCodes();
  }, []);

  // Flatten all cities from all countries for dropdown
  const clientODCOptions = countriesData?.data
    ? (() => {
      // Flatten all cities from all countries
      const allCities = countriesData.data.flatMap(country =>
        country.cities
          .filter(
            city =>
              !debouncedLocationSearch ||
              city
                .toLowerCase()
                .includes(debouncedLocationSearch.toLowerCase())
          )
          .map(city => ({
            value: city,
            label: city,
          }))
      );

      // Remove duplicates by creating a Map with city names as keys
      const uniqueCitiesMap = new Map<
        string,
        { value: string; label: string }
      >();
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

      return uniqueCities.slice(0, 50);
    })()
    : [];

  // Fetch Required Documents options from API with search and pagination
  const documentsUrl = `/client/dropdowns/Document_type?page=1&limit=100${documentSearch ? `&search=${encodeURIComponent(documentSearch)}` : ''}`;
  const { data: documentsData } = useSWR<DropdownResponse>(documentsUrl);
  const requiredDocumentsOptions =
    documentsData?.data?.map(doc => ({
      value: doc.name,
      label: doc.name,
    })) || [];

  // Fetch Users options from API with search and pagination
  const usersUrl = `/client/dropdowns/Users?page=1&limit=100${userSearch ? `&search=${encodeURIComponent(userSearch)}` : ''}`;
  const { data: usersData } = useSWR<DropdownResponse>(usersUrl);
  const ownershipOptions =
    usersData?.data?.map(user => ({
      value: user.name,
      label: user.name,
    })) || [];

  // Fetch Designation options from API with search and pagination
  const designationsUrl = `/client/dropdowns/Designation?page=1&limit=100${designationSearch ? `&search=${encodeURIComponent(designationSearch)}` : ''}`;
  const { data: designationsData } = useSWR<DropdownResponse>(designationsUrl);
  const designationOptions =
    designationsData?.data?.map(designation => ({
      value: designation.name,
      label: designation.name,
    })) || [];

  // Fetch Client Type options from API
  const mspTypeUrl = `/client/dropdowns/MSP?page=1&limit=100`;
  const { data: mspTypeData } = useSWR<DropdownResponse>(mspTypeUrl);
  const mspTypeOptions =
    mspTypeData?.data?.map(msp => ({
      value: msp.name,
      label: msp.name,
    })) || [];

  // Fetch MSP Associate options from API with search and pagination
  const mspAssociateUrl = `/client/?page=1&limit=100${mspAssociateSearch ? `&client_name=${encodeURIComponent(mspAssociateSearch)}` : ''}`;
  const { data: mspAssociateData, loading: mspAssociateLoading } =
    useSWR<ClientsResponse>(mspAssociateUrl);
  const mspAssociateOptions =
    mspAssociateData?.Client?.map((client: Client) => ({
      value: client.client_name,
      label: client.client_name,
    })) || [];

  // Fetch Contract Type options
  const contractTypeUrl = `/client/dropdowns/Contracts?page=1&limit=100`;
  const { data: contractTypeData } = useSWR<DropdownResponse>(contractTypeUrl);
  const contractTypeOptions =
    contractTypeData?.data?.map(item => ({
      value: item.name,
      label: item.name,
    })) || [];

  // Fetch Payment Term options
  const paymentTermUrl = `/client/dropdowns/Payment_Term?page=1&limit=100`;
  const { data: paymentTermData } = useSWR<DropdownResponse>(paymentTermUrl);
  const paymentTermOptions =
    paymentTermData?.data?.map(item => ({
      value: item.name,
      label: item.name,
    })) || [];

  // Fetch Payment Type options
  const paymentTypeUrl = `/client/dropdowns/Payment_Type?page=1&limit=100`;
  const { data: paymentTypeData } = useSWR<DropdownResponse>(paymentTypeUrl);
  const paymentTypeOptions =
    paymentTypeData?.data?.map(item => ({
      value: item.name,
      label: item.name,
    })) || [];

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Upload states for logo
  const [uploadStates, setUploadStates] = useState<{
    logo?: { uploading: boolean; error: string | null };
  }>({});

  // Client Ownership edit modal states
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [isUpdatingOwnership, setIsUpdatingOwnership] = useState(false);
  const [ownershipFormData, setOwnershipFormData] = useState({
    ownership: [] as string[], // Array for multiple selections
  });
  const [ownershipErrors, setOwnershipErrors] = useState<
    Record<string, string>
  >({});

  // Client Contacts edit modal states
  const [showEditContactsModal, setShowEditContactsModal] = useState(false);
  const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);
  const [editContactsFormData, setEditContactsFormData] = useState<any[]>([]);
  const [contactsErrors, setContactsErrors] = useState<Record<string, string>>(
    {}
  );
  const [countryCodesData, setCountryCodesData] = useState<
    { value: string; label: string }[]
  >([]);
  const [countryCodesLoading, setCountryCodesLoading] = useState(false);

  // Client Documents edit modal states
  const [showEditDocumentsModal, setShowEditDocumentsModal] = useState(false);
  const [isUpdatingDocuments, setIsUpdatingDocuments] = useState(false);
  const [editDocumentsFormData, setEditDocumentsFormData] = useState<any[]>([]);
  const [documentsErrors, setDocumentsErrors] = useState<
    Record<string, string>
  >({});
  // Document upload states
  const [documentUploadStates, setDocumentUploadStates] = useState<
    Record<number, { uploading: boolean; error: string | null }>
  >({});

  // Client Contracts edit modal states
  const [showEditContractsModal, setShowEditContractsModal] = useState(false);
  const [isUpdatingContracts, setIsUpdatingContracts] = useState(false);
  const [editContractsFormData, setEditContractsFormData] = useState<any[]>([]);
  const [contractsErrors, setContractsErrors] = useState<
    Record<string, string>
  >({});

  // State for Excel data preview
  const [excelData, setExcelData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  // Add state for validation errors in Excel data
  const [excelValidationErrors, setExcelValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isBulkValidating, setIsBulkValidating] = useState(false);

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
    const existingContacts = client?.contacts || [];

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
        const existingPhoneRaw = (existing.phone_no || '').toString();
        // Extract last 10 digits for comparison
        const existingPhone = existingPhoneRaw.replace(/\D/g, '').slice(-10);
        const newPhone = phone.slice(-10);

        if (email && existingEmail === email) localEmailDup = true;
        if (phone && newPhone && existingPhone === newPhone) localPhoneDup = true;
      });

      if (localEmailDup && localPhoneDup) {
        errors[`row_${index}_duplicate`] = 'Email & Phone already exist in this client';
      } else if (localEmailDup) {
        errors[`row_${index}_email`] = 'Email already exists in this client';
      } else if (localPhoneDup) {
        errors[`row_${index}_phone`] = 'Phone already exists in this client';
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
                        // Check phone match - backend might return different format, check last 10 digits
                        const dbPhone = (c.phone_no || '').replace(/\D/g, '').slice(-10);
                        const inputPhone = phone.slice(-10);
                        if (inputPhone && dbPhone === inputPhone) phoneMatch = true;
                      });
                    }
                    // Fallback: check top level if contacts not present (depends on API)
                    // assuming API returns similar structure to context
                  });
                } else {
                  // If found=true but no duplicates array (shouldn't happen with this API but just in case)
                  // We default to generic
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
            // Apply error to the specific field if possible, else generic duplicate column
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
  };  // Handle ownership modal close
  const handleCloseOwnershipModal = () => {
    setShowOwnershipModal(false);
    setOwnershipFormData({ ownership: [] });
    setOwnershipErrors({});
  };

  // Generate validation error message with specific row numbers
  const getValidationErrorMessage = () => {
    const rowErrors: Record<number, string[]> = {};

    // Group errors by row number
    Object.keys(excelValidationErrors).forEach(key => {
      const match = key.match(/row_(\d+)_(phone|email|lastName|duplicate |countryCode)/);
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
    const errorRows = Object.keys(rowErrors)
      .map(Number)
      .sort((a, b) => a - b);

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
  const handleBulkUpload = async () => {
    // Check if there are validation errors before proceeding
    if (Object.keys(excelValidationErrors).length > 0) {
      showErrorToast('Please fix validation errors before uploading');
      return;
    }

    if (excelData.length > 0) {
      try {
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
            const matchingCode = countryCodesData.find(
              code =>
                code.value === countryCode || code.label.startsWith(countryCode)
            );
            if (matchingCode) {
              countryCode = matchingCode.value;
            }
          }

          // Combine country code with phone number
          // Remove spaces from phone number
          const cleanPhone = row['Phone']
            ? row['Phone'].replace(/\s+/g, '')
            : '';
          const phoneNo =
            countryCode && cleanPhone
              ? `${countryCode}${cleanPhone}`
              : cleanPhone || '';

          return {
            phone_no: phoneNo,
            email: row['Email'] || '',
            first_name: row['First Name'] || '',
            middle_name: row['Middle Name'] || '',
            last_name: row['Last Name'] || '',
            display_name: row['Display Name'] || '',
            designation: row['Designation'] || '',
            department: row['Department']
              ? Array.isArray(row['Department'])
                ? row['Department'].join(', ')
                : row['Department']
              : '',
          };
        });

        // Get existing contacts from the client data
        const existingContacts = client?.contacts || [];

        // Combine existing contacts with new contacts
        const allContacts = [...existingContacts, ...newContacts];
        // PATCH API call to add new contacts
        await apiCall(`/client/${clientId}`, {
          method: 'PATCH',
          body: JSON.stringify({ contacts: allContacts }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // Close modal and reset state
        setShowBulkUpload(false);
        setBulkFile(null);
        setExcelData([]);
        setShowPreview(false);
        setExcelValidationErrors({}); // Clear validation errors

        showSuccessToast('Contacts uploaded successfully!');
        // Refetch client data to show changes immediately
        if (typeof mutateClientData === 'function') {
          await mutateClientData();
        }
      } catch (error) {
        console.error('Error uploading contacts:', error);
        showErrorToast('Failed to upload contacts. Please try again.');
      }
    }
  };

  // Download Excel Template with dropdowns for bulk contact upload
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

      // Add data validation for Designation column (column 7)
      if (designationList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          // Apply to rows 2-1000
          const cell = worksheet.getCell(`G${i}`);
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

      // Add data validation for Department column (column 8)
      if (departmentList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          // Apply to rows 2-1000
          const cell = worksheet.getCell(`H${i}`);
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
      const countryCodeList = countryCodesData
        .map((cc: any) => cc.value)
        .join(',');
      for (let i = 2; i <= 1000; i++) {
        const cell = worksheet.getCell(`D${i}`);
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
        'Fill in the contact details. Display Name will be auto-generated from First Name + Middle Name + Last Name. Use dropdowns for Designation and Department.';

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

  // Fetch client data from API using the id from URL
  const {
    data: client,
    error,
    loading,
    mutate: mutateClientData,
  } = useSWR<Client>(
    clientId
      ? `${API_ENDPOINTS.CLIENTS.GET(clientId)}${user?.id ? `?user_id=${user.id}` : ''}`
      : null
  );

  const [logoViewUrl, setLogoViewUrl] = useState<string>('');

  // Effect to fetch presigned URL for the client logo
  React.useEffect(() => {
    const fetchLogoUrl = async () => {
      if (client?.client_logo) {
        try {
          const url = await FileUploadService.getFileViewUrl(client.client_logo);
          setLogoViewUrl(url);
        } catch (error) {
          console.error('Error fetching logo view URL:', error);
          setLogoViewUrl('');
        }
      } else {
        setLogoViewUrl('');
      }
    };
    fetchLogoUrl();
  }, [client?.client_logo]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text className="text-lg">Loading client details...</Text>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text className="text-lg text-red-600">
          Error loading client details: {error.message}
        </Text>
      </div>
    );
  }

  // Handle no data state
  if (!client) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text className="text-lg">Client not found</Text>
      </div>
    );
  }

  const lastViewedEntry = client.last_viewed?.[0];
  const lastViewedBy = (() => {
    const by = lastViewedEntry?.last_viewed_by;
    if (!by) return 'System';
    if (typeof by === 'object') {
      return (
        by.display_name ||
        by.username ||
        by.email ||
        by.id ||
        'System'
      );
    }
    return String(by);
  })();
  const lastViewedOn = lastViewedEntry?.last_viewed_on
    ? new Date(lastViewedEntry.last_viewed_on).toLocaleDateString()
    : undefined;

  // Add logo upload handler
  const handleLogoUpload = async (file: File | null) => {
    if (!file) {
      handleFormChange('client_logo', null);
      handleFormChange('client_logo_preview', '');
      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: null },
      }));
      return;
    }

    setUploadStates(prev => ({
      ...prev,
      logo: { uploading: true, error: null },
    }));

    try {
      const validation = FileUploadService.validateFile(file, {
        maxSize: 5,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      const uploadResponse = await FileUploadService.uploadClientLogo(file);
      console.log('Logo uploaded successfully:', uploadResponse);

      // Get presigned URL for immediately showing the preview securely
      const presignedUrl = await FileUploadService.getFileViewUrl(uploadResponse.file_url);

      handleFormChange('client_logo', uploadResponse.file_url);
      handleFormChange('client_logo_preview', presignedUrl);

      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: null },
      }));

      console.log(
        'Logo upload completed, URL stored:',
        uploadResponse.file_url
      );
    } catch (error) {
      console.error('Logo upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: errorMsg },
      }));

      handleFormChange('client_logo', null);
      handleFormChange('client_logo_preview', '');

      // Show error to user
      setFormErrors(prev => ({
        ...prev,
        client_logo: errorMsg,
      }));
    }
  };

  // Handle edit client
  const handleEditClient = () => {
    if (!client) return;
    // Populate form with current client data
    setEditFormData({
      client_name: client.client_name || '',
      client_id: client.client_id || '',
      client_code: client.client_code || '',
      client_logo: null,
      client_logo_preview: logoViewUrl || client.client_logo || '',
      billing_attention: client.billing_address?.attention || '',
      billing_country: client.billing_address?.country_region || '',
      billing_state: client.billing_address?.state || '',
      billing_city: client.billing_address?.city || '',
      billing_street1: client.billing_address?.street_1 || '',
      billing_street2: client.billing_address?.street_2 || '',
      registered_pin_code: client.client_postal_code?.toString() || '',
      billing_postal_code: client.billing_address?.pin_code || '',
      billing_phone: client.billing_address?.phone || '',
      website: client.client_website
        ? String(client.client_website)
          .replace(/^https?:\/\//i, '')
          .replace(/\/$/, '')
        : '',
      client_portal: client.client_portal
        ? String(client.client_portal)
          .replace(/^https?:\/\//i, '')
          .replace(/\/$/, '')
        : '',
      status: client.client_status || 'active',
      // Populate new fields
      client_registered_address: client.client_registered_address || '',
      client_country: client.client_country || '',
      client_state: client.client_state || '',
      client_city: client.client_city || '',
      // Client display name field
      client_display_name: client.client_display_name || '',
    }); setFormErrors({});
    setShowEditModal(true);
  };

  // Handle form field changes with live validation
  const handleFormChange = (
    field: string,
    value: string | File | null | string[]
  ) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Live validation for required fields
    const newErrors = { ...formErrors };
    // URL regex: ensure starts with www. and a domain like www.xyz.com
    const wwwRegex = /^www\.[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

    // Validate based on field type and requirements
    if (typeof value === 'string') {
      switch (field) {
        case 'client_name':
          if (!value.trim()) {
            newErrors.client_name = 'Client name is required';
          } else {
            delete newErrors.client_name;
          }
          break;

        case 'billing_attention':
          // Billing address validation disabled for now
          // if (!value.trim()) {
          //   newErrors.billing_attention = 'Attention is required';
          // } else {
          //   delete newErrors.billing_attention;
          // }
          break;

        case 'billing_country':
          // Billing address validation disabled for now
          // if (!value.trim()) {
          //   newErrors.billing_country = 'Country is required';
          // } else {
          //   delete newErrors.billing_country;
          // }
          break;

        case 'billing_state':
          // Billing address validation disabled for now
          // if (!value.trim()) {
          //   newErrors.billing_state = 'State is required';
          // } else {
          //   delete newErrors.billing_state;
          // }
          break;

        case 'billing_city':
          // Billing address validation disabled for now
          // if (!value.trim()) {
          //   newErrors.billing_city = 'City is required';
          // } else {
          //   delete newErrors.billing_city;
          // }
          break;

        case 'billing_street1':
          // Billing address validation disabled for now
          // if (!value.trim()) {
          //   newErrors.billing_street1 = 'Street address is required';
          // } else {
          //   delete newErrors.billing_street1;
          // }
          break;

        case 'registered_pin_code':
          if (!value.trim()) {
            newErrors.registered_pin_code = 'PIN code is required';
          } else if (!/^\d{6}$/.test(value)) {
            newErrors.registered_pin_code = 'PIN code must be exactly 6 digits';
          } else {
            delete newErrors.registered_pin_code;
          }
          break;

        case 'billing_postal_code':
          // Postal code is optional but if provided must be 6 digits
          if (value.trim() && !/^\d{6}$/.test(value)) {
            newErrors.billing_postal_code =
              'Postal code must be exactly 6 digits';
          } else {
            delete newErrors.billing_postal_code;
          }
          break;

        case 'billing_phone':
          // Phone is optional but if provided must be 10 digits
          if (value.trim() && !/^\d{10}$/.test(value)) {
            newErrors.billing_phone = 'Phone number must be exactly 10 digits';
          } else {
            delete newErrors.billing_phone;
          }
          break;

        case 'website':
          if (!value.trim()) {
            newErrors.website = 'Website is required';
          } else if (!wwwRegex.test(value.trim())) {
            newErrors.website = 'Website must be in format www.xyz.com';
          } else {
            delete newErrors.website;
          }
          break;

        case 'status':
          if (!value) {
            newErrors.status = 'Status is required';
          } else {
            delete newErrors.status;
          }
          break;

        // Validation for new fields
        case 'client_registered_address':
          if (!value.trim()) {
            newErrors.client_registered_address =
              'Registered address is required';
          } else {
            delete newErrors.client_registered_address;
          }
          break;

        case 'client_country':
          if (!value.trim()) {
            newErrors.client_country = 'Client country is required';
          } else {
            delete newErrors.client_country;
          }
          break;

        case 'client_state':
          if (!value.trim()) {
            newErrors.client_state = 'Client state is required';
          } else {
            delete newErrors.client_state;
          }
          break;

        case 'client_city':
          if (!value.trim()) {
            newErrors.client_city = 'Client city is required';
          } else {
            delete newErrors.client_city;
          }
          break;

        default:
          // For other fields, just clear the error if there was one
          if (formErrors[field]) {
            delete newErrors[field];
          }
          break;
      }
    } else if (field === 'client_logo') {
      // For file uploads, clear the error when a file is selected
      if (value) {
        delete newErrors.client_logo;
      }
    }

    setFormErrors(newErrors);
  };

  // Check validity without setting errors (used to disable Save button)
  const isFormValidNoSet = () => {
    const wwwRegex = /^www\.[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
    // Required checks
    if (!editFormData.client_name.trim()) return false;
    // Billing address validation disabled - skipping billing field checks
    if (!editFormData.website.trim()) return false;
    if (!wwwRegex.test(editFormData.website.trim())) return false;
    if (!editFormData.status) return false;
    if (!editFormData.client_registered_address.trim()) return false;
    if (!editFormData.client_country.trim()) return false;
    if (!editFormData.client_state.trim()) return false;
    if (!editFormData.client_city.trim()) return false;
    if (!editFormData.registered_pin_code.trim()) return false;
    if (!/^\d{6}$/.test(editFormData.registered_pin_code)) return false;

    // client_portal is optional but if present must match www format or https:// URL
    // if (editFormData.client_portal && editFormData.client_portal.trim()) {
    //   const portalRegex =
    //     /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
    //   if (!portalRegex.test(editFormData.client_portal.trim())) return false;
    // }

    // No live errors present
    if (Object.keys(formErrors).length > 0) return false;

    return true;
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!editFormData.client_name.trim()) {
      errors.client_name = 'Client name is required';
    }
    // Client code is disabled, so no validation needed

    // Billing address validation disabled for now
    // if (!editFormData.billing_attention.trim()) {
    //   errors.billing_attention = 'Attention is required';
    // }
    // if (!editFormData.billing_country.trim()) {
    //   errors.billing_country = 'Country is required';
    // }
    // if (!editFormData.billing_state.trim()) {
    //   errors.billing_state = 'State is required';
    // }
    // if (!editFormData.billing_city.trim()) {
    //   errors.billing_city = 'City is required';
    // }
    // if (!editFormData.billing_street1.trim()) {
    //   errors.billing_street1 = 'Street address is required';
    // }
    // if (!editFormData.billing_pin_code.trim()) {
    //   errors.billing_pin_code = 'PIN code is required';
    // } else if (!/^\d{6}$/.test(editFormData.billing_pin_code)) {
    //   errors.billing_pin_code = 'PIN code must be exactly 6 digits';
    // }

    if (!editFormData.website.trim()) {
      errors.website = 'Website is required';
    } else {
      const wwwRegex = /^www\.[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
      if (!wwwRegex.test(editFormData.website.trim())) {
        errors.website = 'Website must be in format www.xyz.com';
      }
    }
    // client_portal is optional but if provided must match www format or https:// URL
    // if (editFormData.client_portal && editFormData.client_portal.trim()) {
    //   const portalRegex =
    //     /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
    //   if (!portalRegex.test(editFormData.client_portal.trim())) {
    //     errors.client_portal =
    //       'Client portal must be a valid URL (e.g., https://portal.example.com)';
    //   }
    // }
    if (!editFormData.status) {
      errors.status = 'Status is required';
    }

    // Validation for new fields
    if (!editFormData.client_registered_address.trim()) {
      errors.client_registered_address = 'Registered address is required';
    }
    if (!editFormData.client_country.trim()) {
      errors.client_country = 'Client country is required';
    }
    if (!editFormData.client_state.trim()) {
      errors.client_state = 'Client state is required';
    }
    if (!editFormData.client_city.trim()) {
      errors.client_city = 'Client city is required';
    }
    if (!editFormData.registered_pin_code.trim()) {
      errors.registered_pin_code = 'PIN code is required';
    } else if (!/^\d{6}$/.test(editFormData.registered_pin_code)) {
      errors.registered_pin_code = 'PIN code must be exactly 6 digits';
    }

    // Postal code is optional but if provided must be 6 digits
    if (
      editFormData.billing_postal_code.trim() &&
      !/^\d{6}$/.test(editFormData.billing_postal_code)
    ) {
      errors.billing_postal_code = 'Postal code must be exactly 6 digits';
    }

    // Phone is optional but if provided must be 10 digits
    if (
      editFormData.billing_phone.trim() &&
      !/^\d{10}$/.test(editFormData.billing_phone)
    ) {
      errors.billing_phone = 'Phone number must be exactly 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save
  const handleSaveClient = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      // Map billing address fields back to client fields for API
      const capitalize = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
      const clientUpdateData = {
        client_name: capitalize(editFormData.client_name),
        client_id: editFormData.client_id,
        client_code: editFormData.client_code,
        client_display_name: editFormData.client_display_name,
        // Preserve existing logo if user didn't upload a new one
        client_logo:
          editFormData.client_logo && String(editFormData.client_logo).trim()
            ? editFormData.client_logo
            : client.client_logo || null,
        client_registered_address: capitalize(
          editFormData.client_registered_address
        ),
        client_country: capitalize(editFormData.client_country),
        client_state: capitalize(editFormData.client_state),
        client_city: capitalize(editFormData.client_city),
        client_postal_code: editFormData.registered_pin_code
          ? parseInt(editFormData.registered_pin_code)
          : null,
        client_website: editFormData.website,
        client_portal: editFormData.client_portal,
        client_status: capitalize(editFormData.status),
        billing_address: {
          attention: capitalize(editFormData.billing_attention),
          country_region: capitalize(editFormData.billing_country),
          state: capitalize(editFormData.billing_state),
          city: capitalize(editFormData.billing_city),
          street_1: capitalize(editFormData.billing_street1),
          street_2: capitalize(editFormData.billing_street2),
          pin_code: editFormData.billing_postal_code || '',
          phone: editFormData.billing_phone || '',
        },
      };      // PATCH API call
      await apiCall(`/client/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(clientUpdateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowEditModal(false);
      showSuccessToast('Client updated successfully!');
      // Refetch client data to show changes immediately
      if (typeof mutateClientData === 'function') {
        await mutateClientData();
      }
    } catch (error) {
      console.error('Error updating client:', error);
      showErrorToast('Failed to update client. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle modal close
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({
      client_name: '',
      client_id: '',
      client_code: '',
      client_logo: null,
      client_logo_preview: '',
      billing_attention: '',
      billing_country: '',
      billing_state: '',
      billing_city: '',
      billing_street1: '',
      billing_street2: '',
      registered_pin_code: '',
      billing_postal_code: '',
      billing_phone: '',
      website: '',
      client_portal: '',
      status: '',
      // Reset new fields
      client_registered_address: '',
      client_country: '',
      client_state: '',
      client_city: '',
      // Reset client display name field
      client_display_name: '',
    });
    setFormErrors({});
  };
  // Handle client information edit
  const handleEditClientInfo = () => {
    // Populate form with current client information data
    setClientInfoFormData({
      client_odc: Array.isArray(client.client_odc)
        ? client.client_odc
        : typeof client.client_odc === 'string' && client.client_odc
          ? client.client_odc.split(',').map((odc: string) => odc.trim())
          : [],
      required_documents: Array.isArray(client.client_required_documents)
        ? client.client_required_documents
        : typeof client.client_required_documents === 'string' &&
          client.client_required_documents
          ? client.client_required_documents
            .split(',')
            .map((doc: string) => doc.trim())
          : [],
      msp_type: client.msp_type || '',
      msp_associate: client.associate_msp || '',
    });
    setClientInfoErrors({});
    setShowClientInfoModal(true);
  };

  // Handle client info form field changes with live validation
  const handleClientInfoFormChange = (
    field: string,
    value: string[] | string
  ) => {
    // Special logic: when msp_type changes, reset msp_associate
    if (field === 'msp_type') {
      setClientInfoFormData(prev => ({
        ...prev,
        msp_type: value as string,
        msp_associate: '', // Reset MSP Associate when Client Type changes
      }));
    } else {
      setClientInfoFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Live validation for required fields
    const newErrors = { ...clientInfoErrors };

    // Validate based on field type
    if (Array.isArray(value)) {
      switch (field) {
        case 'client_odc':
          if (!value || value.length === 0) {
            newErrors.client_odc = 'Client ODC is required';
          } else {
            delete newErrors.client_odc;
          }
          break;

        case 'required_documents':
          if (!value || value.length === 0) {
            newErrors.required_documents = 'Required documents is required';
          } else {
            delete newErrors.required_documents;
          }
          break;

        default:
          // For other fields, just clear the error if there was one
          if (clientInfoErrors[field]) {
            delete newErrors[field];
          }
          break;
      }
    }

    // Validate string fields (contract_type, end_date, payment_term, payment_type, msp_type, msp_associate)
    if (typeof value === 'string') {
      switch (field) {
        case 'contract_type':
          if (!value || !String(value).trim()) {
            newErrors.contract_type = 'Contract type is required';
          } else {
            delete newErrors.contract_type;
          }
          break;
        case 'end_date':
          if (!value || !String(value).trim()) {
            newErrors.end_date = 'End date is required';
          } else {
            delete newErrors.end_date;
          }
          break;
        case 'payment_term':
          if (!value || !String(value).trim()) {
            newErrors.payment_term = 'Payment term is required';
          } else {
            delete newErrors.payment_term;
          }
          break;
        case 'payment_type':
          if (!value || !String(value).trim()) {
            newErrors.payment_type = 'Payment type is required';
          } else {
            delete newErrors.payment_type;
          }
          break;
        case 'msp_type':
          if (!value || !String(value).trim()) {
            // msp_type may be optional; do not enforce unless needed
            // delete newErrors.msp_type;
          } else {
            delete newErrors.msp_type;
          }
          break;
        case 'msp_associate':
          if (clientInfoFormData.msp_type === 'ThroughMSP') {
            if (!value || !String(value).trim()) {
              newErrors.msp_associate =
                'MSP Associate is required for ThroughMSP type';
            } else {
              delete newErrors.msp_associate;
            }
          } else {
            delete newErrors.msp_associate;
          }
          break;
        default:
          if (clientInfoErrors[field]) {
            delete newErrors[field];
          }
          break;
      }
    }

    setClientInfoErrors(newErrors);
  };

  // Validate client info form
  const validateClientInfoForm = () => {
    const errors: Record<string, string> = {};

    if (
      !clientInfoFormData.client_odc ||
      clientInfoFormData.client_odc.length === 0
    ) {
      errors.client_odc = 'Client ODC is required';
    }
    if (
      !clientInfoFormData.required_documents ||
      clientInfoFormData.required_documents.length === 0
    ) {
      errors.required_documents = 'Required documents is required';
    }

    // If MSP type is ThroughMSP, ensure msp_associate is set
    if (clientInfoFormData.msp_type === 'ThroughMSP') {
      if (
        !clientInfoFormData.msp_associate ||
        !String(clientInfoFormData.msp_associate).trim()
      ) {
        errors.msp_associate = 'MSP Associate is required for ThroughMSP type';
      }
    }

    setClientInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check client info validity without mutating errors (used to disable Save)
  const isClientInfoValidNoSet = () => {
    if (
      !clientInfoFormData.client_odc ||
      clientInfoFormData.client_odc.length === 0
    )
      return false;
    if (
      !clientInfoFormData.required_documents ||
      clientInfoFormData.required_documents.length === 0
    )
      return false;
    if (clientInfoFormData.msp_type === 'ThroughMSP') {
      if (
        !clientInfoFormData.msp_associate ||
        !String(clientInfoFormData.msp_associate).trim()
      )
        return false;
    }
    return true;
  };

  // Handle client info modal close
  const handleCloseClientInfoModal = () => {
    setShowClientInfoModal(false);
    setClientInfoFormData({
      client_odc: [],
      required_documents: [],
      msp_type: '',
      msp_associate: '',
    });
    setClientInfoErrors({});
  };

  // Handle save client info
  const handleSaveClientInfo = async () => {
    if (!validateClientInfoForm()) {
      return;
    }

    setIsUpdatingClientInfo(true);
    try {
      // Map modal fields to API payload
      const patchPayload: any = {
        msp_type: clientInfoFormData.msp_type,
        associate_msp: clientInfoFormData.msp_associate,
        client_odc: Array.isArray(clientInfoFormData.client_odc)
          ? clientInfoFormData.client_odc.join(', ')
          : clientInfoFormData.client_odc,
        client_required_documents: Array.isArray(
          clientInfoFormData.required_documents
        )
          ? clientInfoFormData.required_documents.join(', ')
          : clientInfoFormData.required_documents,
      };

      // PATCH API call
      await apiCall(`/client/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowClientInfoModal(false);
      showSuccessToast('Client information updated successfully!');
      // Refetch client data to show changes immediately
      if (typeof mutateClientData === 'function') {
        await mutateClientData();
      }
    } catch (error) {
      console.error('Error updating client info:', error);
      showErrorToast('Failed to update client information. Please try again.');
    } finally {
      setIsUpdatingClientInfo(false);
    }
  };

  // Handle client ownership edit
  const handleEditOwnership = () => {
    // Populate form with current ownership data from client
    let currentOwnership: string[] = [];

    if (client.ownership) {
      if (Array.isArray(client.ownership)) {
        currentOwnership = client.ownership;
      } else if (typeof client.ownership === 'string') {
        // Split comma-separated string and trim whitespace
        currentOwnership = client.ownership
          .split(',')
          .map(owner => owner.trim());
      }
    }

    setOwnershipFormData({
      ownership: currentOwnership,
    });
    setOwnershipErrors({});
    setShowOwnershipModal(true);
  };

  // Handle ownership form field changes with live validation
  const handleOwnershipFormChange = (
    field: string,
    value: string | string[]
  ) => {
    setOwnershipFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Live validation for required fields
    const newErrors = { ...ownershipErrors };

    // Validate ownership field
    if (field === 'ownership') {
      if (Array.isArray(value)) {
        if (!value || value.length === 0) {
          newErrors.ownership = 'Client ownership is required';
        } else {
          delete newErrors.ownership;
        }
      }
    } else {
      // For other fields, just clear the error if there was one
      if (ownershipErrors[field]) {
        delete newErrors[field];
      }
    }

    setOwnershipErrors(newErrors);
  };

  // Validate ownership form
  const validateOwnershipForm = () => {
    const errors: Record<string, string> = {};

    if (
      !ownershipFormData.ownership ||
      ownershipFormData.ownership.length === 0
    ) {
      errors.ownership = 'Client ownership is required';
    }

    setOwnershipErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ownership validity checker without setting errors
  const isOwnershipValidNoSet = () => {
    if (
      !ownershipFormData.ownership ||
      ownershipFormData.ownership.length === 0
    )
      return false;
    return true;
  };

  // Handle save ownership
  const handleSaveOwnership = async () => {
    if (!validateOwnershipForm()) {
      return;
    }

    setIsUpdatingOwnership(true);
    try {
      // Prepare PATCH payload for ownership
      const patchPayload: any = {
        ownership: Array.isArray(ownershipFormData.ownership)
          ? ownershipFormData.ownership.join(', ')
          : ownershipFormData.ownership,
      };

      // PATCH API call
      await apiCall(`/client/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowOwnershipModal(false);
      showSuccessToast('Client ownership updated successfully!');
      // Refetch client data to show changes immediately
      if (typeof mutateClientData === 'function') {
        await mutateClientData();
      }
    } catch (error) {
      console.error('Error updating ownership:', error);
      showErrorToast('Failed to update client ownership. Please try again.');
    } finally {
      setIsUpdatingOwnership(false);
    }
  };

  // Handle Manage Contacts
  const handleEditContacts = () => {
    // Prepare contacts data from client with proper field mapping
    const contactsData = client.contacts?.map((contact, index) => {
      // Parse phone number to extract country code and phone digits
      const fullPhone = contact.phone_no || '';
      let countryCode = '+1';
      let phoneNumber = '';

      if (fullPhone.startsWith('+')) {
        // Extract country code by finding the longest matching country code
        let foundCode = '';

        // Try to match country codes from the fetched list
        for (const cc of countryCodesData) {
          if (fullPhone.startsWith(cc.value)) {
            if (cc.value.length > foundCode.length) {
              foundCode = cc.value;
            }
          }
        }

        // If found in the list, use it; otherwise try regex as fallback
        if (foundCode) {
          countryCode = foundCode;
          phoneNumber = fullPhone
            .substring(foundCode.length)
            .replace(/\D/g, '');
        } else {
          // Fallback: match +1 to +9999 (up to 4 digits)
          const match = fullPhone.match(/^(\+\d{1,4})(.*)$/);
          if (match) {
            countryCode = match[1];
            phoneNumber = match[2].replace(/\D/g, '');
          }
        }
      } else if (fullPhone) {
        // If no +, treat as just digits
        phoneNumber = fullPhone.replace(/\D/g, '');
      }

      return {
        id: index.toString(),
        firstName: contact.first_name || '',
        middleName: contact.middle_name || '',
        lastName: contact.last_name || '',
        displayName:
          contact.display_name ||
          [contact.first_name, contact.middle_name, contact.last_name]
            .filter(Boolean)
            .join(' '),
        phone: phoneNumber,
        email: contact.email || '',
        countryCode: countryCode,
        designation: contact.designation || '',
        department: Array.isArray(contact.department)
          ? contact.department
          : contact.department
            ? contact.department.split(',').map((d: string) => d.trim())
            : [],
      };
    }) || [
        {
          id: Math.random().toString(),
          firstName: '',
          middleName: '',
          lastName: '',
          displayName: '',
          phone: '',
          email: '',
          countryCode: '+1',
          designation: '',
          department: [],
        },
      ];

    setEditContactsFormData(contactsData);
    setContactsErrors({});
    setShowEditContactsModal(true);
  };

  // Handle contacts form field changes
  const handleContactFormChange = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    const updatedContacts = [...editContactsFormData];
    // Convert array to string for department field
    const processedValue =
      field === 'department' && Array.isArray(value) ? value.join(', ') : value;
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: processedValue,
    };

    // Auto-update display name when first, middle, or last name changes
    if (
      field === 'firstName' ||
      field === 'middleName' ||
      field === 'lastName'
    ) {
      const firstName =
        field === 'firstName' ? value : updatedContacts[index].firstName || '';
      const middleName =
        field === 'middleName'
          ? value
          : updatedContacts[index].middleName || '';
      const lastName =
        field === 'lastName' ? value : updatedContacts[index].lastName || '';
      updatedContacts[index].displayName = [firstName, middleName, lastName]
        .filter(name => name && name.trim())
        .join(' ');
    }

    setEditContactsFormData(updatedContacts);

    // Clear error for this field
    const errorKey = `${index}_${field}`;

    // Check for local duplicates (within the form contacts)
    if (field === 'email' || field === 'phone' || field === 'countryCode') {
      const newLocalDuplicateErrors: Record<string, string> = {};

      // Check ALL contacts for BOTH email and phone duplicates
      updatedContacts.forEach((contact, contactIdx) => {
        // Check email duplicates
        if (contact.email && contact.email.trim()) {
          const duplicateIndices = updatedContacts
            .map((c, i) => ({ contact: c, index: i }))
            .filter(({ contact: c, index: i }) =>
              i !== contactIdx &&
              c.email &&
              c.email.trim().toLowerCase() === contact.email.trim().toLowerCase()
            );

          if (duplicateIndices.length > 0) {
            newLocalDuplicateErrors[`${contactIdx}_email`] = 'This email is already used in another contact';
          }
        }

        // Check phone duplicates
        if (contact.phone && contact.phone.trim()) {
          const fullPhone = `${contact.countryCode}${contact.phone.replace(/\D/g, '')}`;
          const duplicateIndices = updatedContacts
            .map((c, i) => ({ contact: c, index: i }))
            .filter(({ contact: c, index: i }) => {
              if (i === contactIdx) return false;
              const otherFullPhone = `${c.countryCode}${c.phone.replace(/\D/g, '')}`;
              return otherFullPhone === fullPhone;
            });

          if (duplicateIndices.length > 0) {
            newLocalDuplicateErrors[`${contactIdx}_phone`] = 'This phone number is already used in another contact';
          }
        }
      });

      setContactLocalDuplicateErrors(newLocalDuplicateErrors);
    }

    // Trigger duplicate check for email, phone, or countryCode changes
    if (field === 'email' || field === 'phone' || field === 'countryCode') {
      // Determine which field to validate
      const validationField = field === 'email' ? 'email' : 'phone';
      const fieldKey = `${index}_${validationField}`;
      const valueToValidate = validationField === 'phone' ? updatedContacts[index].phone : value;
      const currentCountryCode = updatedContacts[index].countryCode || '+1';

      // Clear previous duplicate error immediately (for the target field)
      setContactDuplicateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });

      if (field === 'email') {
        // Trigger debounced validation for email
        if (value && typeof value === 'string' && value.trim() !== '') {
          debouncedCheckContactDuplicates(index, 'email', value as string);
        } else {
          // Clear loading state if email is empty
          setValidatingContactFields(prev => ({ ...prev, [fieldKey]: false }));
        }
      } else {
        // Phone validation (triggered by phone OR countryCode change)
        if (valueToValidate && typeof valueToValidate === 'string' && valueToValidate.trim().length >= 10) {
          // Pass country code for phone validation
          debouncedCheckContactDuplicates(index, 'phone', valueToValidate, currentCountryCode);
        } else {
          // Clear loading state if phone is too short
          setValidatingContactFields(prev => ({ ...prev, [fieldKey]: false }));
        }
      }
    }

    // Immediate validation for phone and email formats
    if (field === 'phone') {
      const phoneVal = String(updatedContacts[index].phone || '').replace(
        /\D/g,
        ''
      );
      if (!phoneVal) {
        setContactsErrors(prev => ({
          ...prev,
          [errorKey]: 'Phone is required',
        }));
      } else if (!/^\d{10}$/.test(phoneVal)) {
        setContactsErrors(prev => ({
          ...prev,
          [errorKey]: 'Phone must be 10 digits',
        }));
      } else {
        setContactsErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
      return;
    }

    if (field === 'email') {
      const emailVal = String(updatedContacts[index].email || '').trim();
      if (!emailVal) {
        setContactsErrors(prev => ({
          ...prev,
          [errorKey]: 'Email is required',
        }));
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        setContactsErrors(prev => ({
          ...prev,
          [errorKey]: 'Please enter a valid email address',
        }));
      } else {
        setContactsErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
      return;
    }

    // For other fields, just clear the error if present
    if (contactsErrors[errorKey]) {
      setContactsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add new contact
  const handleAddNewContact = () => {
    const newContact = {
      id: Math.random().toString(),
      firstName: '',
      middleName: '',
      lastName: '',
      displayName: '',
      phone: '',
      email: '',
      countryCode: '+91',
      designation: '',
      department: [],
    };
    setEditContactsFormData([...editContactsFormData, newContact]);
  };

  // Remove contact
  const handleRemoveContact = (index: number) => {
    const updatedContacts = editContactsFormData.filter((_, i) => i !== index);
    setEditContactsFormData(updatedContacts);
  };

  // Validate contacts form
  const validateContactsForm = () => {
    const errors: Record<string, string> = {};

    editContactsFormData.forEach((contact, index) => {
      if (!contact.firstName?.trim()) {
        errors[`${index}_firstName`] = 'First name is required';
      }
      if (!contact.lastName?.trim()) {
        errors[`${index}_lastName`] = 'Last name is required';
      }
      // Display name is auto-generated, so no validation needed
      if (!contact.phone?.trim()) {
        errors[`${index}_phone`] = 'Phone is required';
      }
      if (!contact.email?.trim()) {
        errors[`${index}_email`] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        errors[`${index}_email`] = 'Please enter a valid email address';
      }
      if (!contact.designation?.trim()) {
        errors[`${index}_designation`] = 'Designation is required';
      }
      // Handle department field (can be array of strings or string)
      let departmentValue = contact.department;
      if (Array.isArray(departmentValue)) {
        // If it's an array of strings, join them
        departmentValue = departmentValue.join(', ');
      }
      if (!departmentValue || !departmentValue.trim()) {
        errors[`${index}_department`] = 'Department is required';
      }
    });

    setContactsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Contacts validity checker without setting errors
  const isContactsValidNoSet = () => {
    // Check for duplicate errors (API and local)
    const hasDuplicateErrors = Object.keys(contactDuplicateErrors).length > 0;
    const hasLocalDuplicateErrors = Object.keys(contactLocalDuplicateErrors).length > 0;

    if (hasDuplicateErrors || hasLocalDuplicateErrors) {
      return false;
    }

    for (let index = 0; index < editContactsFormData.length; index++) {
      const contact: any = editContactsFormData[index];
      if (!contact.firstName?.trim()) return false;
      if (!contact.lastName?.trim()) return false;
      // Validate phone number - must be exactly 10 digits
      const phoneVal = String(contact.phone || '').replace(/\D/g, '');
      if (!phoneVal) return false;
      if (phoneVal.length !== 10) return false;
      if (!contact.email?.trim()) return false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return false;
      if (!contact.designation?.trim()) return false;
      let departmentValue = contact.department;
      if (Array.isArray(departmentValue))
        departmentValue = departmentValue.join(', ');
      if (!departmentValue || !departmentValue.trim()) return false;
    }
    return true;
  };

  // Handle save contacts
  const handleSaveContacts = async () => {
    if (!validateContactsForm()) {
      return;
    }

    setIsUpdatingContacts(true);
    try {
      // Map contacts to API schema
      // Capitalize helper
      const capitalize = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
      const contactsPayload = editContactsFormData.map(contact => ({
        phone_no: `${contact.countryCode}${contact.phone}`,
        email: contact.email,
        first_name: capitalize(contact.firstName),
        middle_name: capitalize(contact.middleName),
        last_name: capitalize(contact.lastName),
        display_name: contact.displayName.split(' ').map(capitalize).join(' '),
        designation: contact.designation,
        department: Array.isArray(contact.department)
          ? contact.department.join(', ')
          : contact.department,
      }));

      // PATCH API call
      await apiCall(`/client/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ contacts: contactsPayload }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowEditContactsModal(false);
      showSuccessToast('Contacts updated successfully!');
      // Refetch client data to show changes immediately
      if (typeof mutateClientData === 'function') {
        await mutateClientData();
      }
    } catch (error) {
      console.error('Error updating contacts:', error);
      showErrorToast('Failed to update contacts. Please try again.');
    } finally {
      setIsUpdatingContacts(false);
    }
  };

  // Handle contacts modal close
  const handleCloseContactsModal = () => {
    setShowEditContactsModal(false);
    setEditContactsFormData([]);
    setContactsErrors({});
  };

  // Handle Manage Documents
  const handleEditDocuments = () => {
    // Prepare documents data from client with proper field mapping
    const documentsData = client.documents?.map((document, index) => ({
      id: index.toString(),
      documentType: document.document_type || '',
      documentNumber: document.document_no || '',
      documentDescription: document.document_description || '',
      issueDate: document.document_issue_date || '',
      expiryDate: document.document_expiry_date || '',
      fileName: document.client_document_file || '',
      fileUrl: document.client_document_file || '',
      status: 'Active'
    })) || [
        {
          id: Math.random().toString(),
          documentType: '',
          documentNumber: '',
          documentDescription: '',
          issueDate: '',
          expiryDate: '',
          fileName: '',
          fileUrl: '',
          status: 'Active'
        },
      ];

    setEditDocumentsFormData(documentsData);
    setDocumentsErrors({});
    setShowEditDocumentsModal(true);
  };

  // Handle documents form field changes
  const handleDocumentFormChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedDocuments = [...editDocumentsFormData];
    // Apply smart transforms for document number based on type
    if (field === 'documentNumber') {
      const currentType = updatedDocuments[index].documentType || '';
      const format = getDocumentFormat(currentType);
      const transformedValue =
        format && typeof format.transform === 'function'
          ? format.transform(value)
          : value;
      updatedDocuments[index] = {
        ...updatedDocuments[index],
        [field]: transformedValue,
      };
    } else if (field === 'documentType') {
      // When document type changes, also transform existing number to new format
      const newType = value || '';
      const format = getDocumentFormat(newType);
      const existingNumber = updatedDocuments[index].documentNumber || '';
      const transformedNumber =
        format && typeof format.transform === 'function'
          ? format.transform(existingNumber)
          : existingNumber;
      updatedDocuments[index] = {
        ...updatedDocuments[index],
        documentType: newType,
        documentNumber: transformedNumber,
      };
      // Clear date fields if new type doesn't require them
      if (!requiresIssueDate(newType)) {
        updatedDocuments[index].issueDate = '';
      }
      if (!requiresExpiryDate(newType)) {
        updatedDocuments[index].expiryDate = '';
      }
    } else {
      updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
    }
    setEditDocumentsFormData(updatedDocuments);

    // Clear error for this field
    const errorKey = `${index}_${field}`;
    if (documentsErrors[errorKey]) {
      setDocumentsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add new document
  const handleAddNewDocument = () => {
    const newDocument = {
      id: Math.random().toString(),
      documentType: '',
      documentNumber: '',
      documentDescription: '',
      issueDate: '',
      expiryDate: '',
      fileName: '',
      fileUrl: '',
      status: 'Active',
    };
    setEditDocumentsFormData([...editDocumentsFormData, newDocument]);
  };

  // Remove document
  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = editDocumentsFormData.filter(
      (_, i) => i !== index
    );
    setEditDocumentsFormData(updatedDocuments);
  };

  // Handle file upload
  const handleFileUpload = async (index: number, file: File) => {
    // Set uploading state
    setDocumentUploadStates(prev => ({
      ...prev,
      [index]: { uploading: true, error: null },
    }));

    // Clear any existing validation errors for this field
    setDocumentsErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_fileName`];
      return newErrors;
    });

    try {
      // Validate file before upload
      const validation = FileUploadService.validateFile(file, {
        maxSize: 20, // 20MB limit
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }

      // Upload file using FileUploadService
      const uploadResponses = await FileUploadService.uploadClientDocuments([
        file,
      ]);

      if (!uploadResponses || uploadResponses.length === 0) {
        throw new Error('No response received from server');
      }

      const uploadResponse = uploadResponses[0];

      // Update form with uploaded file info
      handleDocumentFormChange(index, 'fileName', uploadResponse.file_name);
      handleDocumentFormChange(index, 'fileUrl', uploadResponse.file_url);

      // Clear uploading state
      setDocumentUploadStates(prev => ({
        ...prev,
        [index]: { uploading: false, error: null },
      }));

      // Clear any existing validation errors for this field
      setDocumentsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${index}_fileName`];
        return newErrors;
      });

      console.log('Document uploaded successfully:', uploadResponse);
    } catch (error) {
      console.error('Document upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      // Set error state
      setDocumentUploadStates(prev => ({
        ...prev,
        [index]: { uploading: false, error: errorMsg },
      }));

      // Clear form fields on error
      handleDocumentFormChange(index, 'fileName', '');
      handleDocumentFormChange(index, 'fileUrl', '');

      // Show error in form validation
      setDocumentsErrors(prev => ({
        ...prev,
        [`${index}_fileName`]: errorMsg,
      }));
    }
  };

  // Validate documents form
  // Helper: get document type metadata from fetched dropdowns
  const getDocumentTypeData = (docTypeName: string) => {
    if (!docTypeName || !documentsData?.data) return undefined;
    return (documentsData.data as any).find((d: any) => d.name === docTypeName);
  };

  // Get document number format/placeholder based on document type (copied from AddClient.DocumentsStep)
  const getDocumentFormat = (docType: string) => {
    const docData: any = getDocumentTypeData(docType);
    const docTypeLower = (docType || '').toLowerCase();

    if (docTypeLower.includes('pan')) {
      return {
        placeholder: 'ABCDE1234F',
        helpText: '10 characters: 5 letters, 4 digits, 1 letter',
        maxLength: 10,
        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        transform: (value: string) =>
          value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage:
          'Invalid PAN format. Must be: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)',
      };
    }
    if (docTypeLower.includes('aadhaar') || docTypeLower.includes('aadhar')) {
      return {
        placeholder: '123456789012',
        helpText: '12 digit Aadhaar number',
        maxLength: 12,
        pattern: /^\d{12}$/,
        transform: (value: string) => value.replace(/[^0-9]/g, ''),
        isNumericOnly: true,
        errorMessage: 'Invalid Aadhaar format. Must be exactly 12 digits',
      };
    }
    if (docTypeLower.includes('passport')) {
      return {
        placeholder: 'A1234567',
        helpText: '1 letter followed by 7 digits',
        maxLength: 8,
        pattern: /^[A-Z]{1}[0-9]{7}$/,
        transform: (value: string) =>
          value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage:
          'Invalid Passport format. Must be: 1 letter followed by 7 digits (e.g., A1234567)',
      };
    }
    if (
      docTypeLower.includes('driving') ||
      docTypeLower.includes('license') ||
      docTypeLower.includes('licence')
    ) {
      return {
        placeholder: 'DL0120230001234',
        helpText: 'Format: XX-DDYYYYNNNNNNN (15-16 characters)',
        maxLength: 16,
        pattern: /^[A-Z]{2}[-]?\d{2}\d{4}\d{7}$/,
        transform: (value: string) =>
          value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        isNumericOnly: false,
        errorMessage:
          'Invalid Driving License format. Example: DL0120230001234',
      };
    }
    if (docTypeLower.includes('gst') || docTypeLower.includes('gstin')) {
      return {
        placeholder: '22AAAAA0000A1Z5',
        helpText: '15 character GST number',
        maxLength: 15,
        pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/,
        transform: (value: string) =>
          value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage:
          'Invalid GST format. Must be 15 characters (e.g., 22AAAAA0000A1Z5)',
      };
    }
    if (docTypeLower.includes('tan')) {
      return {
        placeholder: 'ABCD12345E',
        helpText: '10 characters: 4 letters, 5 digits, 1 letter',
        maxLength: 10,
        pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
        transform: (value: string) =>
          value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage:
          'Invalid TAN format. Must be: 4 letters, 5 digits, 1 letter (e.g., ABCD12345E)',
      };
    }
    if (docTypeLower.includes('cin')) {
      return {
        placeholder: 'U12345MH2020PTC123456',
        helpText: '21 character CIN',
        maxLength: 21,
        pattern: /^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/,
        transform: (value: string) =>
          value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage:
          'Invalid CIN format. Must be 21 characters (e.g., U12345MH2020PTC123456)',
      };
    }
    if (docTypeLower.includes('uan')) {
      return {
        placeholder: '123456789012',
        helpText: '12 digit UAN number',
        maxLength: 12,
        pattern: /^\d{12}$/,
        transform: (value: string) => value.replace(/[^0-9]/g, ''),
        isNumericOnly: true,
        errorMessage: 'Invalid UAN format. Must be exactly 12 digits',
      };
    }

    if (docData?.requires_number) {
      return {
        placeholder: 'Enter numbers only',
        helpText: 'Only numeric characters allowed',
        maxLength: 20,
        pattern: /^\d+$/,
        transform: (value: string) => value.replace(/[^0-9]/g, ''),
        isNumericOnly: true,
        errorMessage: 'Only numeric characters are allowed',
      };
    }

    return {
      placeholder: 'Enter Document No.',
      helpText: 'Enter document number',
      maxLength: 30,
      pattern: null,
      transform: (value: string) =>
        value.toUpperCase().replace(/[^A-Z0-9-/]/g, ''),
      isNumericOnly: false,
      errorMessage: null,
    };
  };

  const validateDocumentNumber = (docType: string, docNumber: string) => {
    if (!docNumber || !docNumber.trim()) return null;
    const format = getDocumentFormat(docType);
    if (format.pattern && !format.pattern.test(docNumber)) {
      return format.errorMessage || 'Invalid format';
    }
    return null;
  };

  // Derive ThroughMSP state from the client's msp_type — overrides all document field validation
  const isThroughMSP = (client as any)?.msp_type === 'ThroughMSP';

  const requiresIssueDate = (docType: string) => {
    if (!docType) return false;
    // ThroughMSP override — all fields optional
    if (isThroughMSP) return false;
    const d = getDocumentTypeData(docType);
    return !!d?.requires_issue;
  };

  const requiresExpiryDate = (docType: string) => {
    if (isThroughMSP) return false;
    const d = getDocumentTypeData(docType);
    return !!d?.requires_expiry;
  };

  // requires_document_number_field = true → Document Number field is mandatory
  // requires_number = true → field accepts integers only (format control only)
  const requiresDocumentNumberField = (docType: string) => {
    if (isThroughMSP) return false;
    const d = getDocumentTypeData(docType);
    return !!d?.requires_document_number_field;
  };

  // Old alias kept for any legacy call-sites
  const requiresDocumentNumber = requiresDocumentNumberField;

  const requiresFile = (docType: string) => {
    if (isThroughMSP) return false;
    const d = getDocumentTypeData(docType);
    return !!d?.requires_file;
  };

  const validateDocumentsForm = () => {
    const errors: Record<string, string> = {};

    editDocumentsFormData.forEach((document, index) => {
      // ThroughMSP: only Document Type is still required (to know what document it is)
      const bypassDynamic = isThroughMSP;

      if (!document.documentType?.trim()) {
        errors[`${index}_documentType`] = 'Document type is required';
      }

      if (!bypassDynamic) {
        // Document Number: required when requires_document_number_field is true
        if (requiresDocumentNumberField(document.documentType)) {
          if (!document.documentNumber?.trim()) {
            errors[`${index}_documentNumber`] = 'Document number is required';
          } else {
            const numErr = validateDocumentNumber(document.documentType, document.documentNumber);
            if (numErr) errors[`${index}_documentNumber`] = numErr;
          }
        } else if (document.documentNumber?.trim()) {
          // Optional but validate format if provided
          const numErr = validateDocumentNumber(document.documentType, document.documentNumber);
          if (numErr) errors[`${index}_documentNumber`] = numErr;
        }

        // Issue Date: required when requires_issue is true
        if (requiresIssueDate(document.documentType)) {
          if (!document.issueDate || document.issueDate === '') {
            errors[`${index}_issueDate`] = 'Issue Date is required for this document type';
          }
        }

        // Expiry Date: required when requires_expiry is true
        if (requiresExpiryDate(document.documentType)) {
          if (!document.expiryDate || document.expiryDate === '') {
            errors[`${index}_expiryDate`] = 'Expiry Date is required for this document type';
          }
        }

        // File: required when requires_file is true
        if (requiresFile(document.documentType)) {
          if (!document.fileName && !document.fileUrl) {
            errors[`${index}_fileName`] = 'Document file upload is required for this document type';
          }
        }
      } else if (document.documentNumber?.trim()) {
        // ThroughMSP: still validate format if a number is provided
        const numErr = validateDocumentNumber(document.documentType, document.documentNumber);
        if (numErr) errors[`${index}_documentNumber`] = numErr;
      }

      // Upload in progress / failed always blocks
      if (documentUploadStates[index]?.uploading) {
        errors[`${index}_fileName`] = 'Please wait for upload to complete';
      }
      if (documentUploadStates[index]?.error) {
        errors[`${index}_fileName`] = documentUploadStates[index]?.error || 'Upload failed';
      }
    });

    setDocumentsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Documents validity checker without setting errors
  const isDocumentsValidNoSet = () => {
    for (let index = 0; index < editDocumentsFormData.length; index++) {
      const document: any = editDocumentsFormData[index];
      if (!document.documentType?.trim()) return false;

      if (!isThroughMSP) {
        // Document Number: required when requires_document_number_field is true
        if (requiresDocumentNumberField(document.documentType)) {
          if (!document.documentNumber?.trim()) return false;
        }
        // Issue/Expiry required per API flags
        if (requiresIssueDate(document.documentType) && !document.issueDate) return false;
        if (requiresExpiryDate(document.documentType) && !document.expiryDate) return false;
        // File required per API flag
        if (requiresFile(document.documentType) && !document.fileName && !document.fileUrl) return false;
      }

      // Always validate format if number is provided
      if (document.documentNumber?.trim()) {
        const numErr = validateDocumentNumber(document.documentType, document.documentNumber);
        if (numErr) return false;
      }

      // Upload in progress / failed always blocks
      if (documentUploadStates[index]?.uploading) return false;
      if (documentUploadStates[index]?.error) return false;
    }
    return true;
  };

  // Handle save documents
  const handleSaveDocuments = async () => {
    if (!validateDocumentsForm()) {
      return;
    }

    setIsUpdatingDocuments(true);
    try {
      // Map documents to API schema
      const documentsPayload = editDocumentsFormData.map(document => ({
        document_type: document.documentType,
        document_no: document.documentNumber,
        document_description: document.documentDescription || '',
        document_issue_date: document.issueDate,
        document_expiry_date: document.expiryDate,
        client_document_file: document.fileUrl || document.fileName,
        status: document.status || 'Active',
      }));

      // PATCH API call
      await apiCall(`/client/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ documents: documentsPayload }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowEditDocumentsModal(false);
      showSuccessToast('Documents updated successfully!');
      // Refetch client data to show changes immediately
      if (typeof mutateClientData === 'function') {
        await mutateClientData();
      }
    } catch (error) {
      console.error('Error updating documents:', error);
      showErrorToast('Failed to update documents. Please try again.');
    } finally {
      setIsUpdatingDocuments(false);
    }
  };

  // Handle documents modal close
  const handleCloseDocumentsModal = () => {
    setShowEditDocumentsModal(false);
    setEditDocumentsFormData([]);
    setDocumentsErrors({});
    setDocumentUploadStates({});
  };

  // ==================== CONTRACTS MANAGEMENT ====================

  // Handle edit contracts
  const handleEditContracts = () => {
    // Prepare contracts data from client with proper field mapping
    const contractsData = client.contracts?.map((contract, index) => ({
      id: index.toString(),
      contractType: contract.contract_type || '',
      paymentTerm: contract.payment_term || '',
      paymentType: contract.payment_type || '',

    })) || [
        {
          id: Math.random().toString(),
          contractType: '',
          paymentTerm: '',
          paymentType: '',

        },
      ];

    setEditContractsFormData(contractsData);
    setContractsErrors({});
    setShowEditContractsModal(true);
  };

  // Handle contracts form field changes
  const handleContractFormChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedContracts = [...editContractsFormData];
    updatedContracts[index] = { ...updatedContracts[index], [field]: value };
    setEditContractsFormData(updatedContracts);

    // Clear error for this field
    const errorKey = `${index}_${field}`;
    if (contractsErrors[errorKey]) {
      setContractsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add new contract
  const handleAddNewContract = () => {
    const newContract = {
      id: Math.random().toString(),
      contractType: '',
      paymentTerm: '',
      paymentType: '',

    };
    setEditContractsFormData([...editContractsFormData, newContract]);
  };

  // Remove contract
  const handleRemoveContract = (index: number) => {
    const updatedContracts = editContractsFormData.filter(
      (_, i) => i !== index
    );
    setEditContractsFormData(updatedContracts);
  };

  // Validate contracts form
  const validateContractsForm = () => {
    const errors: Record<string, string> = {};

    editContractsFormData.forEach((contract, index) => {
      // Contract Type validation
      if (!contract.contractType?.trim()) {
        errors[`${index}_contractType`] = 'Contract type is required';
      }

      // Payment Term validation
      if (!contract.paymentTerm?.trim()) {
        errors[`${index}_paymentTerm`] = 'Payment term is required';
      }

      // Payment Type validation
      if (!contract.paymentType?.trim()) {
        errors[`${index}_paymentType`] = 'Payment type is required';
      }
    });

    setContractsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Contracts validity checker without setting errors
  const isContractsValidNoSet = () => {
    for (let index = 0; index < editContractsFormData.length; index++) {
      const contract: any = editContractsFormData[index];
      if (!contract.contractType?.trim()) return false;
      if (!contract.paymentTerm?.trim()) return false;
      if (!contract.paymentType?.trim()) return false;

    }
    return true;
  };

  // Handle save contracts
  const handleSaveContracts = async () => {
    if (!validateContractsForm()) {
      return;
    }

    setIsUpdatingContracts(true);
    try {
      // Map contracts to API schema
      const contractsPayload = editContractsFormData.map(contract => ({
        contract_type: contract.contractType,
        payment_term: contract.paymentTerm,
        payment_type: contract.paymentType,

      }));

      // PATCH API call
      await apiCall(`/client/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ contracts: contractsPayload }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setShowEditContractsModal(false);
      showSuccessToast('Contracts updated successfully!');
      // Refetch client data to show changes immediately
      if (typeof mutateClientData === 'function') {
        await mutateClientData();
      }
    } catch (error) {
      console.error('Error updating contracts:', error);
      showErrorToast('Failed to update contracts. Please try again.');
    } finally {
      setIsUpdatingContracts(false);
    }
  };

  // Handle contracts modal close
  const handleCloseContractsModal = () => {
    setShowEditContractsModal(false);
    setEditContractsFormData([]);
    setContractsErrors({});
  };

  const tabs = [
    {
      id: 'clientContacts',
      label: 'Client Contacts',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
              Client Contacts
            </Text>
            <div className="flex items-center gap-2">
              <SearchBox
                placeholder="Search contacts"
                onChange={value => setSearchContact(value)}
                className="w-60"
                value={searchContact}
              />
              {canUpdateClients && (
                <Button variant="primary" onClick={handleEditContacts}>
                  Manage Contacts
                </Button>
              )}
              {canUpdateClients && (
                <button
                  className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold flex items-center gap-1"
                  onClick={() => setShowBulkUpload(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                    />
                  </svg>
                  Bulk Upload
                </button>
              )}
            </div>
          </div>
          {/* Bulk Upload Modal */}
          {showBulkUpload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Bulk Upload Contacts
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition"
                    onClick={() => {
                      setShowBulkUpload(false);
                      setBulkFile(null);
                      setExcelData([]);
                      setShowPreview(false);
                    }}
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
                    <div>
                      <FileUpload
                        accept=".xlsx,.xls,.csv"
                        maxSize={10}
                        buttonText="Choose Excel File"
                        onChange={file => {
                          if (file) {
                            const event = { target: { files: [file] } } as any;
                            handleFileChange(event);
                          }
                        }}
                        dragDrop={false}
                        showPreview={true}
                      />
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
                                    const countryCode = String(
                                      row['Country Code'] || ''
                                    );
                                    if (!countryCode) return '';
                                    // If it already starts with +, return as is
                                    if (countryCode.startsWith('+'))
                                      return countryCode;
                                    // If it's numeric, add + prefix
                                    if (/^\d+$/.test(countryCode))
                                      return `+${countryCode}`;
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
                                    {excelValidationErrors[
                                      `row_${rowIndex}_duplicate`
                                    ] && (
                                        <span className="text-red-500 text-xs">
                                          {
                                            excelValidationErrors[
                                            `row_${rowIndex}_duplicate`
                                            ]
                                          }
                                        </span>
                                      )}
                                    {excelValidationErrors[
                                      `row_${rowIndex}_lastName`
                                    ] && (
                                        <span className="text-red-500 text-xs">
                                          {
                                            excelValidationErrors[
                                            `row_${rowIndex}_lastName`
                                            ]
                                          }
                                        </span>
                                      )}
                                    {excelValidationErrors[
                                      `row_${rowIndex}_phone`
                                    ] && (
                                        <span className="text-red-500 text-xs">
                                          {
                                            excelValidationErrors[
                                            `row_${rowIndex}_phone`
                                            ]
                                          }
                                        </span>
                                      )}
                                    {excelValidationErrors[
                                      `row_${rowIndex}_email`
                                    ] && (
                                        <span className="text-red-500 text-xs">
                                          {
                                            excelValidationErrors[
                                            `row_${rowIndex}_email`
                                            ]
                                          }
                                        </span>
                                      )}
                                    {excelValidationErrors[
                                      `row_${rowIndex}_countryCode`
                                    ] && (
                                        <span className="text-red-500 text-xs">
                                          {
                                            excelValidationErrors[
                                            `row_${rowIndex}_countryCode`
                                            ]
                                          }
                                        </span>
                                      )}
                                    {!excelValidationErrors[
                                      `row_${rowIndex}_duplicate`
                                    ] &&
                                      !excelValidationErrors[
                                      `row_${rowIndex}_lastName`
                                      ] &&
                                      !excelValidationErrors[
                                      `row_${rowIndex}_phone`
                                      ] &&
                                      !excelValidationErrors[
                                      `row_${rowIndex}_email`
                                      ] &&
                                      !excelValidationErrors[
                                      `row_${rowIndex}_countryCode`
                                      ] && (
                                        isBulkValidating ? (
                                          <span className="text-blue-500 text-xs flex items-center gap-1">
                                            <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                            Checking...
                                          </span>
                                        ) : (
                                          <span className="text-green-500 text-xs">
                                            Valid
                                          </span>
                                        )
                                      )}
                                  </div>
                                </td>                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Show validation summary */}
                      {Object.keys(excelValidationErrors).length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="text-red-800 font-medium">
                            Validation Errors Found
                          </h4>
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
                      className={`px-8 py-2.5 rounded-lg font-medium transition ${bulkFile &&
                        excelData.length > 0 &&
                        Object.keys(excelValidationErrors).length === 0 &&
                        !isBulkValidating
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      disabled={
                        !bulkFile ||
                        excelData.length === 0 ||
                        Object.keys(excelValidationErrors).length > 0 ||
                        isBulkValidating
                      }
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
          {/* Filtered and paginated contacts */}
          {(() => {
            const filteredContacts = client.contacts?.length
              ? client.contacts.filter(c => {
                const q = searchContact.toLowerCase();
                const fullName = [
                  c.first_name,
                  c.middle_name,
                  c.last_name,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();
                return (
                  fullName.includes(q) ||
                  c.phone_no?.toLowerCase().includes(q) ||
                  c.email?.toLowerCase().includes(q) ||
                  c.designation?.toLowerCase().includes(q)
                );
              })
              : [];

            const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
            const startIndex = (contactsCurrentPage - 1) * contactsPerPage;
            const endIndex = startIndex + contactsPerPage;
            const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

            // Reset to page 1 if search results fit on first page
            if (
              filteredContacts.length > 0 &&
              contactsCurrentPage > totalPages
            ) {
              setContactsCurrentPage(1);
            }

            return (
              <>
                <DataTable
                  columns={[
                    { key: 'name', label: 'NAME' },
                    { key: 'phone', label: 'PHONE' },
                    { key: 'email', label: 'EMAIL' },
                    { key: 'designation', label: 'DESIGNATION' },
                    { key: 'department', label: 'DEPARTMENT' },
                  ]}
                  data={paginatedContacts.map(c => ({
                    name:
                      [c.first_name, c.middle_name, c.last_name]
                        .filter(Boolean)
                        .join(' ') ||
                      c.display_name ||
                      'N/A',
                    phone: formatPhoneNumber(c.phone_no || 'N/A', countryCodesData),
                    email: c.email || 'N/A',
                    designation: c.designation || 'N/A',
                    department: c.department || 'N/A',
                  }))}
                  visibleColumns={{
                    name: true,
                    phone: true,
                    email: true,
                    designation: true,
                    department: true,
                  }}
                  className="mt-4"
                  emptyMessage="No contacts available"
                />
                <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of{' '}
                    {filteredContacts.length} contacts
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setContactsCurrentPage(prev => Math.max(prev - 1, 1))
                      }
                      disabled={contactsCurrentPage === 1}
                      className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {'<'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      page => (
                        <button
                          key={page}
                          onClick={() => setContactsCurrentPage(page)}
                          className={`px-2 py-1 rounded ${contactsCurrentPage === page
                            ? 'bg-blue-400 text-white'
                            : 'border hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setContactsCurrentPage(prev =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={contactsCurrentPage === totalPages || totalPages === 0}
                      className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {'>'}
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ),
      badge: client.contacts ? client.contacts.length : 0,
    },
    {
      id: 'clientDocuments',
      label: 'Client Documents',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
              Client Documents
            </Text>
            <div className="flex items-center gap-2">
              <SearchBox
                placeholder="Search documents"
                onChange={value => setSearchDocument(value)}
                className="w-60"
                value={searchDocument}
              />
              {canUpdateClients && (
                <Button variant="primary" onClick={handleEditDocuments}>
                  Manage Documents
                </Button>
              )}
            </div>
          </div>

          {/* Filtered documents for search */}
          <DataTable
            columns={[
              { key: 'type', label: 'DOCUMENT TYPE' },
              { key: 'number', label: 'DOCUMENT NUMBER' },
              { key: 'description', label: 'DESCRIPTION' },
              { key: 'issue_date', label: 'ISSUE DATE' },
              { key: 'expiry_date', label: 'EXPIRY DATE' },
              {
                key: 'view',
                label: 'DOCUMENT VIEW',
                render: (value: any) => {
                  if (value && value !== 'N/A') {
                    return (
                      <button
                        onClick={() => FileUploadService.openFile(value, 'view')}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View File
                      </button>
                    );
                  }
                  return <span className="text-gray-400">No file</span>;
                },
              },
            ]}
            data={
              client.documents?.length
                ? client.documents
                  .filter(d => {
                    const q = searchDocument.toLowerCase();
                    return (
                      d.document_type?.toLowerCase().includes(q) ||
                      d.document_no?.toLowerCase().includes(q)
                    );
                  })
                  .map(d => ({
                    type: d.document_type || 'N/A',
                    number: d.document_no || 'N/A',
                    description: d.document_description || 'N/A',
                    issue_date: d.document_issue_date || 'N/A',
                    expiry_date: d.document_expiry_date || 'N/A',
                    view: d.client_document_file || 'N/A',
                  }))
                : []
            }
            visibleColumns={{
              type: true,
              number: true,
              description: true,
              issue_date: true,
              expiry_date: true,
              view: true,
            }}
            className="mt-4"
            emptyMessage="No documents available"
          />
          <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
            <span>
              Showing {client.documents?.length || 0} of{' '}
              {client.documents?.length || 0} documents
            </span>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded border">{'<'}</button>
              <span className="px-2 py-1 rounded bg-blue-400 text-white">
                1
              </span>
              <button className="px-2 py-1 rounded border">{'>'}</button>
            </div>
          </div>
        </div>
      ),
      badge: client.documents ? client.documents.length : 0,
    },
  ];

  return (
    <>
      <DetailTemplate
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Clients', path: '/clients' },
              {
                label: `${client.client_name} (${client.client_id})`,
                active: true,
              },
            ]}
            additionalInfo={
              client.created_by || client.created
                ? `Created By ${client.created_by || 'Unknown'}${client.created ? ` | Created on ${formatUIDate(client.created)}` : ''}`
                : undefined
            }
          />
        }
        header={
          <DetailHeader
            name={client.client_name}
            code={client.client_code || 'N/A'}
            codeFormat="suffix"
            avatarSize="sm"
            status={client.client_status || 'Active'}
            contactInfo={{
              location:
                `${client.client_registered_address || ''}, ${client.client_city || ''}, ${client.client_state || ''}, ${client.client_country || ''}`.trim(),
            }}
            website={client.client_website || undefined}
            portalStatus={client.client_portal || 'No Portal'}
            photo={logoViewUrl || client.client_logo}
            auditInfo={{
              lastViewedBy,
              lastViewedOn,
              lastUpdatedBy: client.updated_by || client.created_by,
              lastUpdatedOn: client.updated
                ? formatUIDate(client.updated)
                : undefined,
              createdBy: client.created_by,
              createdOn: client.created
                ? formatUIDate(client.created)
                : undefined,
            }}
            onEdit={() => {
              // Only allow edit if user has update permission
              if (!canUpdateClients) {
                showErrorToast('You do not have permission to edit clients.');
                return;
              }
              handleEditClient();
            }}
            onAddJob={() => {
              // Handle add job requisition
              navigate('/add-job');
            }}
            onOpenJobs={() => {
              // Handle open jobs
              navigate('/job-requisition');
            }}
            openJobsCount={10}
            canEdit={canUpdateClients}
            hideResume={true}
            hideFavorite={true}
          />
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebar={
          <div className="flex flex-col gap-6 w-full items-stretch">
            {/* Client Ownership Card */}
            <Card
              title="User Information"
              className="w-full text-left relative"
            >
              {/* Edit button positioned absolutely - Only show if user has update permission */}
              {canUpdateClients && (
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={handleEditOwnership}
                    title="Edit Ownership"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                </div>
              )}
              {/* Card content */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-gray-600">Client Ownership:</span>{' '}

                {client.ownership ? (
                  Array.isArray(client.ownership) ? (
                    client.ownership.map((owner, index) => (
                      <span key={index} className='font-bold'>{owner}</span>
                    ))
                  ) : (
                    // Split comma-separated string into separate badges
                    client.ownership
                      .split(',')
                      .map((owner, index) => (
                        <span key={index} className='font-bold'>{owner.trim()}</span>
                      ))
                  )
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded font-semibold">
                    N/A
                  </span>
                )}
              </div>
            </Card>
            {/* Client Information Card */}
            <Card
              title="Client Information"
              className="w-full text-left relative"
            >
              {/* Edit button positioned absolutely - Only show if user has update permission */}
              {canUpdateClients && (
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={handleEditClientInfo}
                    title="Edit Client Information"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                </div>
              )}
              <div className="mb-2">
                <span className="text-gray-600">Client ODC:</span>{' '}
                <span className="font-bold">{client.client_odc || 'N/A'}</span>
              </div>
              <hr className="my-2" />
              <div className="mb-2">
                <span className="text-gray-600">Required Documents:</span>{' '}
                <span className="font-bold">
                  {client.client_required_documents || 'N/A'}
                </span>
              </div>
              <hr className="my-2" />
              <div className="mb-2">
                <span className="text-gray-600">Client Type:</span>{' '}
                <span className="font-bold">{client.msp_type || 'N/A'}</span>
              </div>
              <hr className="my-2" />

              <div className="mb-2">
                <span className="text-gray-600">MSP Associate With:</span>{' '}
                <span className="font-bold">
                  {client.associate_msp || 'N/A'}
                </span>
              </div>
            </Card>
            {/* Client Metrics Card - Hidden */}
            {/* <Card
              title="Client Metrics"
              headingIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 17v-6m4 6V7m4 10v-4m4 4V5"
                  />
                </svg>
              }
              className="w-full"
            >
              <div className="flex flex-row gap-4">
                <div className="bg-blue-600 rounded-lg text-white flex flex-col items-center justify-center px-6 py-4">
                  <span className="font-semibold text-base">HeadCount</span>
                  <span className="font-bold text-2xl mt-1">250</span>
                </div>
                <div className="bg-green-600 rounded-lg text-white flex flex-col items-center justify-center px-6 py-4">
                  <span className="font-semibold text-base">Top Line</span>
                  <span className="font-bold text-2xl mt-1">11M</span>
                </div>
                <div className="bg-yellow-400 rounded-lg text-white flex flex-col items-center justify-center px-6 py-4">
                  <span className="font-semibold text-base">Gross Profit</span>
                  <span className="font-bold text-2xl mt-1">1M</span>
                </div>
              </div>
            </Card> */}
            {/* Client Contracts Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 w-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <Text
                    variant="h3"
                    size="lg"
                    weight="semibold"
                    className="mb-0"
                  >
                    Client Contracts
                  </Text>
                </div>
                {canUpdateClients && (
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={handleEditContracts}
                    title="Edit Contracts"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                <DataTable
                  columns={[
                    { key: 'contract_type', label: 'CONTRACT TYPE' },
                    { key: 'payment_term', label: 'PAYMENT TERM' },
                    { key: 'payment_type', label: 'PAYMENT TYPE' },

                  ]}
                  data={
                    client.contracts?.length
                      ? client.contracts.map(contract => ({
                        contract_type: contract.contract_type || 'N/A',
                        payment_term: contract.payment_term || 'N/A',
                        payment_type: contract.payment_type || 'N/A',

                      }))
                      : []
                  }
                  visibleColumns={{
                    contract_type: true,
                    payment_term: true,
                    payment_type: true,
                    start_date: true,
                    end_date: true,
                  }}
                  className="mt-4"
                  emptyMessage="No contracts available"
                  stickyColumns={1}
                />
              </div>
              <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
                <span>
                  Showing {client.contracts?.length || 0} of{' '}
                  {client.contracts?.length || 0} contracts
                </span>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded border">{'<'}</button>
                  <span className="px-2 py-1 rounded bg-blue-400 text-white">
                    1
                  </span>
                  <button className="px-2 py-1 rounded border">{'>'}</button>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Edit Client Modal */}
      <EditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit Client Basic Information"
        isLoading={isUpdating}
        onSave={handleSaveClient}
        isSaveDisabled={!isFormValidNoSet()}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EnhancedInputField
            label="Client Name"
            value={editFormData.client_name}
            onChange={value => handleFormChange('client_name', value)}
            error={formErrors.client_name}
            required
            placeholder="Enter client name"
            gridCols="col-span-1"
            textTransform="capitalize"
          />

          <EnhancedInputField
            label="Client ID"
            value={editFormData.client_id}
            onChange={value => handleFormChange('client_id', value)}
            error={formErrors.client_id}
            required
            placeholder="Enter client id"
            gridCols="col-span-1"
            disabled
            readOnly
          />

          <EnhancedInputField
            label="Client Code"
            value={editFormData.client_code}
            onChange={value => handleFormChange('client_code', value)}
            error={formErrors.client_code}
            placeholder="Enter client code"
            gridCols="col-span-1"
          />

          <EnhancedInputField
            label="Client Display Name"
            value={editFormData.client_display_name}
            onChange={value => handleFormChange('client_display_name', value)}
            error={formErrors.client_display_name}
            placeholder="Enter client display name"
            gridCols="col-span-1"
          />

          {/* Client Logo Upload */}          <div className="col-span-2">
            <AvatarUpload
              label="Client Logo"
              value={editFormData.client_logo}
              preview={editFormData.client_logo_preview}
              onChange={(file: File | null) => {
                // Handle immediate upload when file is selected
                handleLogoUpload(file);
              }}

              error={formErrors.client_logo}
              accept=".jpg,.jpeg,.png,.gif"
              maxSize={5}
              size="lg"
              fallbackIcon="upload"
              showFileName={true}
              uploading={uploadStates?.logo?.uploading}
              uploadError={uploadStates?.logo?.error || undefined}
            />
          </div>

          {/* New Registered Address Section */}
          <div className="col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Registered Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInputField
                label="Registered Address"
                value={editFormData.client_registered_address}
                onChange={value =>
                  handleFormChange('client_registered_address', value)
                }
                error={formErrors.client_registered_address}
                placeholder="Enter registered address"
                gridCols="col-span-2"
                textTransform="capitalize"
                required
              />

              <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <CountryStateCity
                  type="country"
                  label="Client Country"
                  value={editFormData.client_country}
                  onChange={(value: string) =>
                    handleFormChange('client_country', value)
                  }
                  error={formErrors.client_country}
                  required={true}
                  placeholder="Select country"
                />

                <CountryStateCity
                  type="state"
                  label="Client State"
                  value={editFormData.client_state}
                  onChange={(value: string) =>
                    handleFormChange('client_state', value)
                  }
                  error={formErrors.client_state}
                  required={true}
                  country={editFormData.client_country}
                  placeholder="Select state"
                />

                <CountryStateCity
                  type="city"
                  label="Client City"
                  value={editFormData.client_city}
                  onChange={(value: string) =>
                    handleFormChange('client_city', value)
                  }
                  error={formErrors.client_city}
                  required={true}
                  country={editFormData.client_country}
                  state={editFormData.client_state}
                  placeholder="Select city"
                />
              </div>

              <EnhancedInputField
                label="PIN Code"
                type="number"
                value={editFormData.registered_pin_code}
                onChange={value => {
                  // Only allow digits and max 6 characters
                  const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
                  handleFormChange('registered_pin_code', sanitizedValue);
                }}
                error={formErrors.registered_pin_code}
                placeholder="Enter 6-digit PIN code"
                gridCols="col-span-1"
                maxLength={6}
                inputMode="numeric"
                required={true}
              />
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Billing Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInputField
                label="Attention"
                value={editFormData.billing_attention}
                onChange={value => handleFormChange('billing_attention', value)}
                error={formErrors.billing_attention}
                placeholder="Enter attention line"
                gridCols="col-span-2"
                textTransform="capitalize"
              />

              <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <CountryStateCity
                  type="country"
                  label="Country"
                  value={editFormData.billing_country}
                  onChange={(value: string) =>
                    handleFormChange('billing_country', value)
                  }
                  error={formErrors.billing_country}
                  placeholder="Select country"
                />

                <CountryStateCity
                  type="state"
                  label="State"
                  value={editFormData.billing_state}
                  onChange={(value: string) =>
                    handleFormChange('billing_state', value)
                  }
                  error={formErrors.billing_state}
                  country={editFormData.billing_country}
                  placeholder="Select state"
                />

                <CountryStateCity
                  type="city"
                  label="City"
                  value={editFormData.billing_city}
                  onChange={(value: string) =>
                    handleFormChange('billing_city', value)
                  }
                  error={formErrors.billing_city}
                  country={editFormData.billing_country}
                  state={editFormData.billing_state}
                  placeholder="Select city"
                />
              </div>

              <EnhancedInputField
                label="Street Address 1"
                value={editFormData.billing_street1}
                onChange={value => handleFormChange('billing_street1', value)}
                error={formErrors.billing_street1}
                placeholder="Enter street address line 1"
                gridCols="col-span-2"
                textTransform="capitalize"
              />

              <EnhancedInputField
                label="Street Address 2"
                value={editFormData.billing_street2}
                onChange={value => handleFormChange('billing_street2', value)}
                error={formErrors.billing_street2}
                placeholder="Enter street address line 2 (optional)"
                gridCols="col-span-2"
                textTransform="capitalize"
              />

              <EnhancedInputField
                label="Postal Code"
                type="number"
                value={editFormData.billing_postal_code}
                onChange={value => {
                  // Only allow digits and max 6 characters
                  const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
                  handleFormChange('billing_postal_code', sanitizedValue);
                }}
                error={formErrors.billing_postal_code}
                placeholder="Enter 6-digit postal code (optional)"
                gridCols="col-span-1"
                maxLength={6}
                inputMode="numeric"
              />

              <EnhancedInputField
                label="Phone"
                type="tel"
                value={editFormData.billing_phone}
                onChange={value => {
                  // Only allow digits and max 10 characters
                  const sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
                  handleFormChange('billing_phone', sanitizedValue);
                }}
                error={formErrors.billing_phone}
                placeholder="Enter 10-digit phone number (optional)"
                gridCols="col-span-1"
                maxLength={10}
                inputMode="tel"
              />
            </div>
          </div>

          <EnhancedInputField
            label="Website"
            value={editFormData.website}
            onChange={value => handleFormChange('website', value)}
            error={formErrors.website}
            type="url"
            placeholder="Enter website URL"
            gridCols="col-span-1"
            required
          />

          <EnhancedInputField
            label="Client Portal"
            value={editFormData.client_portal}
            onChange={value => handleFormChange('client_portal', value)}
            error={formErrors.client_portal}
            type="url"
            placeholder="Enter portal URL (e.g., www.xyz.com)"
            gridCols="col-span-1"
            textTransform="lowercase"
          />

          <SearchDropdown
            label="Status"
            value={editFormData.status}
            onChange={value => {
              const statusValue = Array.isArray(value)
                ? value[0]?.value
                : value?.value;
              handleFormChange('status', statusValue || null);
            }}
            options={statusOptions}
            placeholder="Select status"
            required
            isSearchable
            isClearable
          />
        </div>
      </EditModal>

      {/* Edit Client Information Modal */}
      <EditModal
        isOpen={showClientInfoModal}
        onClose={handleCloseClientInfoModal}
        title="Edit Client Information"
        isLoading={isUpdatingClientInfo}
        onSave={handleSaveClientInfo}
        isSaveDisabled={!isClientInfoValidNoSet()}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Client ODC - Multi-select */}
          <SearchDropdown
            label="Client ODC"
            value={clientInfoFormData.client_odc}
            onChange={value => {
              const odcValue = Array.isArray(value)
                ? value.map(v => v.value)
                : value?.value
                  ? [value.value]
                  : [];
              handleClientInfoFormChange('client_odc', odcValue);
            }}
            options={clientODCOptions}
            placeholder="Select client ODC locations"
            required
            isMulti
            isSearchable
            isClearable
            onInputChange={(input: string) => setLocationSearch(input)}
            error={clientInfoErrors.client_odc}
            loading={countriesLoading}
          />

          {/* Required Documents - Multi-select */}
          <SearchDropdown
            label="Required Documents"
            value={clientInfoFormData.required_documents}
            onChange={value => {
              const docsValue = Array.isArray(value)
                ? value.map(v => v.value)
                : value?.value
                  ? [value.value]
                  : [];
              handleClientInfoFormChange('required_documents', docsValue);
            }}
            options={requiredDocumentsOptions}
            placeholder="Select required documents"
            required
            isMulti
            isSearchable
            isClearable
            onInputChange={(input: string) => setDocumentSearch(input)}
            error={clientInfoErrors.required_documents}
            loading={!documentsData}
          />

          {/* Client Type Dropdown */}
          <SearchDropdown
            label="Client Type"
            value={clientInfoFormData.msp_type}
            onChange={value => {
              const mspTypeValue = Array.isArray(value)
                ? value.map(v => v.value)
                : value?.value || '';
              handleClientInfoFormChange('msp_type', mspTypeValue);
            }}
            options={mspTypeOptions}
            placeholder="Select Client Type"
            isSearchable
            isClearable
            error={clientInfoErrors.msp_type}
            loading={!mspTypeData}
          />

          {/* MSP Associate With Dropdown - Disabled by default, enabled only when "ThroughMSP" is selected */}
          <SearchDropdown
            label="MSP Associate With"
            value={clientInfoFormData.msp_associate}
            onChange={value => {
              const mspAssociateValue = Array.isArray(value)
                ? value.map(v => v.value)
                : value?.value || '';
              handleClientInfoFormChange('msp_associate', mspAssociateValue);
            }}
            options={mspAssociateOptions}
            placeholder="Select MSP Associate"
            isSearchable
            isClearable
            disabled={clientInfoFormData.msp_type !== 'ThroughMSP'}
            onInputChange={(input: string) => setMspAssociateSearch(input)}
            error={clientInfoErrors.msp_associate}
            loading={mspAssociateLoading}
          />
        </div>
      </EditModal>

      {/* Edit Client Ownership Modal */}
      <EditModal
        isOpen={showOwnershipModal}
        onClose={handleCloseOwnershipModal}
        title="Edit Ownership"
        isLoading={isUpdatingOwnership}
        onSave={handleSaveOwnership}
        isSaveDisabled={!isOwnershipValidNoSet()}
        size="md"
      >
        <div className="space-y-4">
          <SearchDropdown
            label="Select Ownership"
            value={ownershipFormData.ownership}
            onChange={value => {
              const ownershipValue = Array.isArray(value)
                ? value.map(v => v.value)
                : value?.value
                  ? [value.value]
                  : [];
              handleOwnershipFormChange('ownership', ownershipValue);
            }}
            options={ownershipOptions}
            isMulti={true}
            isClearable={true}
            isSearchable={true}
            onInputChange={(input: string) => setUserSearch(input)}
            placeholder="Select multiple owners"
            error={ownershipErrors.ownership}
            loading={!usersData}
            required
          />
        </div>
      </EditModal>

      {/* Manage Contacts Modal */}
      <EditModal
        isOpen={showEditContactsModal}
        onClose={handleCloseContactsModal}
        title="Manage Contacts"
        isLoading={isUpdatingContacts}
        onSave={handleSaveContacts}
        isSaveDisabled={!isContactsValidNoSet()}
        size="xxl"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {editContactsFormData.map((contact, idx) => (
              <div
                key={contact.id || idx}
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
                      onClick={() => handleRemoveContact(idx)}
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
                      onChange={value =>
                        handleContactFormChange(idx, 'firstName', value)
                      }
                      type="text"
                      textTransform="capitalize"
                      placeholder="Enter first name"
                      required
                      error={contactsErrors[`${idx}_firstName`]}
                    />
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Middle Name"
                      value={contact.middleName}
                      onChange={value =>
                        handleContactFormChange(idx, 'middleName', value)
                      }
                      type="text"
                      textTransform="capitalize"
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Last Name"
                      value={contact.lastName}
                      onChange={value =>
                        handleContactFormChange(idx, 'lastName', value)
                      }
                      type="text"
                      textTransform="capitalize"
                      placeholder="Enter last name"
                      required
                      error={contactsErrors[`${idx}_lastName`]}
                    />
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Display Name"
                      value={contact.displayName}
                      onChange={() => { }}
                      type="text"
                      placeholder="Auto-generated from first, middle and last name"
                      disabled
                      readOnly
                      textTransform="capitalize"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
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
                              handleContactFormChange(
                                idx,
                                'countryCode',
                                option.value
                              );
                            } else {
                              // Clear action
                              handleContactFormChange(
                                idx,
                                'countryCode',
                                ''
                              );
                            }
                          }}
                          onInputChange={() => { }}
                          placeholder="Search code..."
                          error={contactsErrors[`${idx}_countryCode`]}
                          required={true}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10 digit phone number"
                          inputMode="tel"
                          value={contact.phone}
                          onChange={e =>
                            handleContactFormChange(
                              idx,
                              'phone',
                              e.target.value
                            )
                          }
                          className={`w-full h-[42px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(contactsErrors[`${idx}_phone`] || contactDuplicateErrors[`${idx}_phone`] || contactLocalDuplicateErrors[`${idx}_phone`])
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300'
                            } ${validatingContactFields[`${idx}_phone`] ? 'pr-10' : ''}`}
                        />
                        {validatingContactFields[`${idx}_phone`] && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {(contactsErrors[`${idx}_phone`] || contactDuplicateErrors[`${idx}_phone`] || contactLocalDuplicateErrors[`${idx}_phone`]) && (
                      <p className="text-red-500 text-sm mt-1">
                        {contactsErrors[`${idx}_phone`] || contactDuplicateErrors[`${idx}_phone`] || contactLocalDuplicateErrors[`${idx}_phone`]}
                      </p>
                    )}
                    {!validatingContactFields[`${idx}_phone`] && !contactDuplicateErrors[`${idx}_phone`] && !contactLocalDuplicateErrors[`${idx}_phone`] && !contactsErrors[`${idx}_phone`] && contact.phone?.length === 10 && (
                      <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                        <span>✓</span> Phone number is available
                      </p>
                    )}
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Email"
                      value={contact.email}
                      onChange={value =>
                        handleContactFormChange(idx, 'email', value)
                      }
                      type="email"
                      textTransform="lowercase"
                      placeholder="Enter email address"
                      required
                      autoComplete="email"
                      gridCols=""
                      error={contactsErrors[`${idx}_email`] || contactDuplicateErrors[`${idx}_email`] || contactLocalDuplicateErrors[`${idx}_email`]}
                      loading={validatingContactFields[`${idx}_email`]}
                    />
                    {!validatingContactFields[`${idx}_email`] && !contactDuplicateErrors[`${idx}_email`] && !contactLocalDuplicateErrors[`${idx}_email`] && !contactsErrors[`${idx}_email`] && contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && (
                      <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                        <span>✓</span> Email is available
                      </p>
                    )}
                  </div>
                  <div>
                    <SearchDropdown
                      label="Designation"
                      showAddButton={true}
                      dropdownType="Designation"
                      dropdownLabel="Designation"
                      value={contact.designation}
                      onChange={value => {
                        // SearchDropdown returns DropdownOption, extract value
                        const designationValue = Array.isArray(value)
                          ? value[0]?.value || ''
                          : value?.value || '';
                        handleContactFormChange(
                          idx,
                          'designation',
                          designationValue
                        );
                      }}
                      options={designationOptions}
                      placeholder={
                        designationsData
                          ? 'Select Designation'
                          : 'Loading designations...'
                      }
                      required
                      isSearchable
                      isClearable
                      onInputChange={(input: string) =>
                        setDesignationSearch(input)
                      }
                      error={contactsErrors[`${idx}_designation`]}
                    />
                  </div>
                <div className='col-span-2'>
                    <SearchDropdown
                      label="Department"
                      showAddButton={true}
                      dropdownType="Department"
                      dropdownLabel="Department"
                      value={
                        Array.isArray(contact.department)
                          ? contact.department
                          : typeof contact.department === 'string' &&
                            contact.department
                            ? contact.department
                              .split(',')
                              .map((d: string) => d.trim())
                            : []
                      }
                      onChange={value => {
                        // Department is multi-select, extract values from DropdownOptions and join
                        const departmentValue = Array.isArray(value)
                          ? value.map(v => v.value).join(', ')
                          : value?.value || '';
                        handleContactFormChange(
                          idx,
                          'department',
                          departmentValue
                        );
                      }}
                      options={departmentOptions}
                      placeholder={
                        departmentsData
                          ? 'Select Departments'
                          : 'Loading departments...'
                      }
                      required
                      isMulti
                      isSearchable
                      onInputChange={(input: string) =>
                        setDepartmentSearch(input)
                      }
                      error={contactsErrors[`${idx}_department`]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleAddNewContact}
            className="w-full"
          >
            <Icon name="plus" size={16} className="mr-2" />
            Add Contact
          </Button>
        </div>
      </EditModal>

      {/* Manage Documents Modal */}
      <EditModal
        isOpen={showEditDocumentsModal}
        onClose={handleCloseDocumentsModal}
        title="Manage Documents"
        isLoading={isUpdatingDocuments}
        onSave={handleSaveDocuments}
        isSaveDisabled={!isDocumentsValidNoSet()}
        size="xl"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {editDocumentsFormData.map((document, index) => (
              <div
                key={document.id || index}
                className="grid grid-cols-1 gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    Document {index + 1}
                  </div>
                  {!document.documentType?.toLowerCase().includes('pan') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Icon name="trash" size={16} />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <SearchDropdown
                    label="Document Type"
                    value={document.documentType || ''}
                    onChange={value => {
                      // SearchDropdown returns DropdownOption, extract value
                      const docTypeValue = Array.isArray(value)
                        ? value[0]?.value || ''
                        : value?.value || '';
                      handleDocumentFormChange(
                        index,
                        'documentType',
                        docTypeValue
                      );
                    }}
                    options={requiredDocumentsOptions}
                    placeholder="Select"
                    error={documentsErrors[`${index}_documentType`]}
                    required={!isThroughMSP}
                    isSearchable
                    isClearable
                    onInputChange={(input: string) => setDocumentSearch(input)}
                    loading={!documentsData}

                  />
                  {/* Document Number with dynamic format */}
                  {(() => {
                    const format = getDocumentFormat(document.documentType || '');
                    return (
                      <div>
                        <EnhancedInputField
                          label="Document Number"
                          value={document.documentNumber || ''}
                          onChange={value => {
                            const transformed = format.transform(value);
                            handleDocumentFormChange(index, 'documentNumber', transformed);
                          }}
                          type={format.isNumericOnly ? 'tel' : 'text'}
                          inputMode={format.isNumericOnly ? 'numeric' : 'text'}
                          placeholder={format.placeholder}
                          required={requiresDocumentNumberField(document.documentType)}
                          maxLength={format.maxLength}
                          helpText={
                            !document.documentType
                              ? 'Select document type first'
                              : format.helpText || (requiresDocumentNumberField(document.documentType) ? 'Required for this document type' : 'Enter document number (optional)')
                          }
                        />
                        {documentsErrors[`${index}_documentNumber`] && (
                          <span className="text-red-500 text-sm">
                            {documentsErrors[`${index}_documentNumber`]}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="md:col-span-2">
                    <EnhancedInputField
                      label="Document Description"
                      value={document.documentDescription || ''}
                      onChange={value =>
                        handleDocumentFormChange(index, 'documentDescription', value)
                      }
                      type="text"
                      placeholder="Enter document description (optional)"
                      helpText="Optional field for additional document details"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <EnhancedInputField
                      label="Issue Date"
                      type="date"
                      value={document.issueDate || ''}
                      onChange={value =>
                        handleDocumentFormChange(index, 'issueDate', value)
                      }
                      max={new Date().toISOString().split('T')[0]}
                      placeholder="dd/mm/yyyy"
                      required={requiresIssueDate(document.documentType)}
                      disabled={!isThroughMSP && !requiresIssueDate(document.documentType)}
                      helpText={
                        isThroughMSP
                          ? 'Optional. Cannot be a future date'
                          : requiresIssueDate(document.documentType)
                            ? 'Required. Cannot be a future date'
                            : 'Not required for this document type'
                      }
                    />
                    {documentsErrors[`${index}_issueDate`] && (
                      <span className="text-red-500 text-sm">
                        {documentsErrors[`${index}_issueDate`]}
                      </span>
                    )}
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Expiry Date"
                      type="date"
                      value={document.expiryDate || ''}
                      onChange={value =>
                        handleDocumentFormChange(index, 'expiryDate', value)
                      }
                      placeholder="dd/mm/yyyy"
                      min={document.issueDate || undefined}
                      required={requiresExpiryDate(document.documentType)}
                      disabled={!isThroughMSP && !requiresExpiryDate(document.documentType)}
                      helpText={
                        isThroughMSP
                          ? 'Optional. Must be on or after Issue Date if provided'
                          : requiresExpiryDate(document.documentType)
                            ? 'Required. Must be on or after Issue Date'
                            : 'Not required for this document type'
                      }
                    />
                    {documentsErrors[`${index}_expiryDate`] && (
                      <span className="text-red-500 text-sm">
                        {documentsErrors[`${index}_expiryDate`]}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <FileUpload
                      label={`Upload Document${!isThroughMSP && requiresFile(document.documentType) ? ' *' : ''}`}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      maxSize={10}
                      onChange={async file => {
                        if (file) {
                          await handleFileUpload(index, file);
                        } else if (file === null) {
                          // Clear the file
                          const updated = [...editDocumentsFormData];
                          updated[index] = {
                            ...updated[index],
                            fileName: '',
                            fileUrl: '',
                          };
                          setEditDocumentsFormData(updated);
                        }
                      }}
                      uploading={documentUploadStates[index]?.uploading}
                      error={(documentUploadStates[index]?.error || documentsErrors[`${index}_fileName`]) || undefined}
                      currentFile={
                        editDocumentsFormData[index]?.fileName
                          ? { name: editDocumentsFormData[index].fileName }
                          : undefined
                      }
                      onViewFile={
                        editDocumentsFormData[index]?.fileUrl
                          ? () => FileUploadService.openFile(editDocumentsFormData[index].fileUrl!)
                          : undefined
                      }
                      dragDrop={true}
                      helpText={!isThroughMSP && requiresFile(document.documentType) ? 'Required: Upload a document file' : 'Optional: Upload a document file (PDF, DOC, JPG, PNG)'}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleAddNewDocument}
            className="w-full"
          >
            <Icon name="plus" size={16} className="mr-2" />
            Add Document
          </Button>
        </div>
      </EditModal>

      {/* Manage Contracts Modal */}
      <EditModal
        isOpen={showEditContractsModal}
        onClose={handleCloseContractsModal}
        title="Manage Contracts"
        isLoading={isUpdatingContracts}
        onSave={handleSaveContracts}
        isSaveDisabled={!isContractsValidNoSet()}
        size="xl"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {editContractsFormData.map((contract, index) => (
              <div
                key={contract.id || index}
                className="grid grid-cols-1 gap-4 p-4 border rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <SearchDropdown
                      label="Contract Type"
                      value={contract.contractType || ''}
                      onChange={value => {
                        const contractTypeValue = Array.isArray(value)
                          ? value[0]?.value || ''
                          : value?.value || '';
                        handleContractFormChange(
                          index,
                          'contractType',
                          contractTypeValue
                        );
                      }}
                      options={contractTypeOptions}
                      placeholder="Select Contract Type"
                      error={contractsErrors[`${index}_contractType`]}
                      required
                      isSearchable
                      isClearable
                      loading={!contractTypeData}
                    />
                  </div>
                  <div>
                    <SearchDropdown
                      label="Payment Term"
                      value={contract.paymentTerm || ''}
                      onChange={value => {
                        const paymentTermValue = Array.isArray(value)
                          ? value[0]?.value || ''
                          : value?.value || '';
                        handleContractFormChange(
                          index,
                          'paymentTerm',
                          paymentTermValue
                        );
                      }}
                      options={paymentTermOptions}
                      placeholder="Select Payment Term"
                      error={contractsErrors[`${index}_paymentTerm`]}
                      required
                      isSearchable
                      isClearable
                      loading={!paymentTermData}
                    />
                  </div>
                  <div>
                    <SearchDropdown
                      label="Payment Type"
                      value={contract.paymentType || ''}
                      onChange={value => {
                        const paymentTypeValue = Array.isArray(value)
                          ? value[0]?.value || ''
                          : value?.value || '';
                        handleContractFormChange(
                          index,
                          'paymentType',
                          paymentTypeValue
                        );
                      }}
                      options={paymentTypeOptions}
                      placeholder="Select Payment Type"
                      error={contractsErrors[`${index}_paymentType`]}
                      required
                      isSearchable
                      isClearable
                      loading={!paymentTypeData}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContract(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon name="trash" size={16} />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleAddNewContract}
              className="w-full"
            >
              <Icon name="plus" size={16} className="mr-2" />
              Add Contract
            </Button>
          </div>
        </div>
      </EditModal >
    </>
  );
};

export default ClientDetailPage;
