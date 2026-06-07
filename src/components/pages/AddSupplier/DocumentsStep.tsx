import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import Text from '../../atoms/Text/Text';
import Icon from '../../atoms/Icon/Icon';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import { useDocumentTypeDropdown } from '../../../hooks/useSupplierDropdowns';
import FileUpload from '../../molecules/FileUpload';
import FileUploadService from '../../../services/fileUploadService';

interface DocumentTypeOption {
  id: string;
  name: string;
  requires_expiry: boolean;
  requires_issue: boolean;
  requires_number: boolean;
  requires_file: boolean;
  requires_document_number_field: boolean;
}

interface Document {
  type: string;
  number: string;
  description: string; // Added as per specification
  issueDate: string;
  expiryDate: string;
  file: File | null;
  uploadedUrl?: string | null;
  fileName?: string; // Add fileName property
}

interface DocumentsStepProps {
  formData: {
    documents: Document[];
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  onFileUpload?: {
    documents?: (documentIndex: number, file: File | null, onChange: (field: string, value: any) => void, currentDocuments: any[]) => void;
  };
  uploadStates?: {
    documents?: { [key: string]: { uploading: boolean; error: string | null } };
  };
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({
  formData,
  onChange,
  errors = {},
  onFileUpload,
  uploadStates,
}) => {
  // Use the new supplier dropdown hook for document types
  const {
    options: documentTypeOptions,
    loading: loadingDocumentTypes,
    search: searchDocumentType,
  } = useDocumentTypeDropdown();

  // Validation state - for deferred validation like BusinessStep
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);

  // Clear validation errors when a document is successfully uploaded
  useEffect(() => {
    formData.documents.forEach((doc, idx) => {
      // If document has been uploaded (has uploadedUrl), clear its file validation error
      if (doc.uploadedUrl && localErrors[`${idx}-file`]) {
        setLocalErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${idx}-file`];
          return newErrors;
        });
      }
    });
  }, [formData.documents, localErrors]);

  // Validation function for document fields
  const validateDocumentField = (idx: number, field: string) => {
    const doc = formData.documents[idx];

    switch (field) {
      case 'type':
        if (!doc.type || doc.type === '') {
          return 'Document Type is required';
        }
        return '';

      case 'number':
        // Check if required
        if (requiresDocumentNumber(doc.type)) {
          if (!doc.number || doc.number.trim() === '') {
            return 'Document Number is required';
          }
        }

        // Document number validation (if provided)
        if (doc.number && doc.number.trim() !== '') {
          const validationError = validateDocumentNumber(doc.type, doc.number);
          if (validationError) {
            return validationError;
          }
        }
        return '';

      case 'issueDate':
        if (requiresIssueDate(doc.type)) {
          if (!doc.issueDate || doc.issueDate === '') {
            return 'Issue Date is required';
          }
        }
        return '';

      case 'expiryDate':
        if (requiresExpiryDate(doc.type)) {
          if (!doc.expiryDate || doc.expiryDate === '') {
            return 'Expiry Date is required';
          }
        }
        return '';

      case 'file':
        // Check if either a file is selected or a file has been successfully uploaded
        // A document is considered uploaded if it has either a file selected or an uploadedUrl
        if (requiresFile(doc.type)) {
          if (!doc.file && !doc.uploadedUrl) {
            return 'Document Upload is required';
          }
        }
        return '';

      default:
        return '';
    }
  };

  // Get error for a document field - only show errors after validation has been triggered
  const getDocumentFieldError = (idx: number, field: string) => {
    if (!validationTriggered) {
      return ''; // Don't show errors until validation is triggered
    }
    const errorKey = `${idx}-${field}`;
    return localErrors[errorKey] || validateDocumentField(idx, field);
  };

  // Enhanced field change handler that clears errors for the field being updated
  const handleFieldChange = (
    idx: number,
    field: keyof Document,
    value: any
  ) => {
    const updated = [...formData.documents];
    updated[idx][field] = value;

    onChange('documents', updated);

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

  // Get document type metadata from options
  const getDocumentTypeData = (docTypeName: string): DocumentTypeOption | undefined => {
    if (!docTypeName) return undefined;

    const normalized = docTypeName.trim().toLowerCase();

    // Try exact match first
    let option = documentTypeOptions.find(opt => opt.label?.trim().toLowerCase() === normalized);
    if (option) {
      // Create a DocumentTypeOption object from the DropdownOption
      return {
        id: option.id || '',
        name: option.label || '',
        requires_expiry: (option as any).requires_expiry || false,
        requires_issue: (option as any).requires_issue || false,
        requires_number: (option as any).requires_number || false,
        requires_file: (option as any).requires_file !== false, // Default to true if undefined as per safe fallback, or false? Let's assume based on backend logic. For now, strict check.
        requires_document_number_field: (option as any).requires_document_number_field || false
      };
    }

    // Try partial / contains match (tolerant matching for e.g., 'Pan Card' vs 'PAN Card')
    option = documentTypeOptions.find(opt => {
      const candidate = opt.label?.trim().toLowerCase() || '';
      return candidate.includes(normalized) || normalized.includes(candidate);
    });

    if (option) {
      // Create a DocumentTypeOption object from the DropdownOption
      return {
        id: option.id || '',
        name: option.label || '',
        requires_expiry: (option as any).requires_expiry || false,
        requires_issue: (option as any).requires_issue || false,
        requires_number: (option as any).requires_number || false,
        requires_file: (option as any).requires_file !== false,
        requires_document_number_field: (option as any).requires_document_number_field || false
      };
    }

    return undefined;
  };

  // Get document number format/placeholder based on document type (DYNAMIC & SMART)
  const getDocumentFormat = (docType: string) => {
    const docData = getDocumentTypeData(docType);
    const docTypeLower = docType?.toLowerCase() || '';

    // SMART FORMAT VALIDATION based on document type

    // PAN Card: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g., ABCDE1234F)
    if (docTypeLower.includes('pan')) {
      return {
        placeholder: 'ABCDE1234F',
        helpText: '10 characters: 5 letters, 4 digits, 1 letter',
        maxLength: 10,
        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid PAN format. Must be: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)'
      };
    }

    // Aadhaar Card: 12 digits only
    if (docTypeLower.includes('aadhaar') || docTypeLower.includes('aadhar')) {
      return {
        placeholder: '123456789012',
        helpText: '12 digit Aadhaar number',
        maxLength: 12,
        pattern: /^\d{12}$/,
        transform: (value: string) => value.replace(/[^0-9]/g, ''),
        isNumericOnly: true,
        errorMessage: 'Invalid Aadhaar format. Must be exactly 12 digits'
      };
    }

    // Passport: 1 letter + 7 digits (e.g., A1234567)
    if (docTypeLower.includes('passport')) {
      return {
        placeholder: 'A1234567',
        helpText: '1 letter followed by 7 digits',
        maxLength: 8,
        pattern: /^[A-Z]{1}[0-9]{7}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid Passport format. Must be: 1 letter followed by 7 digits (e.g., A1234567)'
      };
    }

    // Driving License: State code (2 letters) + District code (2 digits) + Year (4 digits) + Serial (7 digits)
    // Example: DL0120230001234 or HR-0620180012345
    if (docTypeLower.includes('driving') || docTypeLower.includes('license') || docTypeLower.includes('licence')) {
      return {
        placeholder: 'DL0120230001234',
        helpText: 'Format: XX-DDYYYYNNNNNNN (15-16 characters)',
        maxLength: 16,
        pattern: /^[A-Z]{2}[-]?\d{2}\d{4}\d{7}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid Driving License format. Example: DL0120230001234'
      };
    }

    // GST: 15 characters (2 state + 10 PAN + 1 entity + 1 Z + 1 checksum)
    if (docTypeLower.includes('gst') || docTypeLower.includes('gstin')) {
      return {
        placeholder: '22AAAAA0000A1Z5',
        helpText: '15 character GST number',
        maxLength: 15,
        pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid GST format. Must be 15 characters (e.g., 22AAAAA0000A1Z5)'
      };
    }

    // TAN: 10 characters (4 letters + 5 digits + 1 letter)
    if (docTypeLower.includes('tan')) {
      return {
        placeholder: 'ABCD12345E',
        helpText: '10 characters: 4 letters, 5 digits, 1 letter',
        maxLength: 10,
        pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid TAN format. Must be: 4 letters, 5 digits, 1 letter (e.g., ABCD12345E)'
      };
    }

    // CIN: 21 characters (Company Identification Number)
    if (docTypeLower.includes('cin')) {
      return {
        placeholder: 'U12345MH2020PTC123456',
        helpText: '21 character CIN',
        maxLength: 21,
        pattern: /^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid CIN format. Must be 21 characters (e.g., U12345MH2020PTC123456)'
      };
    }

    // MSME / Udyam Registration
    if (docTypeLower.includes('msme') || docTypeLower.includes('udyam')) {
      return {
        placeholder: 'UDYAM-MH-01-0012345',
        helpText: 'Format: UDYAM-XX-00-0000000',
        maxLength: 19, // UDYAM (5) + - (1) + XX (2) + - (1) + 00 (2) + - (1) + 0000000 (7) = 19
        pattern: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/,
        transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        isNumericOnly: false,
        errorMessage: 'Invalid Udyam format. Example: UDYAM-MH-01-0012345'
      };
    }

    // UAN (Universal Account Number): 12 digits
    if (docTypeLower.includes('uan')) {
      return {
        placeholder: '123456789012',
        helpText: '12 digit UAN number',
        maxLength: 12,
        pattern: /^\d{12}$/,
        transform: (value: string) => value.replace(/[^0-9]/g, ''),
        isNumericOnly: true,
        errorMessage: 'Invalid UAN format. Must be exactly 12 digits'
      };
    }

    // DYNAMIC: If requires_number is true (for any other numeric-only document)
    if (docData?.requires_number) {
      return {
        placeholder: 'Enter numbers only',
        helpText: 'Only numeric characters allowed',
        maxLength: 20,
        pattern: /^\d+$/,
        transform: (value: string) => value.replace(/[^0-9]/g, ''),
        isNumericOnly: true,
        errorMessage: 'Only numeric characters are allowed'
      };
    }

    // Default: Accept alphanumeric for other document types
    return {
      placeholder: 'Enter Document No.',
      helpText: 'Enter document number',
      maxLength: 30,
      pattern: null,
      transform: (value: string) => value.toUpperCase().replace(/[^A-Z0-9-/]/g, ''),
      isNumericOnly: false,
      errorMessage: null
    };
  };

  // Validate document number based on document type (SMART VALIDATION)
  const validateDocumentNumber = (docType: string, docNumber: string): string | null => {
    if (!docNumber || !docNumber.trim()) return null;

    const format = getDocumentFormat(docType);

    // If there's a pattern defined, validate against it
    if (format.pattern && !format.pattern.test(docNumber)) {
      return format.errorMessage || 'Invalid format';
    }

    return null;
  };

  // DYNAMIC: Check if document type requires Issue Date (from API)
  const requiresIssueDate = (docType: string): boolean => {
    if (!docType) return false;
    if (docType.toLowerCase().includes('pan')) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_issue ?? false;
  };

  // DYNAMIC: Check if document type requires Expiry Date (from API)
  const requiresExpiryDate = (docType: string): boolean => {
    if (!docType) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_expiry ?? false;
  };

  // DYNAMIC: Check if document type requires Document Number (from API)
  const requiresDocumentNumber = (docType: string): boolean => {
    if (!docType) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_document_number_field ?? false;
  };

  // DYNAMIC: Check if document type requires File Upload (from API)
  const requiresFile = (docType: string): boolean => {
    if (!docType) return false;

    // If options haven't loaded yet, default to false to prevent false positives during draft restore
    if (documentTypeOptions.length === 0 && loadingDocumentTypes) {
      console.log('Skipping requiresFile check - options loading');
      return false;
    }

    const docData = getDocumentTypeData(docType);

    console.log(`Checking requiresFile for ${docType}:`, {
      found: !!docData,
      requires_file: docData?.requires_file,
      default: true
    });

    // If docData is found, use its property.
    // If not found (but options are loaded), default to true (strict).
    return docData?.requires_file ?? (documentTypeOptions.length > 0 ? true : false);
  };

  // Validate all documents
  const validateDocuments = () => {
    const newErrors: Record<string, string> = {};

    formData.documents.forEach((doc, idx) => {
      // Validate all required fields for this document
      const fieldsToValidate = ['type', 'number', 'issueDate', 'expiryDate', 'file'];

      fieldsToValidate.forEach(field => {
        const error = validateDocumentField(idx, field);
        if (error) {
          const errorKey = `${idx}-${field}`;
          newErrors[errorKey] = error;
        }
      });
    });

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = useCallback(() => {
    // Validate documents before proceeding
    const isDocumentsValid = validateDocuments();

    // If validation fails, trigger validation display and return false
    if (!isDocumentsValid) {
      setValidationTriggered(true);
      return false;
    }

    // All documents are valid
    return true;
  }, [formData.documents]);

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
    onChange('_documentsTabNavigation', tabNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleNext, handlePrevious]); // Only update when handlers change, onChange intentionally excluded to prevent infinite loop

  const addDocument = () => {
    const newDocument = {
      type: '',
      number: '',
      description: '', // Added as per specification
      issueDate: '',
      expiryDate: '',
      file: null,
      uploadedUrl: null,
      fileName: '',
    };

    const updatedDocuments = [...formData.documents, newDocument];
    onChange('documents', updatedDocuments);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Text variant="h2" size="lg" weight="bold" className="text-gray-900">
          Documents
        </Text>
        <button
          type="button"
          className="border border-blue-500 text-blue-500 px-3 py-1 rounded"
          onClick={addDocument}
        >
          + Add Document
        </button>
      </div>
      {formData.documents.map((doc, idx) => (
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
              Document {idx + 1}
            </Text>
            {idx > 0 && !doc.type?.toLowerCase().includes('pan') && (
              <button
                type="button"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                onClick={() => {
                  const updated = formData.documents.filter((_, i) => i !== idx);
                  onChange('documents', updated);
                }}
                aria-label="Remove document"
              >
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-6">
            <div>
              <SearchDropdown
                label="Document Type"
                value={doc.type}
                onChange={(value) => {
                  const typeValue = Array.isArray(value) ? value[0]?.value || '' : value?.value || '';
                  handleFieldChange(idx, 'type', typeValue);
                }}
                options={documentTypeOptions}
                placeholder={loadingDocumentTypes ? "Loading document types..." : "Select Document Type"}
                required
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    searchDocumentType(input);
                  }
                }}
                error={getDocumentFieldError(idx, 'type')}
              />
            </div>
            <div>
              <EnhancedInputField
                label="Document No."
                value={doc.number}
                onChange={value => {
                  const format = getDocumentFormat(doc.type);
                  const transformedValue = format.transform(value);
                  handleFieldChange(idx, 'number', transformedValue);
                }}
                type={getDocumentFormat(doc.type).isNumericOnly ? 'tel' : 'text'}
                inputMode={getDocumentFormat(doc.type).isNumericOnly ? 'numeric' : 'text'}
                placeholder={getDocumentFormat(doc.type).placeholder}
                required={requiresDocumentNumber(doc.type)}
                gridCols=""
                maxLength={getDocumentFormat(doc.type).maxLength}
                helpText={
                  !doc.type
                    ? "Select document type first"
                    : getDocumentFormat(doc.type).helpText || (requiresDocumentNumber(doc.type) ? "Enter document number" : "Enter document number (optional)")
                }
              />
              {getDocumentFieldError(idx, 'number') && (
                <span className="text-red-500 text-sm">
                  {getDocumentFieldError(idx, 'number')}
                </span>
              )}
            </div>
            {/* Document Description - Added as per specification */}
            <div>
              <EnhancedInputField
                label="Document Description"
                value={doc.description}
                onChange={value => handleFieldChange(idx, 'description', value)}
                type="text"
                placeholder="Enter document description"
                gridCols=""
                helpText="Optional description for this document"
              />
            </div>
            <div>
              <EnhancedInputField
                label="Issue Date"
                value={doc.issueDate}
                onChange={value => handleFieldChange(idx, 'issueDate', value)}
                type="date"
                max={new Date().toISOString().split('T')[0]}
                required={requiresIssueDate(doc.type)}
                gridCols=""
                helpText={
                  !requiresIssueDate(doc.type)
                    ? "Issue Date (Optional)"
                    : "Cannot be a future date"
                }
              />
              {getDocumentFieldError(idx, 'issueDate') && (
                <span className="text-red-500 text-sm">
                  {getDocumentFieldError(idx, 'issueDate')}
                </span>
              )}
            </div>
            <div>
              <EnhancedInputField
                label="Expiry Date"
                value={doc.expiryDate}
                onChange={value => handleFieldChange(idx, 'expiryDate', value)}
                type="date"
                min={doc.issueDate || undefined}
                required={requiresExpiryDate(doc.type)}
                gridCols=""
                helpText={
                  !requiresExpiryDate(doc.type)
                    ? "Expiry Date (Optional)"
                    : doc.issueDate
                      ? "Must be on or after Issue Date"
                      : ""
                }
              />
              {getDocumentFieldError(idx, 'expiryDate') && (
                <span className="text-red-500 text-sm">
                  {getDocumentFieldError(idx, 'expiryDate')}
                </span>
              )}
            </div>
            <div className="col-span-2">
              <FileUpload
                label={`Document File ${requiresFile(doc.type) ? '*' : '(Optional)'}`}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={10}
                required={requiresFile(doc.type)}
                onChange={(file) => {
                  if (file && onFileUpload?.documents) {
                    onFileUpload.documents(idx, file, (field, value) => {
                      onChange(field, value);
                      const errorKey = `${idx}-file`;
                      if (localErrors[errorKey]) {
                        setLocalErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }, formData.documents);
                  } else {
                    handleFieldChange(idx, 'file', file);
                  }
                }}
                uploading={uploadStates?.documents?.[`doc_${idx}`]?.uploading}
                error={(uploadStates?.documents?.[`doc_${idx}`]?.error || getDocumentFieldError(idx, 'file')) || undefined}
                dragDrop={true}
                currentFile={doc.fileName ? { name: doc.fileName } : (doc.file ? { name: doc.file.name } : undefined)}
                onViewFile={doc.uploadedUrl ? () => FileUploadService.openFile(doc.uploadedUrl!) : undefined}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentsStep;