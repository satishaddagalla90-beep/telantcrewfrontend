import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useAuth } from '../../../auth/AuthContext';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import FileUpload from '../../../molecules/FileUpload';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import FileUploadService from '../../../../services/fileUploadService';
import { useDocumentTypesDropdown } from '../../../../hooks/useDropdowns';
import SearchDropdown from '../../../molecules/SearchDropdown';

interface DocumentTypeMetadata {
  id: string;
  name: string;
  requires_expiry: boolean;
  requires_issue: boolean;
  requires_number: boolean; // true = integer main, false = string
  requires_document_number_field: boolean; // is number field required?
  requires_file: boolean;
}


// Document format validation rules
interface DocumentFormatRule {
  pattern: RegExp;
  minLength?: number;
  maxLength?: number;
  placeholder: string;
  errorMessage: string;
  example: string;
}

// Document type format configurations
const DOCUMENT_FORMAT_RULES: Record<string, DocumentFormatRule> = {
  'AadhaarCard': {
    pattern: /^\d{12}$/,
    minLength: 12,
    maxLength: 12,
    placeholder: '1234 5678 9012',
    errorMessage: 'Aadhaar number must be exactly 12 digits',
    example: '123456789012'
  },
  'PAN Card': {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    minLength: 10,
    maxLength: 10,
    placeholder: 'ABCDE1234F',
    errorMessage: 'PAN must be 10 characters (e.g., ABCDE1234F)',
    example: 'ABCDE1234F'
  },
  'Passport': {
    pattern: /^[A-Z]{1}[0-9]{7}$/,
    minLength: 8,
    maxLength: 8,
    placeholder: 'A1234567',
    errorMessage: 'Passport number must be 8 characters (1 letter + 7 digits)',
    example: 'A1234567'
  },
  'Driving License': {
    pattern: /^[A-Z]{2}[0-9]{13}$/,
    minLength: 15,
    maxLength: 15,
    placeholder: 'DL1420110012345',
    errorMessage: 'Driving License must be 15 characters (2 letters + 13 digits)',
    example: 'DL1420110012345'
  },
  'GST Certificate': {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    minLength: 15,
    maxLength: 15,
    placeholder: '22AAAAA0000A1Z5',
    errorMessage: 'GST number must be 15 characters (e.g., 22AAAAA0000A1Z5)',
    example: '22AAAAA0000A1Z5'
  },
  'UAN': {
    pattern: /^\d{12}$/,
    minLength: 12,
    maxLength: 12,
    placeholder: '123456789012',
    errorMessage: 'UAN must be exactly 12 digits',
    example: '123456789012'
  },
  'CIN': {
    pattern: /^[UL]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    minLength: 21,
    maxLength: 21,
    placeholder: 'U12345AB1234ABC123456',
    errorMessage: 'CIN must be 21 characters',
    example: 'U12345AB1234ABC123456'
  },
  'TAN Number': {
    pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
    minLength: 10,
    maxLength: 10,
    placeholder: 'ABCD12345E',
    errorMessage: 'TAN must be 10 characters (4 letters + 5 digits + 1 letter)',
    example: 'ABCD12345E'
  }
};

interface DocumentFormData {
  id?: string;
  documentType: string;
  documentNumber: string;
  documentDate: string;
  expiryDate: string;
  documentFile: File | null;
  documentFile_url: string | null;
  uploadedFile?: File;
}

interface BulkDocumentsFormProps {
  initialData: { documents: DocumentFormData[] };
  onDataChange: (data: any) => void;
  canUpdateCandidates?: boolean;
  canDeleteCandidates?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  onUploadStateChange?: (uploading: boolean) => void;
}

