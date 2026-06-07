import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../organisms/BreadCrumb';
import DetailTemplate from '../../templates/DetailTemplate';
import Text from '../../atoms/Text';
import DataTable from '../../molecules/DataTable';
import Card from '../../molecules/Card';
import { suppliersAPI } from '../../../utils/api/SuppliersAPI';
import { apiCall } from '../../../utils/api/useSWR';
import { useAuth } from '../../auth/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { SupplierData } from '../../../types/supplier';
import { showErrorToast, showSuccessToast } from '../../../utils/toast';
import { formatPhoneNumber } from '../../../utils/textUtils';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Pagination from '../../molecules/Pagination/Pagination';
import { useURLPagination } from '../../../hooks';
import SupplierHeader from './SupplierHeader';
import EditAddContact from './Modal/EditAddContact';
import EditAddDocument from './Modal/EditAddDocument';
import EditAddContract from './Modal/EditAddContract';
import EditSupplierInformation from './Modal/EditSupplierInformation';
import EditSupplierHeader from './Modal/EditSupplierHeader';
import { formatUIDate } from '../../../utils/dateFormat';
import FileUploadService from '../../../services/fileUploadService';

const SupplierDetailPage: React.FC = () => {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canEdit] = useState(true);
  const [activeTab, setActiveTab] = useState('supplierContacts');
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditContactsModal, setShowEditContactsModal] = useState(false);
  const [showEditDocumentsModal, setShowEditDocumentsModal] = useState(false);
  const [showEditContractsModal, setShowEditContractsModal] = useState(false);
  const [showEditSupplierInfoModal, setShowEditSupplierInfoModal] = useState(false);
  const [showEditSupplierHeaderModal, setShowEditSupplierHeaderModal] = useState(false);
  const [logoViewUrl, setLogoViewUrl] = useState<string>('');

  // Bulk upload (contacts) states
  const [showBulkUploadContacts, setShowBulkUploadContacts] = useState(false);
  const [bulkFileContacts, setBulkFileContacts] = useState<File | null>(null);
  const [excelDataContacts, setExcelDataContacts] = useState<any[]>([]);
  const [showPreviewContacts, setShowPreviewContacts] = useState(false);
  const [excelValidationErrorsContacts, setExcelValidationErrorsContacts] = useState<Record<string, string>>({});

  // Country codes for contact modal
  const [countryCodes, setCountryCodes] = useState<Array<{ value: string; label: string }>>([]);
  const [countryCodesLoading, setCountryCodesLoading] = useState(false);
  const { user } = useAuth();

  // URL-based pagination for contacts and documents
  const {
    currentPage: contactsCurrentPage,
    limit: contactsItemsPerPage,
    setPage: setContactsCurrentPage,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 5,
    paramNames: { page: 'contactsPage', limit: 'contactsLimit' },
  });

  const {
    currentPage: documentsCurrentPage,
    limit: documentsItemsPerPage,
    setPage: setDocumentsCurrentPage,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 5,
    paramNames: { page: 'documentsPage', limit: 'documentsLimit' },
  });
  // Fetch supplier data
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!supplierId) {
        showErrorToast('Supplier ID is missing');
        navigate('/suppliers');
        return;
      }

      setLoading(true);
      try {
        const data = await suppliersAPI.fetchSupplierById(supplierId);
        setSupplierData(data);
      } catch (error) {
        console.error('Error fetching supplier:', error);
        showErrorToast('Failed to load supplier details');
        navigate('/suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [supplierId, navigate]);

  // Fetch presigned URL for the supplier logo
  useEffect(() => {
    const fetchLogoViewUrl = async () => {
      if (supplierData?.supplier_logo) {
        try {
          const url = await FileUploadService.getFileViewUrl(supplierData.supplier_logo);
          setLogoViewUrl(url);
        } catch (error) {
          console.error('Error fetching logo view URL:', error);
        }
      } else {
        setLogoViewUrl('');
      }
    };

    fetchLogoViewUrl();
  }, [supplierData?.supplier_logo]);

  // Fetch country codes for contact phone field (used by EditAddContact)
  useEffect(() => {
    const fetchCountryCodes = async () => {
      setCountryCodesLoading(true);
      try {
        const response = await fetch('https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries/codes');
        if (!response.ok) throw new Error('Failed to fetch country codes');
        const data = await response.json();
        if (data && data.data) {
          const formatted = data.data.map((c: any) => ({ value: c.dial_code, label: c.dial_code }));
          setCountryCodes(formatted);
        }
      } catch (err) {
        console.warn('Could not load country codes', err);
      } finally {
        setCountryCodesLoading(false);
      }
    };
    fetchCountryCodes();
  }, []);

  // ---------- Bulk Upload (Contacts) helpers (copied/adapted from ClientDetail) ----------
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
              if ('richText' in cellValue && Array.isArray((cellValue as any).richText)) {
                cellValue = (cellValue as any).richText.map((rt: any) => rt.text).join('');
              } else if ('text' in cellValue && typeof (cellValue as any).text === 'string') {
                cellValue = (cellValue as any).text;
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

      setExcelDataContacts(rows);
      setShowPreviewContacts(true);
      validateExcelDataContacts(rows);
      return rows;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      showErrorToast('Failed to parse Excel file. Please make sure it follows the template format.');
      return [];
    }
  };

  const validateExcelDataContacts = (data: any[]) => {
    const errors: Record<string, string> = {};
    const seen = new Set<string>();

    data.forEach((row, index) => {
      const email = (row['Email'] || '').toLowerCase().trim();
      const phone = (row['Phone'] || '').replace(/\D/g, '');
      const key = `${email}|${phone}`;

      if (seen.has(key)) errors[`row_${index}_duplicate`] = 'Duplicate contact (same email/phone)';
      else seen.add(key);

      const lastName = row['Last Name'] || '';
      if (!lastName || lastName.trim() === '') errors[`row_${index}_lastName`] = 'Last Name is required';

      const phoneVal = row['Phone'] || '';
      if (phoneVal && phoneVal.trim()) {
        const clean = phoneVal.replace(/\D/g, '');
        if (clean.length !== 10) errors[`row_${index}_phone`] = 'Phone must be exactly 10 digits';
      } else {
        errors[`row_${index}_phone`] = 'Phone is required';
      }

      const emailVal = row['Email'] || '';
      if (emailVal && emailVal.trim()) {
        const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!rx.test(emailVal)) errors[`row_${index}_email`] = 'Please enter a valid email address';
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

    setExcelValidationErrorsContacts(errors);
    return Object.keys(errors).length === 0;
    return Object.keys(errors).length === 0;
  };

  const getValidationErrorMessage = () => {
    const rowErrors: Record<number, string[]> = {};
    Object.keys(excelValidationErrorsContacts).forEach(key => {
      const match = key.match(/row_(\d+)_(phone|email|lastName|duplicate|countryCode)/);
      if (match) {
        const rowIndex = parseInt(match[1]);
        const error = excelValidationErrorsContacts[key];
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

  const handleFileChangeContacts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFileContacts(file);
    setShowPreviewContacts(false);
    setExcelDataContacts([]);
    setExcelValidationErrorsContacts({});
    if (file) parseExcelFile(file);
  };

  const handleBulkUploadContacts = async () => {
    if (Object.keys(excelValidationErrorsContacts).length > 0) {
      showErrorToast('Please fix validation errors before uploading');
      return;
    }

    if (excelDataContacts.length > 0 && supplierData) {
      try {
        const newContacts = excelDataContacts.map(row => {
          let countryCode = row['Country Code'] || '';
          if (countryCode && typeof countryCode === 'string' && countryCode.includes(' ')) countryCode = countryCode.split(' ')[0];
          else if (countryCode && typeof countryCode === 'string' && countryCode.startsWith('+')) { }
          else if (countryCode && typeof countryCode === 'string' && /^\d+$/.test(countryCode)) countryCode = `+${countryCode}`;
          else if (!countryCode && countryCodes.length > 0) countryCode = countryCodes[0].value;

          const cleanPhone = row['Phone'] ? String(row['Phone']).replace(/\s+/g, '') : '';
          const phoneNo = countryCode && cleanPhone ? `${countryCode}${cleanPhone}` : cleanPhone || '';

          return {
            phone: phoneNo,
            email: row['Email'] || '',
            first_name: row['First Name'] || '',
            middle_name: row['Middle Name'] || '',
            last_name: row['Last Name'] || '',
            display_name: row['Display Name'] || '',
            designation: row['Designation'] || '',
            department: row['Department'] ? (Array.isArray(row['Department']) ? row['Department'].join(', ') : row['Department']) : '',
          };
        });

        const existing = supplierData.contacts || [];
        const all = [...existing, ...newContacts];

        await apiCall(`/supplier/${supplierData.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ contacts: all, updated_by: user?.display_name || 'Unknown User' }),
          headers: { 'Content-Type': 'application/json' },
        });

        setShowBulkUploadContacts(false);
        setBulkFileContacts(null);
        setExcelDataContacts([]);
        setShowPreviewContacts(false);
        setExcelValidationErrorsContacts({});

        showSuccessToast('Contacts uploaded successfully!');
        // Refresh supplier data
        try {
          const refreshed = await suppliersAPI.fetchSupplierById(String(supplierData.id));
          setSupplierData(refreshed);
        } catch (err) {
          // ignore
        }
      } catch (error) {
        console.error('Error uploading contacts:', error);
        showErrorToast('Failed to upload contacts. Please try again.');
      }
    }
  };

  const downloadExcelTemplateContacts = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Contacts');
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

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } } as any;
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Fetch designation & department lists from supplier dropdowns
      const designationResp: any = await apiCall(`/supplierdropdowns/Designation?page=1&limit=1000`);
      const designationList = designationResp?.data?.data?.map((d: any) => d.name) || [];
      const departmentResp: any = await apiCall(`/supplierdropdowns/Department?page=1&limit=1000`);
      const departmentList = departmentResp?.data?.data?.map((d: any) => d.name) || [];

      if (designationList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          const cell = worksheet.getCell(`G${i}`);
          (cell as any).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${designationList.join(',')}"`],
            showErrorMessage: true,
          } as any;
        }
      }

      if (departmentList.length > 0) {
        for (let i = 2; i <= 1000; i++) {
          const cell = worksheet.getCell(`H${i}`);
          (cell as any).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${departmentList.join(',')}"`],
            showErrorMessage: true,
          } as any;
        }
      }

      const countryCodeList = countryCodes.map(cc => cc.value).join(',');
      for (let i = 2; i <= 1000; i++) {
        const cell = worksheet.getCell(`D${i}`);
        (cell as any).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${countryCodeList}"`],
          showErrorMessage: true,
        } as any;
      }

      (worksheet.getCell('A2') as any).note = 'Fill in the contact details. Display Name will be auto-generated from First Name + Middle Name + Last Name.';

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const now = new Date();
      const formatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      saveAs(blob, `Bulk_contacts_${formatted}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel template:', error);
      showErrorToast('Failed to generate Excel template. Please try again.');
    }
  };

  // Format tables and pagination (must be before any early returns to satisfy hooks ordering)
  const contactsTableData = ((supplierData?.contacts) || []).map((contact: any, index: number) => ({
    id: index.toString(),
    name: contact.display_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    phone: formatPhoneNumber(contact.phone || '-', countryCodes),
    email: contact.email || '-',
    designation: contact.designation || '-',
    department: contact.department || '-',
  }));

  const documentsTableData = ((supplierData?.documents) || []).map((doc: any, index: number) => ({
    id: index.toString(),
    document_type: doc.document_type || '-',
    document_no: doc.document_no || '-',
    issue_date: doc.issue_date || doc.document_issue_date || '-',
    expiry_date: doc.expiry_date || doc.document_expiry_date || '-',
    document_file: doc.document_file || doc.document_url || doc.document_file_name || '',
  }));

  const contractsTableData = (supplierData?.financial_details && Array.isArray(supplierData.financial_details))
    ? supplierData.financial_details.map((contract: any, index: number) => ({
      id: index.toString(),
      contract_type: contract.contract_type || '-',
      payment_term: contract.payment_term || '-',
      payment_type: contract.payment_type || '-',
    }))
    : [];

  const contactsTotalPages = Math.ceil(contactsTableData.length / contactsItemsPerPage);
  const contactsStartIndex = Math.max(0, (contactsCurrentPage - 1) * contactsItemsPerPage);
  const contactsEndIndex = contactsStartIndex + contactsItemsPerPage;
  const contactsPaginatedData = contactsTableData.slice(contactsStartIndex, contactsEndIndex);

  const documentsTotalPages = Math.ceil(documentsTableData.length / documentsItemsPerPage);
  const documentsStartIndex = Math.max(0, (documentsCurrentPage - 1) * documentsItemsPerPage);
  const documentsEndIndex = documentsStartIndex + documentsItemsPerPage;
  const documentsPaginatedData = documentsTableData.slice(documentsStartIndex, documentsEndIndex);

  useEffect(() => {
    if (contactsTableData.length > 0 && contactsCurrentPage > contactsTotalPages) {
      setContactsCurrentPage(1);
    }
  }, [contactsTableData.length, contactsCurrentPage, contactsTotalPages]);

  useEffect(() => {
    if (documentsTableData.length > 0 && documentsCurrentPage > documentsTotalPages) {
      setDocumentsCurrentPage(1);
    }
  }, [documentsTableData.length, documentsCurrentPage, documentsTotalPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Text variant="p">Loading supplier details...</Text>
      </div>
    );
  }

  if (!supplierData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Text variant="p">Supplier not found</Text>
      </div>
    );
  }

  // Tab content
  const tabs = [
    {
      id: 'supplierContacts',
      label: 'Supplier Contacts',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
              Supplier Contacts
            </Text>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={() => setShowEditContactsModal(true)}>
                  <Icon name="plus" size={16} className="mr-2" />
                  Manage Contacts
                </Button>
                {/* <button
                  className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold flex items-center gap-1"
                  onClick={() => setShowBulkUploadContacts(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                  </svg>
                  Bulk Upload
                </button> */}
              </div>
            )}
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'NAME' },
              { key: 'phone', label: 'PHONE' },
              { key: 'email', label: 'EMAIL' },
              { key: 'designation', label: 'DESIGNATION' },
              { key: 'department', label: 'DEPARTMENT' },
            ]}
            data={contactsPaginatedData}
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
              Showing {contactsTableData.length === 0 ? 0 : contactsStartIndex + 1} to {Math.min(contactsEndIndex, contactsTableData.length)} of {contactsTableData.length} contacts
            </span>
          </div>
          <Pagination
            currentPage={contactsCurrentPage}
            totalPages={contactsTotalPages}
            onPageChange={setContactsCurrentPage}
            showPageInfo
            pageInfoFormat={(current, total) => `${current} of ${total}`}
          />
        </div>
      ),
      badge: contactsTableData.length,
    },
    {
      id: 'supplierDocuments',
      label: 'Supplier Documents',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
              Supplier Documents
            </Text>
            {canEdit && (
              <Button variant="primary" onClick={() => setShowEditDocumentsModal(true)}>
                <Icon name="plus" size={16} className="mr-2" />
                Manage Documents
              </Button>
            )}
          </div>
          <DataTable
            columns={[
              { key: 'document_type', label: 'DOCUMENT TYPE' },
              { key: 'document_no', label: 'DOCUMENT NUMBER' },
              { key: 'issue_date', label: 'ISSUE DATE' },
              { key: 'expiry_date', label: 'EXPIRY DATE' },
              {
                key: 'document_file', label: 'DOCUMENT', render: (value: any) => (
                  value ? (
                    <button
                      onClick={() => FileUploadService.openFile(value)}
                      className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      View File
                    </button>
                  ) : (
                    '-'
                  )
                )
              },
            ]}
            data={documentsPaginatedData}
            visibleColumns={{
              document_type: true,
              document_no: true,
              issue_date: true,
              expiry_date: true,
              document_file: true,
            }}
            className="mt-4"
            emptyMessage="No documents available"
          />
          <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
            <span>
              Showing {documentsTableData.length === 0 ? 0 : documentsStartIndex + 1} to {Math.min(documentsEndIndex, documentsTableData.length)} of {documentsTableData.length} documents
            </span>
          </div>
          <Pagination
            currentPage={documentsCurrentPage}
            totalPages={documentsTotalPages}
            onPageChange={setDocumentsCurrentPage}
            showPageInfo
            pageInfoFormat={(current, total) => `${current} of ${total}`}
          />
        </div>
      ),
      badge: documentsTableData.length,
    },

  ];

  // Format address for display (not currently used in render)
  return (
    <>
      <DetailTemplate
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Suppliers', path: '/suppliers' },
              {
                label: `${supplierData.supplier_name} (${supplierData.supplier_id})`,
                active: true,
              },
            ]}
            additionalInfo={
              supplierData.created_by || supplierData.created
                ? `Created By ${supplierData.created_by || 'Unknown'}${supplierData.created ? ` | Created on ${formatUIDate(supplierData.created)}` : ''}`
                : undefined
            }
          />
        }
        header={<SupplierHeader supplier={supplierData} logoUrl={logoViewUrl} onEdit={() => setShowEditSupplierHeaderModal(true)} canEdit={canEdit} />}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebar={
          <div className="flex flex-col gap-6 w-full items-stretch">
            {/* Supplier Information Card */}
            <Card
              title="Supplier Information"
              className="w-full text-left relative"
            >
              {canEdit && (
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() => setShowEditSupplierInfoModal(true)}
                    title="Edit Supplier Information"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                </div>
              )}
              <div className="mb-2">
                <span className="text-gray-600">Branches:</span>{' '}
                <span className="font-bold">
                  {Array.isArray(supplierData.branches) && supplierData.branches.length > 0
                    ? supplierData.branches.join(', ')
                    : (supplierData.branches || '-')}
                </span>
              </div>
              <hr className="my-2" />
              <div className="mb-2">
                <span className="text-gray-600">Supplier Type:</span>{' '}
                <span className="font-bold">{supplierData.supplier_type || '-'}</span>
              </div>
              <hr className="my-2" />
              <div className="mb-2">
                <span className="text-gray-600">Skill Category:</span>{' '}
                <span className="font-bold">
                  {Array.isArray(supplierData.category) && supplierData.category.length > 0
                    ? supplierData.category.join(', ')
                    : (supplierData.category || '-')}
                </span>
              </div>
              {/* <div className="mb-2">
              <span className="text-gray-600">Skill Capability:</span>{' '}
              <span className="font-bold">{supplierData.capability || '-'}</span>
            </div> */}
              <div className="mb-2">
                <span className="text-gray-600">Industry:</span>{' '}
                <span className="font-bold">
                  {Array.isArray(supplierData.industry) && supplierData.industry.length > 0
                    ? supplierData.industry.join(', ')
                    : (supplierData.industry || '-')}
                </span>
              </div>

            </Card>

            {/* Supplier Contracts Card */}
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
                    Supplier Contracts
                  </Text>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() => setShowEditContractsModal(true)}
                    title="Edit Contracts"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                <DataTable
                  columns={[{
                    key: 'contract_type',
                    label: 'CONTRACT TYPE'
                  }, {
                    key: 'payment_term',
                    label: 'PAYMENT TERM'
                  }, {
                    key: 'payment_type',
                    label: 'PAYMENT TYPE'
                  }]}
                  data={contractsTableData}
                  visibleColumns={{
                    contract_type: true,
                    payment_term: true,
                    payment_type: true,
                  }}
                  className="mt-4"
                  emptyMessage="No contracts available"
                  stickyColumns={1}
                />
              </div>
              <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
                <span>
                  Showing {contractsTableData.length} of {contractsTableData.length} contracts
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

      <EditAddContact
        isOpen={showEditContactsModal}
        onClose={() => setShowEditContactsModal(false)}
        supplierData={supplierData!}
        onUpdate={(updatedData: SupplierData) => setSupplierData(updatedData)}
        countryCodes={countryCodes}
        countryCodesLoading={countryCodesLoading}
      />

      <EditAddDocument
        isOpen={showEditDocumentsModal}
        onClose={() => setShowEditDocumentsModal(false)}
        supplierData={supplierData!}
        onUpdate={(updatedData: SupplierData) => setSupplierData(updatedData)}
      />

      <EditAddContract
        isOpen={showEditContractsModal}
        onClose={() => setShowEditContractsModal(false)}
        supplierData={supplierData!}
        onUpdate={(updatedData: SupplierData) => setSupplierData(updatedData)}
      />
      <EditSupplierHeader
        isOpen={showEditSupplierHeaderModal}
        onClose={() => setShowEditSupplierHeaderModal(false)}
        supplierData={supplierData!}
        onUpdate={(updatedData: SupplierData) => setSupplierData(updatedData)}
        logoUrl={logoViewUrl}
      />
      <EditSupplierInformation
        isOpen={showEditSupplierInfoModal}
        onClose={() => setShowEditSupplierInfoModal(false)}
        supplierData={supplierData!}
        onUpdate={(updatedData: SupplierData) => setSupplierData(updatedData)}
      />

      {/* Bulk Upload Contacts Modal */}
      {showBulkUploadContacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Bulk Upload Contacts</h3>
              <button className="text-gray-400 hover:text-gray-600 transition" onClick={() => { setShowBulkUploadContacts(false); setBulkFileContacts(null); setExcelDataContacts([]); setShowPreviewContacts(false); }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">Download the Excel template, enter the contact details, and upload the completed file here.</p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-center justify-center">
                  <button onClick={downloadExcelTemplateContacts} type="button" className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Download Excel Template
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <label className="flex items-center justify-center w-full cursor-pointer">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChangeContacts} className="hidden" id="bulk-upload-input-supplier" />
                    <div className="flex items-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition w-full justify-center">
                      <span className="font-medium">Choose File</span>
                      <span className="text-gray-500 text-sm truncate max-w-[150px]">{bulkFileContacts ? bulkFileContacts.name : 'No File Chosen'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {showPreviewContacts && excelDataContacts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Preview Data ({excelDataContacts.length} records)</h3>
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
                        {excelDataContacts.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowIndex + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['First Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Middle Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Last Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Display Name'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(() => { const cc = String(row['Country Code'] || ''); if (!cc) return ''; if (cc.startsWith('+')) return cc; if (/^\d+$/.test(cc)) return `+${cc}`; return cc; })()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Phone'] || '').replace(/\s+/g, '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Email'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Designation'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(row['Department'] || '')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex flex-col">
                                {excelValidationErrorsContacts[`row_${rowIndex}_duplicate`] && <span className="text-red-500 text-xs">{excelValidationErrorsContacts[`row_${rowIndex}_duplicate`]}</span>}
                                {excelValidationErrorsContacts[`row_${rowIndex}_lastName`] && <span className="text-red-500 text-xs">{excelValidationErrorsContacts[`row_${rowIndex}_lastName`]}</span>}
                                {excelValidationErrorsContacts[`row_${rowIndex}_phone`] && <span className="text-red-500 text-xs">{excelValidationErrorsContacts[`row_${rowIndex}_phone`]}</span>}
                                {excelValidationErrorsContacts[`row_${rowIndex}_email`] && <span className="text-red-500 text-xs">{excelValidationErrorsContacts[`row_${rowIndex}_email`]}</span>}
                                {excelValidationErrorsContacts[`row_${rowIndex}_countryCode`] && <span className="text-red-500 text-xs">{excelValidationErrorsContacts[`row_${rowIndex}_countryCode`]}</span>}
                                {!excelValidationErrorsContacts[`row_${rowIndex}_duplicate`] && !excelValidationErrorsContacts[`row_${rowIndex}_lastName`] && !excelValidationErrorsContacts[`row_${rowIndex}_phone`] && !excelValidationErrorsContacts[`row_${rowIndex}_email`] && !excelValidationErrorsContacts[`row_${rowIndex}_countryCode`] && <span className="text-green-500 text-xs">Valid</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {Object.keys(excelValidationErrorsContacts).length > 0 && (
                    <div className="mt-4 p-4">
                      <h4 className="text-red-800 font-medium">Validation Errors Found</h4>
                      <p className="text-red-600 text-sm mt-1">{getValidationErrorMessage()}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button className={`px-8 py-2.5 rounded-lg font-medium transition ${bulkFileContacts && excelDataContacts.length > 0 && Object.keys(excelValidationErrorsContacts).length === 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} disabled={!bulkFileContacts || excelDataContacts.length === 0 || Object.keys(excelValidationErrorsContacts).length > 0} onClick={handleBulkUploadContacts}>Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierDetailPage;