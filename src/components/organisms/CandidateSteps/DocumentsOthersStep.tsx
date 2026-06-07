import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon/Icon';
import Tabs from '../../atoms/Tabs/Tabs';
import { FormUtils } from '../../utils/FormUtils';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import AsyncSelect from '../../atoms/AsyncSelect/AsyncSelect';
import Modal from '../../atoms/Modal/Modal';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';
import {
  useDocumentTypesDropdown,
  useSourceTypesDropdown,
  useFlagsDropdown,
  useFilteredSourceNamesDropdown, // Use filtered source names dropdown
} from '../../../hooks/useDropdowns';
import { useTabBasedAutoSave } from '../../../hooks/useTabBasedAutoSave';
import FileUploadService, {
  DocumentUploadResponse,
} from '../../../services/fileUploadService';
import { CandidateDocument } from '../../../types/candidate';
import { transformDocumentForAPI } from '../../../utils/apiDataTransform';
import { apiCall } from '../../../utils/api/useSWR';

// Document type metadata from API
interface DocumentTypeMetadata {
  id: string;
  name: string;
  requires_expiry: boolean;
  requires_issue: boolean;
  requires_number: boolean;
  requires_document_number_field: boolean;
  requires_file: boolean;
}

interface DocumentTypeResponse {
  dropdown_type: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: DocumentTypeMetadata[];
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
  AadhaarCard: {
    pattern: /^\d{12}$/,
    minLength: 12,
    maxLength: 12,
    placeholder: '1234 5678 9012',
    errorMessage: 'Aadhaar number must be exactly 12 digits',
    example: '123456789012',
  },
  'Pan Card': {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    minLength: 10,
    maxLength: 10,
    placeholder: 'ABCDE1234F',
    errorMessage: 'PAN must be 10 characters (e.g., ABCDE1234F)',
    example: 'ABCDE1234F',
  },
  Passport: {
    pattern: /^[A-Z]{1}[0-9]{7}$/,
    minLength: 8,
    maxLength: 8,
    placeholder: 'A1234567',
    errorMessage: 'Passport number must be 8 characters (1 letter + 7 digits)',
    example: 'A1234567',
  },
  'Driving License': {
    pattern: /^[A-Z]{2}[0-9]{13}$/,
    minLength: 15,
    maxLength: 15,
    placeholder: 'DL1420110012345',
    errorMessage:
      'Driving License must be 15 characters (2 letters + 13 digits)',
    example: 'DL1420110012345',
  },
  'GST Certificate': {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    minLength: 15,
    maxLength: 15,
    placeholder: '22AAAAA0000A1Z5',
    errorMessage: 'GST number must be 15 characters (e.g., 22AAAAA0000A1Z5)',
    example: '22AAAAA0000A1Z5',
  },
  UAN: {
    pattern: /^\d{12}$/,
    minLength: 12,
    maxLength: 12,
    placeholder: '123456789012',
    errorMessage: 'UAN must be exactly 12 digits',
    example: '123456789012',
  },
  CIN: {
    pattern: /^[UL]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    minLength: 21,
    maxLength: 21,
    placeholder: 'U12345AB1234ABC123456',
    errorMessage: 'CIN must be 21 characters',
    example: 'U12345AB1234ABC123456',
  },
  'TAN Number': {
    pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
    minLength: 10,
    maxLength: 10,
    placeholder: 'ABCD12345E',
    errorMessage: 'TAN must be 10 characters (4 letters + 5 digits + 1 letter)',
    example: 'ABCD12345E',
  },
};

interface DocumentForm {
  id: string;
  documentName: string;
  documentNo: string;
  docDate: string;
  expiryDate: string;
  docUpload: File | null;
  uploadedUrl?: string; // URL after successful upload
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadError?: string;
}

// Props interface for step components
interface StepComponentProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onNext?: () => void; // ← NEW: Navigation props
  onPrevious?: () => void; // ← NEW: Navigation props
  currentStep?: number; // ← NEW: Step tracking
  totalSteps?: number; // ← NEW: Total steps
  onFileUpload?: {
    candidatePicture?: (
      file: File | null,
      onChange: (field: string, value: any) => void
    ) => void;
    resume?: (
      file: File | null,
      onChange: (field: string, value: any) => void
    ) => void;
    documents?: (
      files: File[],
      documentInfo: any,
      onChange: (field: string, value: any) => void,
      currentDocuments: any[]
    ) => void;
  };
  uploadStates?: {
    avatar?: { uploading: boolean; error: string | null };
    resume?: { uploading: boolean; error: string | null };
    documents?: { uploading: boolean; error: string | null };
  };
}