const BulkDocumentsForm = forwardRef<any, BulkDocumentsFormProps>(
  (
    {
      initialData,
      onDataChange,
      canUpdateCandidates = true,
      canDeleteCandidates = true,
      onValidationChange,
      onUploadStateChange,
    },
    ref
  ) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role?.includes('Super Admin');

    const [data, setData] = useState(initialData);
    const [lastSentData, setLastSentData] = useState(initialData);
    const [validationErrors, setValidationErrors] = useState<
      Record<string, Record<string, string>>
    >({});
    
    // Upload states for each document
    const [uploadStates, setUploadStates] = useState<
      Record<number, { uploading: boolean; error: string | null }>
    >({});

    // Use searchable document types dropdown
    const {
      options: documentTypeOptions,
      loading: documentTypesLoading,
      search: searchDocumentTypes,
    } = useDocumentTypesDropdown();

    // Update data when initialData changes (important for edit modal)
    // Don't include 'data' in deps to avoid infinite loop
    useEffect(() => {
      setData(initialData);
      setLastSentData(initialData);
    }, [initialData]);

    // Send updates when data changes significantly
    // onDataChange should be stable from parent, but we'll use useCallback pattern
    useEffect(() => {
      if (JSON.stringify(data) !== JSON.stringify(lastSentData)) {
        onDataChange(data);
        setLastSentData(data);
      }
    }, [data, lastSentData, onDataChange]);

    // Trigger validation when errors change
    useEffect(() => {
      const hasErrors = Object.values(validationErrors).some(errors =>
        Object.values(errors).some(error => error !== '')
      );
      onValidationChange?.(!hasErrors);
    }, [validationErrors, onValidationChange]);

    // Notify parent of upload state changes
    useEffect(() => {
      const isAnyUploading = Object.values(uploadStates).some(
        state => state.uploading
      );
      onUploadStateChange?.(isAnyUploading);
    }, [uploadStates, onUploadStateChange]);

    // Helper function to get metadata for a document type
    const getDocumentTypeMetadata = useCallback(
      (documentTypeName: string | null | undefined): DocumentTypeMetadata | null => {
        if (!documentTypeName) return null;

        // Normalize provided name
        const normalizedName = documentTypeName.trim().toLowerCase();

        // Find in documentTypeOptions
        for (const option of documentTypeOptions) {
          if (!option || !option.label) continue;
          const candidate = option.label.trim().toLowerCase();

          // exact match or partial match
          if (candidate === normalizedName || candidate.includes(normalizedName) || normalizedName.includes(candidate)) {
            // Return a DocumentTypeMetadata object using data from the option
            // The API now returns these fields in the option object itself
            return {
              id: (option as any).id || (option.value as string),
              name: option.label,
              requires_expiry: (option as any).requires_expiry ?? false,
              requires_issue: (option as any).requires_issue ?? false,
              requires_number: (option as any).requires_number ?? false,
              requires_document_number_field: (option as any).requires_document_number_field ?? false,
              requires_file: (option as any).requires_file ?? false,
            };
          }
        }

        return null;
      },
      [documentTypeOptions]
    );

    // Helper function to get format rule for a document type
    const getDocumentFormatRule = useCallback(
      (documentTypeName: string | null | undefined): DocumentFormatRule | null => {
        if (!documentTypeName || typeof documentTypeName !== 'string') return null;
        // Try exact match first
        if (DOCUMENT_FORMAT_RULES[documentTypeName]) {
          return DOCUMENT_FORMAT_RULES[documentTypeName];
        }
        // Try case-insensitive match or partial match
        const normalizedName = documentTypeName.trim();
        for (const [key, rule] of Object.entries(DOCUMENT_FORMAT_RULES)) {
          if (key.toLowerCase() === normalizedName.toLowerCase() ||
              normalizedName.toLowerCase().includes(key.toLowerCase())) {
            return rule;
          }
        }
        return null;
      },
      []
    );

    // Validation functions
    const validateDocumentField = useCallback(
      (
        _index: number,
        field: string,
        value: any,
        document: DocumentFormData
      ) => {
        let error = '';
        // Safely convert value to string
        const strValue =
          value == null || value === undefined
            ? ''
            : typeof value === 'string'
              ? value
              : String(value);

        // Get metadata for the selected document type
        const metadata = getDocumentTypeMetadata(document?.documentType);

        switch (field) {
          case 'documentType':
            if (!strValue || !strValue.trim()) error = 'Document type is required';
            break;
          case 'documentNumber':
            // Check if document number field is required by metadata
            // If metadata is null (not loaded yet), we might default to required or not, 
            // but let's assume if it's not requires_document_number_field, it's optional
            const isNumberRequired = metadata ? metadata.requires_document_number_field : false;

            if (isNumberRequired && (!strValue || !strValue.trim())) {
              error = 'Document number is required';
            } else if (strValue && strValue.trim()) {
              const trimmedValue = strValue.trim().replace(/\s+/g, ''); // Remove spaces for validation
              const formatRule = getDocumentFormatRule(document?.documentType);

              if (formatRule) {
                // Validate using specific format rule if available
                if (formatRule.minLength && trimmedValue.length < formatRule.minLength) {
                  error = `Document number must be at least ${formatRule.minLength} characters`;
                } else if (formatRule.maxLength && trimmedValue.length > formatRule.maxLength) {
                  error = `Document number must not exceed ${formatRule.maxLength} characters`;
                } else if (!formatRule.pattern.test(trimmedValue)) {
                  error = formatRule.errorMessage;
                }
              } else if (metadata && metadata.requires_number) {
                // Fallback: validate as integer if requires_number is true (and no specific regex overriding it)
                // Note: The instruction says "requires_number: true means Document Number filed takes only integer"
                if (!/^\d+$/.test(trimmedValue)) {
                  error = 'Document number must be a valid integer';
                }
              }
            }
            break;
          case 'documentDate':
            // Validate only when metadata indicates the field is required.
            if (!metadata || !metadata.requires_issue) {
              break;
            }
            if (!strValue.trim()) {
              error = 'Document Issue Date is required';
            } else {
              const docDate = new Date(strValue);
              const today = new Date();
              if (docDate > today) {
                error = 'Document date cannot be in the future';
              }
            }
            break;
          case 'expiryDate':
            // Only validate if requires_expiry is true
            if (metadata && !metadata.requires_expiry) {
              // Field is disabled/optional
              break;
            }
            if (metadata && metadata.requires_expiry && !strValue.trim()) {
              error = 'Document Expiry Date is required';
            } else if (strValue.trim() && document.documentDate) {
              const docDate = new Date(document.documentDate);
              const expDate = new Date(strValue);
              if (expDate < docDate) {
                error = 'Expiry date cannot be before document date';
              }
            }
            break;
          case 'documentFile':
            if (metadata && metadata.requires_file && !document.documentFile_url && !document.documentFile) {
              error = "Document file is required";
            }
            break;
        }

        return error;
      },
      [getDocumentTypeMetadata, getDocumentFormatRule]
    );

    // Expose validateAllFields to parent via ref
    useImperativeHandle(ref, () => ({
      validateAllFields: () => {
        let hasError = false;
        const newValidationErrors: Record<string, Record<string, string>> = {};
        data.documents.forEach((document, index) => {
          const docErrors: Record<string, string> = {};
          const metadata = getDocumentTypeMetadata(document.documentType);

          docErrors.documentType = validateDocumentField(
            index,
            'documentType',
            document.documentType,
            document
          );

          // Validate number only if required or present
          docErrors.documentNumber = validateDocumentField(
            index,
            'documentNumber',
            document.documentNumber,
            document
          );
          
          // Document date - validate only if metadata indicates requires_issue.
          if (metadata && metadata.requires_issue) {
            docErrors.documentDate = validateDocumentField(
              index,
              'documentDate',
              document.documentDate,
              document
            );
          } else {
            docErrors.documentDate = '';
          }
          
          // Expiry date - only validate if requires_expiry is true
          if (metadata && metadata.requires_expiry) {
            docErrors.expiryDate = validateDocumentField(
              index,
              'expiryDate',
              document.expiryDate,
              document
            );
          } else {
            docErrors.expiryDate = '';
          }

          // File upload validation
          if (metadata && metadata.requires_file) {
            docErrors.documentFile = validateDocumentField(
              index,
              'documentFile',
              null, // value check handled inside function using document obj
              document
            );
          } else {
            docErrors.documentFile = '';
          }

          if (
            docErrors.documentType ||
            docErrors.documentNumber ||
            docErrors.documentDate ||
            docErrors.expiryDate ||
            docErrors.documentFile
          ) {
            hasError = true;
          }
          newValidationErrors[index] = docErrors;
        });
        setValidationErrors(newValidationErrors);
        return !hasError;
      },
    }), [data, validateDocumentField, getDocumentTypeMetadata]);

    // Document file upload handler (similar to HeaderForm)
    const handleDocumentUpload = useCallback(
      async (index: number, file: File | null) => {
        if (!file) {
          // Clear everything when file is explicitly removed
          const updatedDocuments = [...data.documents];
          updatedDocuments[index] = {
            ...updatedDocuments[index],
            documentFile: null,
            documentFile_url: null,
            uploadedFile: undefined,
          };
          const newData = { ...data, documents: updatedDocuments };
          setData(newData);
          onDataChange(newData);
          setLastSentData(newData);
          setUploadStates(prev => ({
            ...prev,
            [index]: { uploading: false, error: null },
          }));
          return;
        }

        // Set uploading state
        setUploadStates(prev => ({
          ...prev,
          [index]: { uploading: true, error: null },
        }));

        try {
          // Validate file
          const validation = FileUploadService.validateFile(file, {
            maxSize: 10,
            allowedTypes: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          });

          if (!validation.valid) {
            throw new Error(validation.error || 'Invalid document file');
          }

          // Upload to server immediately using single document upload
          const uploadResponses =
            await FileUploadService.uploadCandidateDocuments(file);
          const uploadResponse = uploadResponses[0]; // Get the first (and only) response
          console.log('Document uploaded successfully:', uploadResponse);

          // Update form with uploaded URL
          const updatedDocuments = [...data.documents];
          updatedDocuments[index] = {
            ...updatedDocuments[index],
            documentFile: file,
            documentFile_url: uploadResponse.file_url,
            uploadedFile: file,
          };
          const newData = { ...data, documents: updatedDocuments };
          setData(newData);
          onDataChange(newData);
          setLastSentData(newData);

          // Clear uploading state
          setUploadStates(prev => ({
            ...prev,
            [index]: { uploading: false, error: null },
          }));

          console.log(
            'Document upload completed, URL stored:',
            uploadResponse.file_url
          );
        } catch (error) {
          console.error('Document upload failed:', error);
          const errorMsg =
            error instanceof Error ? error.message : 'Upload failed';

          setUploadStates(prev => ({
            ...prev,
            [index]: { uploading: false, error: errorMsg },
          }));

          // Clear form data on error
          const updatedDocuments = [...data.documents];
          updatedDocuments[index] = {
            ...updatedDocuments[index],
            documentFile: null,
            documentFile_url: null,
            uploadedFile: undefined,
          };
          const newData = { ...data, documents: updatedDocuments };
          setData(newData);
          onDataChange(newData);
          setLastSentData(newData);
        }
      },
      [data, onDataChange]
    );

    const handleDocumentChange = useCallback(
      (index: number, field: keyof DocumentFormData, value: any) => {
        if (field === 'documentFile' && value instanceof File) {
          // Only call upload handler for actual File objects (user selections)
          handleDocumentUpload(index, value);
        } else {
          // Extract value from dropdown objects (for documentType field)
          let finalValue = value;
          if (field === 'documentType' && value && typeof value === 'object') {
            finalValue = value.value || value;
          }

          // Auto-format document number based on document type
          if (field === 'documentNumber' && typeof finalValue === 'string') {
            const currentDocType = data.documents[index]?.documentType;
            if (currentDocType) {
              const formatRule = getDocumentFormatRule(currentDocType);
              if (formatRule) {
                // Auto-uppercase for document types that require it
                if (formatRule.pattern.toString().includes('[A-Z]')) {
                  finalValue = finalValue.toUpperCase();
                }
                // Remove spaces for cleaner input
                finalValue = finalValue.replace(/\s+/g, '');
              }
            }
          }

          setData(prev => {
            const updatedDocuments = [...prev.documents];
            const currentDoc = updatedDocuments[index];
            
            // If document type changes, clear fields based on new metadata
            if (field === 'documentType') {
              const newMetadata = getDocumentTypeMetadata(finalValue);
              updatedDocuments[index] = {
                ...currentDoc,
                documentType: finalValue,
                // Clear document number when type changes
                documentNumber: '',
                // Clear document date if not required
                documentDate: newMetadata && !newMetadata.requires_issue ? '' : currentDoc.documentDate,
                // Clear expiry date if not required
                expiryDate: newMetadata && !newMetadata.requires_expiry ? '' : currentDoc.expiryDate,
              };
            } else {
              updatedDocuments[index] = {
                ...currentDoc,
                [field]: finalValue,
              };
            }

            // Validate using the updated document
            const updatedDocument = updatedDocuments[index];
            const error = validateDocumentField(
              index,
              field as string,
              finalValue,
              updatedDocument
            );

            // Update validation errors
            setValidationErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              if (!newErrors[index]) newErrors[index] = {};
              newErrors[index][field] = error;
              return newErrors;
            });

            return { ...prev, documents: updatedDocuments };
          });
        }
      },
      [validateDocumentField, handleDocumentUpload, getDocumentTypeMetadata]
    );

    const handleAddDocument = () => {
      if (!canUpdateCandidates) {
        console.warn('User does not have permission to update candidate data');
        return;
      }
      const newData = {
        ...data,
        documents: [
          ...data.documents,
          {
            documentType: '',
            documentNumber: '',
            documentDate: '',
            expiryDate: '',
            documentFile: null,
            documentFile_url: null,
          },
        ],
      };
      setData(newData);
      onDataChange(newData);
      setLastSentData(newData);
    };

    const handleRemoveDocument = (index: number) => {
      if (!canDeleteCandidates) {
        console.warn('User does not have permission to delete candidate data');
        return;
      }
      const newData = {
        ...data,
        documents: data.documents.filter((_, i) => i !== index),
      };
      setData(newData);
      onDataChange(newData);
      setLastSentData(newData);
    };

    // Check if a PAN Card document already exists (excluding current document)
    const panCardExists = (excludeIndex?: number): boolean => {
      return data.documents.some((doc, idx) => 
        doc.documentType === 'PAN Card' && (excludeIndex === undefined || idx !== excludeIndex)
      );
    };

    return (
      <div className="p-6 space-y-6">
        {documentTypesLoading && (
          <div className="text-sm text-gray-500">
            Loading document types...
          </div>
        )}
        <div className="space-y-4">
          {data.documents.map((document, index) => {
            // Safety check for document object
            if (!document) return null;
            
            // Get metadata for current document type
            const currentMetadata = getDocumentTypeMetadata(document.documentType);
            // Get format rule for current document type
            const formatRule = getDocumentFormatRule(document.documentType);
            
            // Check if this is a pre-populated PAN Card that should be locked
            // Pre-populated documents have an 'id' from the initial load
            const isPrepopulated = !!document.id;
            const isPanCardLocked = isPrepopulated && 
                                   document.documentType === 'PAN Card' && 
                                   !!document.documentNumber &&
                                   !isSuperAdmin;

            // Filter document options to remove types already selected in other rows
            const selectedTypesInOtherRows = data.documents
              .filter((_, idx) => idx !== index) // Exclude current row
              .map(doc => doc.documentType)
              .filter(Boolean);

            const filteredDocumentOptions = documentTypeOptions.filter(
              opt => !selectedTypesInOtherRows.includes(opt.label)
            );
            return (
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
                        onClick={
                          canDeleteCandidates
                            ? () => handleRemoveDocument(index)
                            : undefined
                        }
                        disabled={!canDeleteCandidates}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Icon name="trash" size={16} />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <SearchDropdown
                      label="Document Type"
                      options={filteredDocumentOptions}
                      value={document.documentType || ''}
                      onChange={(option: any) => {
                        handleDocumentChange(index, 'documentType', option?.label || '');
                      }}
                      onInputChange={(input: string, action: any) => {
                        // Search when user types
                        if (action.action === 'input-change') {
                          searchDocumentTypes(input);
                        }
                      }}
                      loading={documentTypesLoading}
                      required
                      disabled={isPanCardLocked}
                      placeholder="Search for document type..."
                      disableFilter={true}
                    />
                    {validationErrors[index]?.documentType && (
                      <span className="text-red-500 text-xs">
                        {validationErrors[index].documentType}
                      </span>
                    )}
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Document Number "
                      value={document.documentNumber || ''}
                      onChange={value =>
                        handleDocumentChange(index, 'documentNumber', value)
                      }
                      placeholder={
                        formatRule
                          ? formatRule.placeholder
                          : currentMetadata && currentMetadata.requires_number
                            ? 'Enter integer only'
                            : 'e.g., A12345678'
                      }
                      type={
                        currentMetadata && currentMetadata.requires_number && !formatRule
                          ? 'number'
                          : 'text'
                      }
                      maxLength={formatRule?.maxLength}
                      required={currentMetadata ? currentMetadata.requires_document_number_field : false}
                      disabled={isPanCardLocked}
                      helpText={
                        isPanCardLocked 
                          ? 'PAN Card already exists and cannot be edited' 
                          : (formatRule && !validationErrors[index]?.documentNumber ? `Example: ${formatRule.example}` : undefined)
                      }
                    />
                    {validationErrors[index]?.documentNumber && (
                      <span className="text-red-500 text-xs">
                        {validationErrors[index].documentNumber}
                      </span>
                    )}
                  </div>
                  <div>
                    <FileUpload
                      label={
                        document.documentFile_url
                          ? 'Document File'
                          : 'Upload Document'
                      }
                      accept=".pdf,.doc,.docx"
                      onChange={(file) => {
                        handleDocumentChange(index, 'documentFile', file);
                        // When clearing a file, also clear the uploaded URL to stay in drag & drop mode
                        if (file === null && document.documentFile_url) {
                          handleDocumentChange(index, 'documentFile_url', null);
                        }
                      }}
                      uploading={uploadStates[index]?.uploading || false}
                      error={uploadStates[index]?.error || undefined}
                      required={currentMetadata ? currentMetadata.requires_file : false}
                      dragDrop={true}
                      currentFile={
                        document.documentFile_url
                          ? { name: document.documentFile_url.split('/').pop() || 'Document' }
                          : undefined
                      }
                      onViewFile={
                        document.documentFile_url
                          ? () => FileUploadService.openFile(document.documentFile_url!, 'view')
                          : undefined
                      }
                    />
                    {/* Upload is optional — no uploaded-file validation shown unless required */}
                    {validationErrors[index]?.documentFile && (
                      <span className="text-red-500 text-xs mt-1 block">
                        {validationErrors[index].documentFile}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <EnhancedInputField
                      label="Document Date "
                      type="date"
                      value={document.documentDate || ''}
                      onChange={value =>
                        handleDocumentChange(index, 'documentDate', value)
                      }
                      required={currentMetadata ? currentMetadata.requires_issue : false}
                      disabled={currentMetadata ? !currentMetadata.requires_issue : true}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {validationErrors[index]?.documentDate && (
                      <span className="text-red-500 text-xs">
                        {validationErrors[index].documentDate}
                      </span>
                    )}
                  </div>
                  <div>
                    <EnhancedInputField
                      label="Expiry Date"
                      type="date"
                      value={document.expiryDate || ''}
                      onChange={value =>
                        handleDocumentChange(index, 'expiryDate', value)
                      }
                      min={document.documentDate}
                      required={currentMetadata ? currentMetadata.requires_expiry : false}
                      disabled={currentMetadata ? !currentMetadata.requires_expiry : true}
                    />
                    {validationErrors[index]?.expiryDate && (
                      <span className="text-red-500 text-xs">
                        {validationErrors[index].expiryDate}
                      </span>
                    )}
                  </div>
                </div>
            </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          onClick={canUpdateCandidates ? handleAddDocument : undefined}
          disabled={!canUpdateCandidates}
          className="w-full"
        >
          <Icon name="plus" size={16} className="mr-2" />
          Add Document
        </Button>
      </div>
    );
  }
);
export { BulkDocumentsForm };
