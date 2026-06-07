import React, { useState, useEffect } from 'react';
import { apiCall, useSWR } from '../../../../utils/api';
import { useAuth } from '../../../auth/AuthContext';
import { showSuccessToast, showErrorToast } from '../../../../utils/toast';
import EditModal from '../../../../components/molecules/EditModal/EditModal';
import EnhancedInputField from '../../../../components/molecules/EnhancedInputField/EnhancedInputField';
import SearchDropdown from '../../../../components/molecules/SearchDropdown';
import FileUpload from '../../../../components/molecules/FileUpload';
import { FileUploadService } from '../../../../services/fileUploadService';
import Button from '../../../../components/atoms/Button';
import Icon from '../../../../components/atoms/Icon';
import { SupplierData, SupplierDocument } from '../../../../types/supplier';

interface EditAddDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  supplierData: SupplierData;
  onUpdate: (updatedData: SupplierData) => void;
}

const EditAddDocument: React.FC<EditAddDocumentProps> = ({
  isOpen,
  onClose,
  supplierData,
  onUpdate,
}) => {
  const [editDocumentsFormData, setEditDocumentsFormData] = useState<any[]>([]);
  const [documentSearch, setDocumentSearch] = useState('');
  const documentsUrl = `/supplierdropdowns/Document_type?page=1&limit=100${documentSearch ? `&search=${encodeURIComponent(documentSearch)}` : ''}`;
  const { data: documentsData } = useSWR<any>(documentsUrl);
  const documentOptions = documentsData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const [documentsErrors, setDocumentsErrors] = useState<Record<string, string>>({});
  const [isUpdatingDocuments, setIsUpdatingDocuments] = useState(false);
  const [documentUploadStates, setDocumentUploadStates] = useState<Record<number, { uploading: boolean; error: string | null }>>({});
  const { user } = useAuth();

  const handleDocumentUpload = async (index: number, file: File | null) => {
    if (!file) {
      setEditDocumentsFormData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], fileName: '', fileUrl: '' };
        return updated;
      });
      setDocumentUploadStates(prev => ({ ...prev, [index]: { uploading: false, error: null } }));
      return;
    }

    setDocumentUploadStates(prev => ({ ...prev, [index]: { uploading: true, error: null } }));

    try {
      const validation = FileUploadService.validateFile(file, {
        maxSize: 10,
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid document file');
      }

      const uploadResponse = await FileUploadService.uploadSupplierDocuments([file]);
      const upload = uploadResponse[0];
      setEditDocumentsFormData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], fileName: upload.file_name || upload.file_name || '', fileUrl: upload.file_url || upload.file_url || '', document_file_name: upload.file_url || upload.file_url || '' };
        return updated;
      });

      setDocumentUploadStates(prev => ({ ...prev, [index]: { uploading: false, error: null } }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setDocumentUploadStates(prev => ({ ...prev, [index]: { uploading: false, error: errorMsg } }));
      setEditDocumentsFormData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], fileName: '', fileUrl: '' };
        return updated;
      });
      setDocumentsErrors(prev => ({ ...prev, [`${index}_fileName`]: errorMsg }));
    }
  };

  // Initialize documents from supplierData when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const docs = (supplierData.documents || []).map((d: any, index: number) => ({
      id: index.toString(),
      documentType: d.document_type || '',
      documentNumber: d.document_no || '',
      documentDescription: d.document_description || '',
      issueDate: d.document_issue_date || d.issue_date || '',
      expiryDate: d.document_expiry_date || d.expiry_date || '',
      fileName: d.document_file || '',
      fileUrl: d.document_file || '',
      status: d.status || 'Active',
    }));
    if (docs.length === 0) {
      docs.push({ id: Math.random().toString(), documentType: '', documentNumber: '', documentDescription: '', issueDate: '', expiryDate: '', fileName: '', fileUrl: '', status: 'Active' });
    }
    setEditDocumentsFormData(docs);
    setDocumentsErrors({});
    setDocumentUploadStates({});
  }, [isOpen, supplierData]);

  const handleDocumentFieldChange = (index: number, field: string, value: string | null) => {
    setEditDocumentsFormData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (documentsErrors[`${index}_${field}`]) {
      setDocumentsErrors(prev => { const n = { ...prev }; delete n[`${index}_${field}`]; return n; });
    }
  };

  // Helpers copied from ClientDetail for document formatting and validation
  const getDocumentTypeData = (docTypeName: string) => {
    if (!docTypeName || !documentsData?.data) return undefined;
    const normalized = docTypeName.trim().toLowerCase();

    // Try exact match first
    let option = (documentsData.data as any).find((d: any) => d.name?.trim().toLowerCase() === normalized);
    if (option) return option;

    // Try partial/contains match
    option = (documentsData.data as any).find((d: any) => {
      const candidate = d.name?.trim().toLowerCase() || '';
      return candidate.includes(normalized) || normalized.includes(candidate);
    });

    return option;
  };

  const getDocumentFormat = (docType: string) => {
    const docData: any = getDocumentTypeData(docType);
    const docTypeLower = (docType || '').toLowerCase();

    if (docTypeLower.includes('pan')) {
      return {
        placeholder: 'ABCDE1234F',
        helpText: '10 characters: 5 letters, 4 digits, 1 letter',
        maxLength: 10,
        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid PAN format. Must be: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)',
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
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid Passport format. Must be: 1 letter followed by 7 digits (e.g., A1234567)',
      };
    }
    if (docTypeLower.includes('driving') || docTypeLower.includes('license') || docTypeLower.includes('licence')) {
      return {
        placeholder: 'DL0120230001234',
        helpText: 'Format: XX-DDYYYYNNNNNNN (15-16 characters)',
        maxLength: 16,
        pattern: /^[A-Z]{2}[-]?\d{2}\d{4}\d{7}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid Driving License format. Example: DL0120230001234',
      };
    }
    if (docTypeLower.includes('gst') || docTypeLower.includes('gstin')) {
      return {
        placeholder: '22AAAAA0000A1Z5',
        helpText: '15 character GST number',
        maxLength: 15,
        pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid GST format. Must be 15 characters (e.g., 22AAAAA0000A1Z5)',
      };
    }
    if (docTypeLower.includes('tan')) {
      return {
        placeholder: 'ABCD12345E',
        helpText: '10 characters: 4 letters, 5 digits, 1 letter',
        maxLength: 10,
        pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid TAN format. Must be: 4 letters, 5 digits, 1 letter (e.g., ABCD12345E)',
      };
    }
    if (docTypeLower.includes('cin')) {
      return {
        placeholder: 'U12345MH2020PTC123456',
        helpText: '21 character CIN',
        maxLength: 21,
        pattern: /^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid CIN format. Must be 21 characters (e.g., U12345MH2020PTC123456)',
      };
    }
    // MSME / Udyam Registration
    if (docTypeLower.includes('msme') || docTypeLower.includes('udyam')) {
      return {
        placeholder: 'UDYAM-MH-01-0012345',
        helpText: 'Format: UDYAM-XX-00-0000000',
        maxLength: 19,
        pattern: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid Udyam format. Example: UDYAM-MH-01-0012345'
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
      transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9-/]/g, ''),
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

  const requiresIssueDate = (docType: string) => {
    if (!docType) return false;
    if (docType.toLowerCase().includes('pan')) return false;
    const d = getDocumentTypeData(docType);
    return !!d?.requires_issue;
  };

  const requiresExpiryDate = (docType: string) => {
    const d = getDocumentTypeData(docType);
    return !!d?.requires_expiry;
  };

  const requiresDocumentNumber = (docType: string) => {
    const d = getDocumentTypeData(docType);
    return !!d?.requires_document_number_field;
  };

  const requiresFile = (docType: string) => {
    const d: any = getDocumentTypeData(docType);
    return d?.requires_file !== false;
  };

  const validateDocuments = () => {
    const errors: Record<string, string> = {};

    editDocumentsFormData.forEach((document, index) => {
      if (!document.documentType?.trim()) {
        errors[`${index}_documentType`] = 'Document type is required';
      }

      // Document number validation
      if (requiresDocumentNumber(document.documentType)) {
        if (!document.documentNumber?.trim()) {
          errors[`${index}_documentNumber`] = 'Document number is required';
        }
      }

      if (document.documentNumber?.trim()) {
        const numErr = validateDocumentNumber(document.documentType, document.documentNumber);
        if (numErr) errors[`${index}_documentNumber`] = numErr;
      }

      // Issue Date validation
      if (requiresIssueDate(document.documentType)) {
        if (!document.issueDate || document.issueDate === '') {
          errors[`${index}_issueDate`] = 'Issue Date is required';
        }
      }

      // Expiry Date validation
      if (requiresExpiryDate(document.documentType)) {
        if (!document.expiryDate || document.expiryDate === '') {
          errors[`${index}_expiryDate`] = 'Expiry Date is required';
        } else if (document.issueDate && document.expiryDate < document.issueDate) {
          errors[`${index}_expiryDate`] = 'Expiry Date must be after Issue Date';
        }
      }

      // Check if document is currently uploading
      if (documentUploadStates[index]?.uploading) {
        errors[`${index}_fileName`] = 'Please wait for upload to complete';
        return; // Skip other validations for this document
      }

      // Check if there was an upload error
      if (documentUploadStates[index]?.error) {
        errors[`${index}_fileName`] = documentUploadStates[index]?.error || 'Upload failed';
        return; // Skip other validations for this document
      }

      // Check if document file is missing
      if (requiresFile(document.documentType)) {
        if (!document.fileName?.trim() && !document.fileUrl?.trim()) {
          errors[`${index}_fileName`] = 'Document file is required';
        }
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

      if (requiresDocumentNumber(document.documentType)) {
        if (!document.documentNumber?.trim()) return false;
      }

      if (document.documentNumber?.trim()) {
        const numErr = validateDocumentNumber(document.documentType, document.documentNumber);
        if (numErr) return false;
      }

      if (requiresIssueDate(document.documentType) && (!document.issueDate || document.issueDate === '')) return false;

      if (requiresExpiryDate(document.documentType)) {
        if (!document.expiryDate || document.expiryDate === '') return false;
        if (document.issueDate && document.expiryDate < document.issueDate) return false;
      }

      if (documentUploadStates[index]?.uploading) return false;
      if (documentUploadStates[index]?.error) return false;

      if (requiresFile(document.documentType)) {
        if (!document.fileName?.trim() && !document.fileUrl?.trim()) return false;
      }
    }
    return true;
  };

  const handleSaveDocuments = async () => {
    if (!validateDocuments()) return;
    setIsUpdatingDocuments(true);
    try {
      const documentsPayload: SupplierDocument[] = editDocumentsFormData.map(doc => ({
        document_type: doc.documentType,
        document_no: doc.documentNumber,
        issue_date: doc.issueDate || null,
        expiry_date: doc.expiryDate || null,
        document_file: doc.fileUrl || doc.fileName || '',
      }));

      await apiCall(`/supplier/${supplierData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ documents: documentsPayload, updated_by: user?.display_name || 'Unknown User' }),
        headers: { 'Content-Type': 'application/json' },
      });

      showSuccessToast('Documents updated successfully!');
      onUpdate({ ...supplierData, documents: documentsPayload });
      onClose();
    } catch (error) {
      console.error('Error updating documents:', error);
      showErrorToast('Failed to update documents. Please try again.');
    } finally {
      setIsUpdatingDocuments(false);
    }
  };

  const handleClose = () => {
    setEditDocumentsFormData([]);
    setDocumentsErrors({});
    setDocumentUploadStates({});
    onClose();
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Documents"
      isLoading={isUpdatingDocuments}
      onSave={handleSaveDocuments}
      isSaveDisabled={isUpdatingDocuments}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {editDocumentsFormData.map((doc, idx) => (
          <div key={doc.id || idx} className="bg-white rounded shadow p-6 mb-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Document {idx + 1}</div>
              {idx > 0 && !doc.documentType?.toLowerCase().includes('pan') && (
                <button type="button" className="text-red-500 hover:text-red-700 p-2" onClick={() => setEditDocumentsFormData(prev => prev.filter((_, i) => i !== idx))}>
                  <Icon name="trash" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchDropdown label="Document Type" dropdownType="Document_type" dropdownLabel="Document Type" value={doc.documentType} onChange={(val: any) => handleDocumentFieldChange(idx, 'documentType', Array.isArray(val) ? val[0]?.value || '' : val?.value || '')} options={documentOptions} placeholder={documentsData ? 'Select document type' : 'Loading...'} isSearchable onInputChange={(v: string) => setDocumentSearch(v)} required error={documentsErrors[`${idx}_documentType`]} />
              {(() => {
                const format = getDocumentFormat(doc.documentType || '');
                const isRequired = requiresDocumentNumber(doc.documentType || '');
                return (
                  <EnhancedInputField
                    label="Document Number"
                    value={doc.documentNumber}
                    onChange={(v: string) => handleDocumentFieldChange(idx, 'documentNumber', format.transform ? format.transform(v) : v)}
                    placeholder={format.placeholder}
                    required={isRequired}
                    error={documentsErrors[`${idx}_documentNumber`]}
                    helpText={format.helpText || (isRequired ? 'Enter document number' : 'Enter document number (Optional)')}
                    maxLength={format.maxLength}
                    inputMode={format.isNumericOnly ? 'numeric' : undefined}
                  />
                );
              })()}
              <EnhancedInputField
                label="Issue Date"
                value={doc.issueDate}
                onChange={(v: string) => handleDocumentFieldChange(idx, 'issueDate', v)}
                type="date"
                required={requiresIssueDate(doc.documentType)}
                error={documentsErrors[`${idx}_issueDate`]}
                helpText={requiresIssueDate(doc.documentType) ? "Cannot be a future date" : "Issue Date (Optional)"}
                max={new Date().toISOString().split('T')[0]}
              />
              <EnhancedInputField
                label="Expiry Date"
                value={doc.expiryDate}
                onChange={(v: string) => handleDocumentFieldChange(idx, 'expiryDate', v)}
                type="date"
                min={doc.issueDate || ''}
                required={requiresExpiryDate(doc.documentType)}
                error={documentsErrors[`${idx}_expiryDate`]}
                helpText={requiresExpiryDate(doc.documentType) ? (doc.issueDate ? "Must be on or after Issue Date" : "") : "Expiry Date (Optional)"}
              />
              <div className="col-span-2">
                <FileUpload
                  label={`Document File ${requiresFile(doc.documentType) ? '*' : '(Optional)'}`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxSize={10}
                  required={requiresFile(doc.documentType)}
                  onChange={(file) => handleDocumentUpload(idx, file)}
                  uploading={documentUploadStates[idx]?.uploading}
                  error={(documentUploadStates[idx]?.error || documentsErrors[`${idx}_fileName`]) || undefined}
                  dragDrop={true}
                  currentFile={
                    editDocumentsFormData[idx]?.fileName
                      ? { name: editDocumentsFormData[idx].fileName }
                      : undefined
                  }
                  onViewFile={
                    editDocumentsFormData[idx]?.fileUrl
                      ? () => FileUploadService.openFile(editDocumentsFormData[idx].fileUrl)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={() => setEditDocumentsFormData(prev => [...prev, { id: Math.random().toString(), documentType: '', documentNumber: '', documentDescription: '', issueDate: '', expiryDate: '', fileName: '', fileUrl: '', status: 'Active' }])} className="w-full"><Icon name="plus" className="mr-2" />Add Document</Button>
      </div>
    </EditModal>
  );
};

export default EditAddDocument;