const DocumentsOthersStep: React.FC<StepComponentProps> = ({
  formData,
  onChange,
  errors,
  touched,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
  onFileUpload,
  uploadStates,
}) => {
  // Use searchable document type dropdown
  const {
    options: documentTypeOptions,
    loading: documentTypeLoading,
    error: documentTypeError,
    search: searchDocumentType,
  } = useDocumentTypesDropdown();

  // Use searchable source type dropdown
  const {
    options: sourceTypeOptions,
    loading: sourceTypeLoading,
    error: sourceTypeError,
    search: searchSourceType,
  } = useSourceTypesDropdown();

  // Get selected source type ID from form data (now stored as ID directly)
  const selectedSourceTypeId =
    (formData.source_details || {}).source_type || '';

  // Use filtered source names dropdown based on selected source type ID
  const {
    options: sourceNameOptions,
    loading: sourceNameLoading,
    error: sourceNameError,
    search: searchSourceName,
  } = useFilteredSourceNamesDropdown(selectedSourceTypeId);

  // Use searchable flags dropdown
  const {
    options: flagsOptions,
    loading: flagsLoading,
    error: flagsError,
    search: searchFlags,
  } = useFlagsDropdown();

  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isSavingDocument, setIsSavingDocument] = useState<{
    [key: string]: boolean;
  }>({});

  // Touched state for document fields
  const [documentTouched, setDocumentTouched] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // Document type metadata from API
  const [documentTypesMetadata, setDocumentTypesMetadata] = useState<
    DocumentTypeMetadata[]
  >([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);

  // Validation errors for each document form
  const [documentValidationErrors, setDocumentValidationErrors] = useState<
    Record<string, Record<string, string>>
  >({});

  // Validation errors for source details
  const [sourceDetailsValidationErrors, setSourceDetailsValidationErrors] =
    useState<Record<string, string>>({});

  // Touched state for source details fields
  const [sourceDetailsTouched, setSourceDetailsTouched] = useState<
    Record<string, boolean>
  >({});

  // Tab management
  type TabType = 'documents' | 'others';
  const [activeTab, setActiveTab] = useState<TabType>('documents');

  // Fetch document types from API on mount
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setLoadingDocumentTypes(true);
        const response = await apiCall<DocumentTypeResponse>(
          '/candidates/dropdowns/Document_type'
        );

        if (response.error) {
          console.error('Error fetching document types:', response.error);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setDocumentTypesMetadata(response.data.data);
          console.log('Document types loaded:', response.data.data.length);
        }
      } catch (error) {
        console.error('Error fetching document types:', error);
      } finally {
        setLoadingDocumentTypes(false);
      }
    };
    fetchDocumentTypes();
  }, []);

  // Helper function to get metadata for a document type
  const getDocumentTypeMetadata = useCallback(
    (
      documentTypeName: string | null | undefined
    ): DocumentTypeMetadata | null => {
      if (!documentTypeName) return null;
      return (
        documentTypesMetadata.find(dt => dt.name === documentTypeName) || null
      );
    },
    [documentTypesMetadata]
  );

  // Helper function to get format rule for a document type
  const getDocumentFormatRule = useCallback(
    (
      documentTypeName: string | null | undefined
    ): DocumentFormatRule | null => {
      if (!documentTypeName || typeof documentTypeName !== 'string')
        return null;
      // Try exact match first
      if (DOCUMENT_FORMAT_RULES[documentTypeName]) {
        return DOCUMENT_FORMAT_RULES[documentTypeName];
      }
      // Try case-insensitive match or partial match
      const normalizedName = documentTypeName.trim();
      for (const [key, rule] of Object.entries(DOCUMENT_FORMAT_RULES)) {
        if (
          key.toLowerCase() === normalizedName.toLowerCase() ||
          normalizedName.toLowerCase().includes(key.toLowerCase())
        ) {
          return rule;
        }
      }
      return null;
    },
    []
  );

  // Validation function for source details
  const validateSourceDetailsField = useCallback(
    (field: string, value: string): string => {
      switch (field) {
        case 'source_type':
          return !value ? 'Source type is required' : '';
        case 'source_name':
          return !value ? 'Source name is required' : '';
        default:
          return '';
      }
    },
    []
  );

  // Validation function for document fields
  const validateDocumentField = useCallback(
    (formId: string, field: string, value: any, form: DocumentForm, isFirstDoc: boolean = false): string => {
      let error = '';
      // Safely convert value to string
      const strValue =
        value == null || value === undefined
          ? ''
          : typeof value === 'string'
            ? value
            : String(value);

      // Get metadata for the selected document type
      const metadata = getDocumentTypeMetadata(form?.documentName);

      switch (field) {
        case 'documentName':
          if (!strValue || !strValue.trim())
            error = 'Document type is required';
          break;
        case 'documentNo':
          // Check if document number field is required by metadata
          // If metadata is null (not loaded yet), we might default to required or not, 
          // but let's assume if it's not requires_document_number_field, it's optional
          const isNumberRequired = metadata ? metadata.requires_document_number_field : true;

          if (isNumberRequired && (!strValue || !strValue.trim())) {
            error = 'Document number is required';
          } else if (strValue && strValue.trim()) {
            const trimmedValue = strValue.trim().replace(/\s+/g, ''); // Remove spaces for validation
            const formatRule = getDocumentFormatRule(form?.documentName);

            if (formatRule) {
              // Validate using specific format rule
              if (
                formatRule.minLength &&
                trimmedValue.length < formatRule.minLength
              ) {
                error = `Document number must be at least ${formatRule.minLength} characters`;
              } else if (
                formatRule.maxLength &&
                trimmedValue.length > formatRule.maxLength
              ) {
                error = `Document number must not exceed ${formatRule.maxLength} characters`;
              } else if (!formatRule.pattern.test(trimmedValue)) {
                error = formatRule.errorMessage;
              }
            } else if (metadata && metadata.requires_number) {
              // Fallback: validate as integer if requires_number is true
              if (!/^\d+$/.test(trimmedValue)) {
                error = 'Document number must be a valid integer';
              }
            }
          }
          break;
        case 'docDate':
          // Only validate if requires_issue is true
          if (metadata && !metadata.requires_issue) {
            // Field is disabled, no validation needed
            break;
          }
          if (metadata && metadata.requires_issue && !strValue.trim()) {
            error = 'Document Issue Date is required';
          } else if (strValue && strValue.trim()) {
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
            // Field is disabled, no validation needed
            break;
          }
          if (strValue && strValue.trim() && form.docDate) {
            const docDate = new Date(form.docDate);
            const expDate = new Date(strValue);
            if (expDate < docDate) {
              error = 'Expiry date cannot be before document date';
            }
          }
          break;
        case 'docUpload':
          if (metadata && metadata.requires_file && !form.uploadedUrl && !form.docUpload) {
            error = "Document file is required";
          }
          break;
      }

      return error;
    },
    [getDocumentTypeMetadata, getDocumentFormatRule]
  );

  const handleTabChange = (tabId: string) => {
    if (tabId === 'documents' || tabId === 'others') {
      console.log('=== DocumentsOthersStep Tab Change with Auto-Save ===');
      console.log('Switching from:', activeTab, 'to:', tabId);

      autoSaveTabForms(activeTab);

      setActiveTab(tabId);
    }
  };

  // Form visibility state - removed since we're using multi-form pattern

  // Documents state (initialize from formData if exists)
  const [documents, setDocuments] = useState<CandidateDocument[]>(
    formData.documents || []
  );

  // Sync local documents state with formData when it changes
  useEffect(() => {
    if (formData.documents && Array.isArray(formData.documents)) {
      setDocuments(formData.documents);
    }
  }, [formData.documents]);

  // Validate source details when formData changes
  // useEffect(() => {
  //   if (formData.source_details) {
  //     // Validate source type
  //     const sourceTypeError = validateSourceDetailsField(
  //       'source_type',
  //       formData.source_details.source_type || ''
  //     );
  //     if (sourceTypeError) {
  //       setSourceDetailsValidationErrors(prev => ({
  //         ...prev,
  //         source_type: sourceTypeError,
  //       }));
  //     }

  //     // Validate source name
  //     const sourceNameError = validateSourceDetailsField(
  //       'source_name',
  //       formData.source_details.source_name || ''
  //     );
  //     if (sourceNameError) {
  //       setSourceDetailsValidationErrors(prev => ({
  //         ...prev,
  //         source_name: sourceNameError,
  //       }));
  //     }
  //   }
  // }, [formData.source_details]);

  useEffect(() => {
    return () => {
      // Auto-save document forms
      activeDocumentForms.forEach(form => {
        if (isDocumentFormValid(form)) {
          console.log('Auto-saving document form on unmount:', form.id);
          saveDocument(form.id);
        }
      });
    };
  }, []); // No dependencies - only run on mount/unmount

  // Modal state management
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '',
    title: '',
    placeholder: '',
    value: '',
  });

  // Modal handlers
  const openModal = (type: string, title: string, placeholder: string) => {
    setModalState({
      isOpen: true,
      type,
      title,
      placeholder,
      value: '',
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: '',
      title: '',
      placeholder: '',
      value: '',
    });
  };

  const handleModalSubmit = () => {
    if (modalState.value.trim()) {
      // For now, we'll just close the modal
      // In a real app, this would save to a backend
      closeModal();
    }
  };

  // Helper function to convert between string values and AsyncSelectOption format for document types
  const getDocumentTypeOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = documentTypeOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for source types
  const getSourceTypeOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = sourceTypeOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for source names
  const getSourceNameOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = sourceNameOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for flags
  const getFlagsOptionFromValue = (value: string) => {
    if (!value || value === 'Blue') {
      // Find the Blue option in flagsOptions, or create a default one
      const blueOption = flagsOptions.find(opt => opt.label === 'Blue');
      return blueOption || { value: 'Blue', label: 'Blue' };
    }
    const option = flagsOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert ID to label/name
  const convertIdToLabel = (id: string, options: any[]): string => {
    if (!id || !options || options.length === 0) return id;
    const option = options.find(opt => opt.value === id || opt.id === id);
    return option ? option.label : id;
  };

  // Tab configuration
  const tabs = [
    {
      id: 'documents',
      label: 'Documents',
      count: documents.length,
    },
    {
      id: 'others',
      label: 'Other Details',
      count: 0,
    },
  ];

  // Navigation functions for tab progression
  const handleTabNext = () => {
    if (activeTab === 'documents') {
      // Move from Documents to Others tab
      setActiveTab('others');
      return false; // Don't proceed to next wizard step yet
    } else if (activeTab === 'others') {
      // This is the final step, allow form submission
      return true; // Proceed to form submission
    }
    return true;
  };

  const handleTabPrevious = () => {
    if (activeTab === 'others') {
      // Move from Others to Documents tab
      setActiveTab('documents');
      return false; // Don't go to previous wizard step yet
    } else if (activeTab === 'documents') {
      // Allow going to previous wizard step (Employment & Projects)
      return true; // Go to previous wizard step
    }
    return true;
  };

  // Replace the activeDocumentForms initialization
  const [activeDocumentForms, setActiveDocumentForms] = useState<
    DocumentForm[]
  >(() => {
    // Show initial form only if no documents exist
    if (!formData.documents || formData.documents.length === 0) {
      return [
        {
          id: `temp-document-initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          documentName: 'PAN Card', // Pre-populate with PAN Card (correct API casing)
          documentNo: formData.panNo || '', // Pre-populate with PAN number
          docDate: '',
          expiryDate: '',
          docUpload: null,
        },
      ];
    }
    return [];
  });

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    // 1. Update active document forms (if any)
    if (activeDocumentForms.length > 0) {
      setActiveDocumentForms(forms =>
        forms.map((form, index) => {
          // If it's the first form (which corresponds to initial PAN Card entry)
          if (documents.length === 0 && index === 0) {
            // Only update if value is different to avoid infinite loops
            if (form.documentNo !== formData.panNo) {
              return {
                ...form,
                documentNo: formData.panNo || '',
              };
            }
          }
          return form;
        })
      );
    }

    // 2. Update saved documents list (if PAN Card exists there)
    if (documents.length > 0) {
      const panDocIndex = documents.findIndex(doc => doc.document_name === 'PAN Card');
      if (panDocIndex !== -1 && documents[panDocIndex].document_number !== formData.panNo) {
        const updatedDocuments = [...documents];
        updatedDocuments[panDocIndex] = {
          ...updatedDocuments[panDocIndex],
          document_number: formData.panNo || ''
        };
        setDocuments(updatedDocuments);
        onChange('documents', updatedDocuments);
      }
    }
  }, [formData.panNo, documents, activeDocumentForms, onChange]);

  const addDocumentForm = async () => {
    // Prevent double-clicking
    if (isAddingDocument) {
      return;
    }

    setIsAddingDocument(true);

    try {
      const newForm: DocumentForm = {
        id: `temp-document-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        documentName: '',
        documentNo: '',
        docDate: '',
        expiryDate: '',
        docUpload: null,
      };

      setActiveDocumentForms(currentForms => [...currentForms, newForm]);
    } catch (error) {
      console.error('Error in addDocumentForm:', error);
    } finally {
      setIsAddingDocument(false);
    }
  };

  const updateDocumentForm = (
    formId: string,
    field: keyof DocumentForm,
    value: string | File | null
  ) => {
    // Mark field as touched when value changes
    if (typeof field === 'string') {
      markDocumentFieldTouched(formId, field);
    }

    let finalValue = value;

    // Auto-format document number based on document type
    if (field === 'documentNo' && typeof finalValue === 'string') {
      const currentForm = activeDocumentForms.find(f => f.id === formId);
      const currentDocType = currentForm?.documentName;
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

    setActiveDocumentForms(forms =>
      forms.map(form => {
        if (form.id === formId) {
          const updatedForm = { ...form, [field]: finalValue };

          // If document name changes, clear fields based on new metadata
          if (field === 'documentName' && typeof finalValue === 'string') {
            const newMetadata = getDocumentTypeMetadata(finalValue);
            updatedForm.docDate =
              newMetadata && !newMetadata.requires_issue ? '' : form.docDate;
            updatedForm.expiryDate =
              newMetadata && !newMetadata.requires_expiry
                ? ''
                : form.expiryDate;
            // Clear document number when type changes (except for first form with PAN)
            const isFirstForm =
              activeDocumentForms[0]?.id === formId && documents.length === 0;
            if (!isFirstForm) {
              updatedForm.documentNo = '';
            }
          }

          // Validate the field that changed
          if (typeof field === 'string') {
            // Check if this is the first document
            const isFirstDocument = activeDocumentForms[0]?.id === formId && documents.length === 0;
            const error = validateDocumentField(
              formId,
              field,
              finalValue,
              updatedForm,
              isFirstDocument
            );
            setDocumentValidationErrors(prev => ({
              ...prev,
              [formId]: {
                ...prev[formId],
                [field]: error,
              },
            }));
          }

          return updatedForm;
        }
        return form;
      })
    );
  };

  const removeDocumentForm = (formId: string) => {
    setActiveDocumentForms(forms => forms.filter(form => form.id !== formId));
  };

  const removeDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    onChange('documents', updatedDocuments);
  };

  const editDocument = (document: CandidateDocument) => {
    // 1. Create a form form the document data
    const editForm: DocumentForm = {
      id: document.id || `doc-edit-${Date.now()}`,
      documentName: document.document_name,
      documentNo: document.document_number,
      docDate: document.document_date || '',
      expiryDate: document.expiry_date || '',
      docUpload: null, // File logic is handled by uploadedUrl
      uploadedUrl: document.document_url,
      uploadStatus: document.document_url ? 'success' : undefined,
    };

    // 2. Remove from saved list
    const updatedDocuments = documents.filter(doc => doc.id !== document.id);
    setDocuments(updatedDocuments);
    onChange('documents', updatedDocuments);

    // 3. Add to active forms
    setActiveDocumentForms(prev => [...prev, editForm]);
  };

  // File upload handlers
  const handleFileSelect = async (formId: string, file: File | null) => {
    if (!file) return;

    // Update form with the file
    updateDocumentForm(formId, 'docUpload', file);

    // Automatically upload the document, passing the file directly
    await uploadDocument(formId, file);
  };


  const uploadDocument = async (formId: string, fileToUpload?: File) => {
    const form = activeDocumentForms.find(f => f.id === formId);
    if (!form) return;

    // Use the passed file or the one from form state
    const file = fileToUpload || form.docUpload;
    if (!file) return;

    try {
      updateDocumentForm(formId, 'uploadStatus', 'uploading');

      // Prepare document metadata
      const documentInfo = {
        document_name: form.documentName,
        document_number: form.documentNo,
        document_date: form.docDate,
        expiry_date: form.expiryDate,
      };

      const uploadResults = await FileUploadService.uploadCandidateDocuments(
        file,
        documentInfo
      );

      if (uploadResults && uploadResults.length > 0) {
        const uploadResult = uploadResults[0];
        updateDocumentForm(formId, 'uploadedUrl', uploadResult.file_url);
        updateDocumentForm(formId, 'uploadStatus', 'success');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      updateDocumentForm(formId, 'uploadStatus', 'error');
      updateDocumentForm(
        formId,
        'uploadError',
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  };

  // Mark document field as touched
  const markDocumentFieldTouched = (formId: string, field: string) => {
    setDocumentTouched(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: true,
      },
    }));
  };

  const saveDocument = (formId: string) => {
    // Prevent double-clicking
    if (isSavingDocument[formId]) {
      return;
    }

    // Find form first to get metadata
    const form = activeDocumentForms.find(f => f.id === formId);
    if (!form) {
      console.error('Form not found for ID:', formId);
      return;
    }

    const metadata = getDocumentTypeMetadata(form.documentName);

    // Mark all required fields as touched to show validation errors
    const requiredFields = ['documentName'];

    if (!metadata || metadata.requires_document_number_field) {
      requiredFields.push('documentNo');
    }
    if (metadata && metadata.requires_issue) {
      requiredFields.push('docDate');
    }
    if (metadata && metadata.requires_expiry) {
      requiredFields.push('expiryDate');
    }

    requiredFields.forEach(field => {
      markDocumentFieldTouched(formId, field);
    });

    setIsSavingDocument(prev => ({ ...prev, [formId]: true }));

    // form is already defined above
    console.log('=== Save Document Debug ===');
    console.log('Form data:', form);
    console.log('Upload status:', form.uploadStatus);
    console.log('Uploaded URL:', form.uploadedUrl);
    console.log('Has file:', !!form.docUpload);

    // Validate required fields using the validation function
    if (!isDocumentFormValid(form)) {
      // Errors will be displayed through the validation UI
      setIsSavingDocument(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
      return;
    }

    // Use centralized upload handler if available
    if (onFileUpload?.documents) {
      // Create document info for the upload handler
      const documentInfo = {
        document_name: form.documentName,
        document_number: form.documentNo,
        document_date: form.docDate,
        expiry_date: form.expiryDate,
      };

      // Get current documents from formData (most up-to-date source)
      const currentDocuments = formData.documents || [];

      // Check if document was already uploaded (has uploadedUrl)
      if (form.uploadedUrl && form.uploadStatus === 'success') {
        // Document already uploaded, create document object with existing URL
        const newDocument: CandidateDocument = {
          id: `doc_${Date.now()}`,
          document_name: form.documentName,
          document_number: form.documentNo,
          document_date: form.docDate,
          expiry_date: form.expiryDate,
          document_url: form.uploadedUrl, // Use the already uploaded URL
        };

        console.log('Using already uploaded document:', newDocument);

        // Add to existing documents array
        const updatedDocuments = [...currentDocuments, newDocument];
        onChange('documents', updatedDocuments);
      } else if (form.docUpload) {
        // Document not uploaded yet, use centralized upload handler
        console.log('Document not uploaded yet, using centralized handler');
        onFileUpload.documents(
          [form.docUpload],
          documentInfo,
          onChange,
          currentDocuments
        );
      } else {
        // No file uploaded and no uploaded URL — create document without a file
        const newDocument: CandidateDocument = {
          id: `doc_${Date.now()}`,
          document_name: form.documentName,
          document_number: form.documentNo,
          document_date: form.docDate,
          expiry_date: form.expiryDate,
          document_url: '',
        };

        const updatedDocuments = [...currentDocuments, newDocument];
        onChange('documents', updatedDocuments);
      }
      // Remove this form from active forms
      removeDocumentForm(formId);

      // Reset saving state
      setIsSavingDocument(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    } else {
      // Reset saving state even on error
      setIsSavingDocument(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    }
  };

  // Helper function to check if a document form is valid
  const isDocumentFormValid = (form: DocumentForm): boolean => {
    const metadata = getDocumentTypeMetadata(form.documentName);

    // Check if required fields are filled
    if (!form.documentName?.trim()) return false;

    const isNumberRequired = metadata ? metadata.requires_document_number_field : true;
    if (isNumberRequired && !form.documentNo?.trim()) return false;

    if (metadata && metadata.requires_issue && !form.docDate?.trim()) return false;

    if (metadata && metadata.requires_expiry && !form.expiryDate?.trim()) return false;

    if (metadata && metadata.requires_file && !form.uploadedUrl && !form.docUpload) return false;

    // Check if there are validation errors
    const formErrors = documentValidationErrors[form.id];
    if (formErrors) {
      // Check if any field has an error regardless of requirement
      if (formErrors.documentName) return false;
      if (formErrors.documentNo) return false;
      if (formErrors.docDate) return false;
      if (formErrors.expiryDate) return false;
    }

    // Check if upload has an error
    if (form.uploadStatus === 'error') {
      return false;
    }

    return true;
  };

  // Helper function to check if source details are valid
  const isSourceDetailsValid = (): boolean => {
    const sourceDetails = formData.source_details || {};

    // Check if required fields are filled
    if (!sourceDetails.source_type?.trim()) return false;
    if (!sourceDetails.source_name?.trim()) return false;

    // Check if there are validation errors
    if (sourceDetailsValidationErrors.source_type) return false;
    if (sourceDetailsValidationErrors.source_name) return false;

    return true;
  };
  const tabConfigs = {
    documents: {
      forms: activeDocumentForms,
      saveFunction: saveDocument,
      validateFunction: (form: DocumentForm): boolean => {
        return isDocumentFormValid(form);
      },
      tabName: 'Documents',
    },
    others: {
      forms: [formData.source_details || {}],
      saveFunction: () => { }, // No save function needed for source details
      validateFunction: (): boolean => {
        return isSourceDetailsValid();
      },
      tabName: 'Others',
    },
  };

  const { autoSaveTabForms, autoSaveAllForms } = useTabBasedAutoSave(
    activeTab,
    tabConfigs
  );

  // Report navigation state to FormWizardLayout
  const handleNavigationNext = useCallback(() => {
    if (activeTab === 'documents') {
      // Auto-save any filled document forms before switching to others tab
      activeDocumentForms.forEach(form => {
        if (isDocumentFormValid(form)) {
          saveDocument(form.id);
        }
      });
      setActiveTab('others');
      return false; // Don't proceed to next step yet, just switch tabs
    } else if (activeTab === 'others') {
      // Validate source details before proceeding
      const sourceDetails = formData.source_details || {};

      // Validate source type
      const sourceTypeError = validateSourceDetailsField(
        'source_type',
        sourceDetails.source_type || ''
      );
      setSourceDetailsValidationErrors(prev => ({
        ...prev,
        source_type: sourceTypeError,
      }));

      // Validate source name
      const sourceNameError = validateSourceDetailsField(
        'source_name',
        sourceDetails.source_name || ''
      );
      setSourceDetailsValidationErrors(prev => ({
        ...prev,
        source_name: sourceNameError,
      }));

      // If validation fails, don't proceed
      if (!isSourceDetailsValid()) {
        return false;
      }

      return true; // Proceed to next step
    }
    return true;
  }, [activeTab, activeDocumentForms, formData.source_details]);

  const handleNavigationPrevious = useCallback(() => {
    if (activeTab === 'others') {
      setActiveTab('documents');
      return false; // Don't go to previous step yet
    } else if (activeTab === 'documents') {
      return true; // Go to previous step
    }
    return true;
  }, [activeTab]);

  useEffect(() => {
    const navigationData = {
      activeTab: activeTab,
      handleNext: handleNavigationNext,
      handlePrevious: handleNavigationPrevious,
    };

    onChange('_documents-othersTabNavigation', navigationData);
  }, [activeTab, handleNavigationNext, handleNavigationPrevious]);

  // Navigation handlers that auto-save before moving
  const handleNext = () => {
    console.log(
      '=== DocumentsOthersStep handleNext - Auto-saving all forms ==='
    );
    autoSaveAllForms();
    if (onNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    console.log(
      '=== DocumentsOthersStep handlePrevious - Auto-saving all forms ==='
    );
    autoSaveAllForms();
    if (onPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Documents & Others</h2>
        <p className="text-gray-600 mt-1">
          Upload documents and provide additional information
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="underline"
        size="md"
      />

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Documents Table */}
          {documents.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map(document => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {document.document_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {document.document_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {document.document_date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {document.expiry_date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {document.document_url ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0"
                              onClick={() =>
                                document.document_url &&
                                FileUploadService.openFile(document.document_url, 'view')
                              }
                              disabled={!document.document_url}
                            >
                              <Icon name="file-text" className="h-4 w-4 mr-1" />
                              View Document
                            </Button>
                            <Icon
                              name="check"
                              className="h-4 w-4 text-green-500"
                            />
                          </div>
                        ) : (
                          'Not uploaded'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editDocument(document)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Icon name="edit" className="h-4 w-4" />
                          </Button>
                          {document.document_name !== 'PAN Card' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(document.id || '')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Multiple Active Document Forms */}
          {activeDocumentForms.map((form, index) => (
            <div
              key={form.id}
              id={`add-document-form-${form.id}`}
              className="border rounded-md p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium">
                  {documents.length === 0 && index === 0
                    ? 'Add Your First Document'
                    : 'Add Document'}
                </h3>
                {/* Show remove button if it's not the first mandatory PAN card (i.e. if we have saved documents OR if this is not the first form) */}
                {(documents.length > 0 || index > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocumentForm(form.id)}
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Document Name */}
                {/* Document Name - Disabled with Pan Card */}
                {/* Document Name - Editable for additional documents */}
                <div className="col-span-1">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Document Name <span className="text-red-400">*</span>
                    </label>
                    <AsyncSelect
                      value={getDocumentTypeOptionFromValue(form.documentName)}
                      onChange={option => {
                        // Store label/name instead of ID
                        const documentTypeName = option?.label || '';
                        updateDocumentForm(
                          form.id,
                          'documentName',
                          documentTypeName
                        );
                      }}
                      onInputChange={searchDocumentType}
                      options={documentTypeOptions}
                      isLoading={documentTypeLoading}
                      placeholder="Select document type..."
                      isClearable={true}
                      size="md"
                      disabled={documents.length === 0 && index === 0}
                    />
                    {documentValidationErrors[form.id]?.documentName && (
                      <ErrorMessage
                        message={documentValidationErrors[form.id].documentName}
                        variant="error"
                        size="xs"
                      />
                    )}
                  </div>
                </div>

                {/* Document No - Editable for additional documents */}
                <div className="col-span-1">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Document No{' '}
                      {(() => {
                        const metadata = getDocumentTypeMetadata(form.documentName);
                        // Default to required if no metadata (or until loaded), unless explicitly not required
                        return (!metadata || metadata.requires_document_number_field) ? <span className="text-red-400">*</span> : null;
                      })()}
                    </label>
                    <input
                      type="text"
                      value={form.documentNo || ''}
                      onChange={e =>
                        updateDocumentForm(
                          form.id,
                          'documentNo',
                          e.target.value
                        )
                      }
                      placeholder={(() => {
                        const formatRule = getDocumentFormatRule(
                          form.documentName
                        );
                        const metadata = getDocumentTypeMetadata(
                          form.documentName
                        );
                        return formatRule
                          ? formatRule.placeholder
                          : metadata && metadata.requires_number
                            ? 'Enter integer only'
                            : 'Enter document number';
                      })()}
                      maxLength={(() => {
                        const formatRule = getDocumentFormatRule(
                          form.documentName
                        );
                        return formatRule?.maxLength;
                      })()}
                      disabled={(() => {
                        // First document (Pan Card) is always disabled
                        if (documents.length === 0 && index === 0) return true;

                        // Otherwise always enabled as per new requirement
                        return false;
                      })()}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${(documents.length === 0 && index === 0) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                        }`}
                    />
                    {documentValidationErrors[form.id]?.documentNo && (
                      <ErrorMessage
                        message={
                          documentValidationErrors[form.id].documentNo
                        }
                        variant="error"
                        size="xs"
                      />
                    )}
                    {(() => {
                      const formatRule = getDocumentFormatRule(
                        form.documentName
                      );
                      return (
                        formatRule &&
                        !documentValidationErrors[form.id]?.documentNo && (
                          <span className="text-gray-500 text-xs mt-1 block">
                            Example: {formatRule.example}
                          </span>
                        )
                      );
                    })()}
                  </div>
                </div>

                {/* Document Date (Cannot be a future date) */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Date{' '}
                    {(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata && metadata.requires_issue ? (
                        <span className="text-red-500">*</span>
                      ) : null;
                    })()}
                  </label>
                  <EnhancedInputField
                    type="date"
                    value={form.docDate || ''}
                    onChange={(value: string) =>
                      updateDocumentForm(form.id, 'docDate', value)
                    }
                    max={new Date().toISOString().split('T')[0]}
                    placeholder="Select document date"
                    gridCols="col-span-1"
                    required={(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata ? metadata.requires_issue : false;
                    })()}
                    disabled={(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata ? !metadata.requires_issue : true;
                    })()}
                  />
                  {documentValidationErrors[form.id]?.docDate && (
                    <ErrorMessage
                      message={documentValidationErrors[form.id].docDate}
                      variant="error"
                      size="xs"
                    />
                  )}
                </div>

                {/* Expiry Date (Must be on or after Document Date) */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date{' '}
                    {(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata && metadata.requires_expiry ? (
                        <span className="text-red-500">*</span>
                      ) : null;
                    })()}
                  </label>
                  <EnhancedInputField
                    type="date"
                    value={form.expiryDate || ''}
                    onChange={(value: string) =>
                      updateDocumentForm(form.id, 'expiryDate', value)
                    }
                    min={form.docDate}
                    placeholder="Select expiry date"
                    gridCols="col-span-1"
                    required={(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata ? metadata.requires_expiry : false;
                    })()}
                    disabled={(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata ? !metadata.requires_expiry : true;
                    })()}
                  />
                  {documentValidationErrors[form.id]?.expiryDate && (
                    <ErrorMessage
                      message={documentValidationErrors[form.id].expiryDate}
                      variant="error"
                      size="xs"
                    />
                  )}
                </div>

                {/* Upload Document */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Document
                    {(() => {
                      const metadata = getDocumentTypeMetadata(
                        form.documentName
                      );
                      return metadata && metadata.requires_file ? (
                        <span className="text-red-500"> *</span>
                      ) : null;
                    })()}
                  </label>
                  <div className="relative">
                    <label className="relative inline-flex items-center w-full">
                      <input
                        type="file"
                        id={`document-upload-${form.id}`}
                        onChange={e =>
                          handleFileSelect(form.id, e.target.files?.[0] || null)
                        }
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        required={(() => {
                          const metadata = getDocumentTypeMetadata(
                            form.documentName
                          );
                          return metadata ? metadata.requires_file : false;
                        })()}
                        disabled={form.uploadStatus === 'uploading'}
                      />
                      <span
                        className={`w-full h-[42px] px-4 py-2 border rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center justify-center ${form.uploadStatus === 'uploading'
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                      >
                        {form.uploadStatus === 'uploading' ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            {form.docUpload ? form.docUpload.name : 'Upload Document'}
                          </>
                        )}
                      </span>
                    </label>
                    {form.uploadStatus === 'success' && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Document uploaded successfully
                      </div>
                    )}
                    {form.uploadStatus === 'error' && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {form.uploadError || 'Upload failed'}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, JPEG, or PNG only, max 10MB
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => saveDocument(form.id)}
                  disabled={
                    isSavingDocument[form.id] || !isDocumentFormValid(form)
                  }
                >
                  {isSavingDocument[form.id] ? (
                    <>
                      <Icon
                        name="loading"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="mr-2 h-4 w-4" />
                      {form.uploadStatus === 'success'
                        ? 'Save Document'
                        : 'Save Document'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Show Add Document button only when no active forms */}
          {activeDocumentForms.length === 0 && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={addDocumentForm}
                disabled={isAddingDocument}
              >
                {isAddingDocument ? (
                  <>
                    <Icon
                      name="loading"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="mr-2 h-4 w-4" />
                    Add Document
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Others Tab */}
      {activeTab === 'others' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Source Type */}
            <div className="col-span-1">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Source Type <span className="text-red-500">*</span>
                    </label>
                    <AsyncSelect
                      value={getSourceTypeOptionFromValue(
                        (formData.source_details || {}).source_type || ''
                      )}
                      onChange={option => {
                        const currentSourceDetails =
                          formData.source_details || {
                            source_type: '',
                            source_name: '',
                            flags: ['Blue'], // Default to Blue
                            is_actively_looking: false,
                            comments: '',
                          };
                        // Store the ID instead of just the name for better filtering
                        const sourceTypeId = option?.value || '';
                        const updatedSourceDetails = {
                          ...currentSourceDetails,
                          source_type: sourceTypeId,
                        };
                        onChange('source_details', updatedSourceDetails);

                        // Mark field as touched
                        setSourceDetailsTouched(prev => ({
                          ...prev,
                          source_type: true,
                        }));

                        // Validate the field only if it's been touched
                        const error = validateSourceDetailsField(
                          'source_type',
                          sourceTypeId
                        );
                        setSourceDetailsValidationErrors(prev => ({
                          ...prev,
                          source_type: error,
                        }));
                      }}
                      onInputChange={searchSourceType}
                      options={sourceTypeOptions}
                      isLoading={sourceTypeLoading}
                      placeholder="Search and select source type..."
                      isClearable={true}
                      disabled={false}
                      size="md"
                    />
                    {sourceDetailsValidationErrors.source_type && (
                      <ErrorMessage
                        message={sourceDetailsValidationErrors.source_type}
                        variant="error"
                        size="xs"
                      />
                    )}
                    {sourceTypeError && (
                      <ErrorMessage
                        message={sourceTypeError}
                        variant="error"
                        size="xs"
                      />
                    )}
                  </div>
                </div>
                {/* <Button
                    variant="outline"
                    size="sm"
                    iconOnly
                    icon="plus"
                    onClick={() =>
                      openModal(
                        'sourceType',
                        'Add New Source Type',
                        'Enter source type'
                      )
                    }
                    title="Add new source type"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
                  /> */}
              </div>
            </div>

            {/* Source Name */}
            <div className="col-span-1">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Source Name <span className="text-red-500">*</span>
                    </label>
                    <AsyncSelect
                      value={getSourceNameOptionFromValue(
                        (formData.source_details || {}).source_name || ''
                      )}
                      onChange={option => {
                        const currentSourceDetails =
                          formData.source_details || {
                            source_type: '',
                            source_name: '',
                            flags: ['Blue'],
                            is_actively_looking: false,
                            comments: '',
                          };
                        // Store label/name instead of ID
                        const sourceNameValue = option?.label || '';
                        const updatedSourceDetails = {
                          ...currentSourceDetails,
                          source_name: sourceNameValue,
                        };
                        onChange('source_details', updatedSourceDetails);

                        // Mark field as touched
                        setSourceDetailsTouched(prev => ({
                          ...prev,
                          source_name: true,
                        }));

                        // Validate the field only if it's been touched
                        const error = validateSourceDetailsField(
                          'source_name',
                          sourceNameValue
                        );
                        setSourceDetailsValidationErrors(prev => ({
                          ...prev,
                          source_name: error,
                        }));
                      }}
                      onInputChange={searchSourceName}
                      options={sourceNameOptions}
                      isLoading={sourceNameLoading}
                      placeholder="Search and select source name..."
                      isClearable={true}
                      disabled={false}
                      size="md"
                      showAddButton={true}
                      dropdownType="Source_name"
                      dropdownLabel="Source Name"
                      context={
                        selectedSourceTypeId
                          ? { source_type: selectedSourceTypeId }
                          : undefined
                      }
                      onOptionAdded={newOption => {
                        // Refresh source name options
                        searchSourceName('');
                      }}
                    />
                    {sourceDetailsValidationErrors.source_name && (
                      <ErrorMessage
                        message={sourceDetailsValidationErrors.source_name}
                        variant="error"
                        size="xs"
                      />
                    )}
                    {sourceNameError && (
                      <ErrorMessage
                        message={sourceNameError}
                        variant="error"
                        size="xs"
                      />
                    )}
                  </div>
                </div>
                {/* <Button
                    variant="outline"
                    size="sm"
                    iconOnly
                    icon="plus"
                    onClick={() =>
                      openModal(
                        'sourceName',
                        'Add New Source Name',
                        'Enter source name'
                      )
                    }
                    title="Add new source name"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
                  /> */}
              </div>
            </div>

            {/* Flags */}
            <div className="col-span-1">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Flags
                    </label>
                    <AsyncSelect
                      value={getFlagsOptionFromValue(
                        ((formData.source_details || {}).flags || [])[0] || 'Blue'
                      )}
                      onChange={option => {
                        const currentSourceDetails =
                          formData.source_details || {
                            source_type: '',
                            source_name: '',
                            flags: ['Blue'], // Default to Blue
                            is_actively_looking: false,
                            comments: '',
                          };
                        // Store label/name instead of ID
                        const flagName = option?.label || 'Blue'; // Default to Blue if cleared
                        const updatedSourceDetails = {
                          ...currentSourceDetails,
                          flags: flagName && flagName !== 'Blue' ? [flagName] : ['Blue'],
                        };
                        onChange('source_details', updatedSourceDetails);
                      }}
                      onInputChange={searchFlags}
                      options={flagsOptions}
                      isLoading={flagsLoading}
                      placeholder="Search and select flag..."
                      isClearable={true}
                      disabled={false}
                      size="md"
                    />
                    {flagsError && (
                      <ErrorMessage
                        message={flagsError}
                        variant="error"
                        size="xs"
                      />
                    )}
                  </div>
                </div>
                {/* <Button
                    variant="outline"
                    size="sm"
                    iconOnly
                    icon="plus"
                    onClick={() =>
                      openModal(
                        'flags',
                        'Add New Flag',
                        'Enter flag name'
                      )
                    }
                    title="Add new flag"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
                  /> */}
              </div>
            </div>

            {/* Actively Looking */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Actively Looking</label>
              <div className="flex items-center h-10 pt-2">
                <input
                  type="checkbox"
                  id="actively-looking"
                  checked={
                    (formData.source_details || {}).is_actively_looking || false
                  }
                  onChange={e => {
                    const currentSourceDetails = formData.source_details || {
                      source_type: '',
                      source_name: '',
                      flags: ['Blue'],
                      is_actively_looking: false,
                      comments: '',
                    };
                    const updatedSourceDetails = {
                      ...currentSourceDetails,
                      is_actively_looking: e.target.checked,
                    };
                    onChange('source_details', updatedSourceDetails);
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="actively-looking" className="text-sm ml-2">
                  Yes
                </label>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comments</label>
            <div className="relative">
              <textarea
                value={(formData.source_details || {}).comments || ''}
                onChange={e => {
                  const currentSourceDetails = formData.source_details || {
                    source_type: '',
                    source_name: '',
                    flags: ['Blue'],
                    is_actively_looking: false,
                    comments: '',
                  };
                  const updatedSourceDetails = {
                    ...currentSourceDetails,
                    comments: e.target.value,
                  };
                  onChange('source_details', updatedSourceDetails);
                }}
                className="w-full min-h-[150px] pl-9 pr-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes or comments about the candidate..."
              />
              <Icon
                name="edit"
                className="absolute left-3 top-3 h-5 w-5 text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding new options */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModalSubmit}>
              Add
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalState.title}
            </label>
            <input
              type="text"
              value={modalState.value}
              onChange={e =>
                setModalState(prev => ({ ...prev, value: e.target.value }))
              }
              placeholder={modalState.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsOthersStep;
