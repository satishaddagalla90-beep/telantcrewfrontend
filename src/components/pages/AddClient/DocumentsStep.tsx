import React, { useState, useEffect, useCallback } from 'react';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import FileUpload from '../../molecules/FileUpload';
import Text from '../../atoms/Text/Text';
import Icon from '../../atoms/Icon/Icon';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import FileUploadService from '../../../services/fileUploadService';

interface DocumentTypeOption {
  id: string;
  name: string;
  requires_expiry: boolean;
  requires_issue: boolean;
  requires_number: boolean;
  requires_document_number_field: boolean;
  requires_file: boolean;
}

interface Document {
  type: string;
  number: string;
  description: string;
  issueDate: string;
  expiryDate: string;
  file: File | null;
  uploadedUrl?: string | null;
}

interface DocumentsStepProps {
  formData: {
    documents: Document[];
    pan?: string; // PAN number from BusinessStep
    msp?: string; // Client type from BusinessStep — 'ThroughMSP' overrides all document validation
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
  // Store full document type objects with metadata
  const [documentTypeOptions, setDocumentTypeOptions] = useState<Array<{ value: string; label: string; data: DocumentTypeOption }>>([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);

  // When Client Type is 'ThroughMSP', all document fields are optional & enabled
  // This overrides the API-driven dynamic validation entirely
  const isThroughMSP = formData.msp === 'ThroughMSP';

  // Validation state - for deferred validation like BusinessStep
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [validationTriggered, setValidationTriggered] = useState(false);

  // Fetch document type options from API with optional search (internal function)
  const fetchDocumentTypeOptionsInternal = async (searchTerm: string = '') => {
    setLoadingDocumentTypes(true);
    try {
      const url = new URL(window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Document_type'));
      url.searchParams.append('limit', '50');
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await apiCall<{ data: DocumentTypeOption[] }>(
        url.pathname + url.search
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((doc: DocumentTypeOption) => ({
          value: doc.name,
          label: doc.name,
          data: doc, // Store full object with requires_* fields
        }));
        setDocumentTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching document type options:', error);
      setDocumentTypeOptions([]);
    } finally {
      setLoadingDocumentTypes(false);
    }
  };

  // Debounced search function
  const debouncedFetchDocumentType = useDebouncedCallback(fetchDocumentTypeOptionsInternal, 500);

  // Load initial data on mount
  useEffect(() => {
    fetchDocumentTypeOptionsInternal();
  }, []);

  // Set default values for Document 1
  useEffect(() => {
    // Remove the automatic PAN Card selection logic
    // This effect is no longer needed
  }, []);

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

    // ThroughMSP override — all fields are optional, no validation errors
    if (isThroughMSP) return '';

    const docTypeData = getDocumentTypeData(doc.type);

    switch (field) {
      case 'type':
        if (!doc.type || doc.type === '') {
          return 'Document Type is required';
        }
        return '';

      case 'number':
        // Required when requires_document_number_field is true
        if (docTypeData?.requires_document_number_field && (!doc.number || doc.number.trim() === '')) {
          return 'Document Number is required';
        }
        // If a value is provided, validate format
        if (doc.number && doc.number.trim() !== '') {
          const validationError = validateDocumentNumber(doc.type, doc.number);
          if (validationError) {
            return validationError;
          }
        }
        return '';

      case 'issueDate':
        // Required when requires_issue is true
        if (docTypeData?.requires_issue && (!doc.issueDate || doc.issueDate === '')) {
          return 'Issue Date is required for this document type';
        }
        return '';

      case 'expiryDate':
        // Required when requires_expiry is true
        if (docTypeData?.requires_expiry && (!doc.expiryDate || doc.expiryDate === '')) {
          return 'Expiry Date is required for this document type';
        }
        return '';

      case 'file':
        // Required when requires_file is true
        if (docTypeData?.requires_file && !doc.file && !doc.uploadedUrl) {
          return 'Document file upload is required for this document type';
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
    updated[idx] = { ...updated[idx], [field]: value };

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
    let option = documentTypeOptions.find(opt => opt.value.trim().toLowerCase() === normalized);
    if (option) return option.data;

    // Try partial / contains match (tolerant matching for e.g., 'Pan Card' vs 'PAN Card')
    option = documentTypeOptions.find(opt => {
      const candidate = opt.value.trim().toLowerCase();
      return candidate.includes(normalized) || normalized.includes(candidate);
    });

    return option?.data;
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
  // Returns false when ThroughMSP — field is always optional & enabled
  const requiresIssueDate = (docType: string): boolean => {
    if (isThroughMSP) return false;
    if (!docType) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_issue ?? false;
  };

  // DYNAMIC: Check if document type requires Expiry Date (from API)
  // Returns false when ThroughMSP — field is always optional & enabled
  const requiresExpiryDate = (docType: string): boolean => {
    if (isThroughMSP) return false;
    if (!docType) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_expiry ?? false;
  };

  // DYNAMIC: Check if document type requires Document Number field (from API)
  // Returns false when ThroughMSP — field is always optional & enabled
  const requiresDocumentNumberField = (docType: string): boolean => {
    if (isThroughMSP) return false;
    if (!docType) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_document_number_field ?? false;
  };

  // DYNAMIC: Check if document type requires file upload (from API)
  // Returns false when ThroughMSP — field is always optional
  const requiresFile = (docType: string): boolean => {
    if (isThroughMSP) return false;
    if (!docType) return false;
    const docData = getDocumentTypeData(docType);
    return docData?.requires_file ?? false;
  };

  // Validate all documents
  const validateDocuments = () => {
    const newErrors: Record<string, string> = {};

    formData.documents.forEach((doc, idx) => {
      // Validate all fields including file (conditionally required based on API flags)
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
      issueDate: '',
      expiryDate: '',
      file: null,
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
                required={!isThroughMSP}
                isSearchable
                isClearable
                onInputChange={(input, action) => {
                  if (action.action === 'input-change') {
                    debouncedFetchDocumentType(input);
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
                required={requiresDocumentNumberField(doc.type)}
                gridCols=""
                maxLength={getDocumentFormat(doc.type).maxLength}
                helpText={
                  !doc.type
                    ? "Select document type first"
                    : getDocumentFormat(doc.type).helpText || (requiresDocumentNumberField(doc.type) ? "Required for this document type" : "Enter document number (optional)")
                }
              />
              {getDocumentFieldError(idx, 'number') && (
                <span className="text-red-500 text-sm">
                  {getDocumentFieldError(idx, 'number')}
                </span>
              )}
            </div>
            <div>
              <EnhancedInputField
                label="Document Description"
                value={doc.description}
                onChange={value => handleFieldChange(idx, 'description', value)}
                type="text"
                placeholder="Enter document description (optional)"
                required={false}
                gridCols=""
                helpText="Optional field for additional document details"
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
                disabled={!isThroughMSP && !requiresIssueDate(doc.type)}
                gridCols=""
                helpText={isThroughMSP ? "Optional. Cannot be a future date" : requiresIssueDate(doc.type) ? "Required. Cannot be a future date" : "Not required for this document type"}
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
                disabled={!isThroughMSP && !requiresExpiryDate(doc.type)}
                gridCols=""
                helpText={isThroughMSP ? "Optional. Must be on or after Issue Date if provided" : requiresExpiryDate(doc.type) ? "Required. Must be on or after Issue Date" : "Not required for this document type"}
              />
              {getDocumentFieldError(idx, 'expiryDate') && (
                <span className="text-red-500 text-sm">
                  {getDocumentFieldError(idx, 'expiryDate')}
                </span>
              )}
            </div>
            <div>
              <FileUpload
                label={`Document Upload${!isThroughMSP && requiresFile(doc.type) ? ' *' : ''}`}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={10}
                onChange={file => {
                  if (file && onFileUpload?.documents) {
                    // Trigger immediate upload
                    onFileUpload.documents(idx, file, (field, value) => {
                      // When the upload is complete, clear the file validation error
                      if (field === 'documents') {
                        // Update documents
                        onChange(field, value);

                        // Clear validation error for this document's file field
                        const errorKey = `${idx}-file`;
                        if (localErrors[errorKey]) {
                          setLocalErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[errorKey];
                            return newErrors;
                          });
                        }
                      } else {
                        // Handle other field updates
                        onChange(field, value);
                      }
                    }, formData.documents);
                  } else {
                    // Fallback: Just store the file
                    handleFieldChange(idx, 'file', file);
                  }
                }}
                onViewFile={
                  doc.uploadedUrl
                    ? () => FileUploadService.openFile(doc.uploadedUrl!)
                    : undefined
                }
                error={(getDocumentFieldError(idx, 'file') || uploadStates?.documents?.[`doc_${idx}`]?.error) || undefined}
                uploading={uploadStates?.documents?.[`doc_${idx}`]?.uploading}
                currentFile={
                  doc.file
                    ? { name: doc.file.name }
                    : doc.uploadedUrl
                      ? { name: doc.uploadedUrl.split('/').pop() || 'Uploaded Document' }
                      : undefined
                }
                helpText={requiresFile(doc.type) ? "Required: Upload a document file (PDF, JPG, PNG)" : "Optional: Upload a document file (PDF, JPG, PNG)"}
                buttonText="Upload Document"
              />
              {(doc.file || doc.uploadedUrl) && !uploadStates?.documents?.[`doc_${idx}`]?.uploading && !uploadStates?.documents?.[`doc_${idx}`]?.error && (
                <p className="text-green-600 text-sm mt-1">✓ Uploaded successfully</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentsStep;