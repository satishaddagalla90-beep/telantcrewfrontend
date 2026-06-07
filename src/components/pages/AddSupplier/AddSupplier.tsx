import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FormWizardLayout from '../../templates/FormWizardLayout/FormWizardLayout';
import BusinessStep from './BusinessStep';
import ContactsStep from './ContactsStep';
import DocumentsStep from './DocumentsStep';
import ContractStep from './ContractStep';
import { suppliersAPI } from '../../../utils/api/SuppliersAPI';
import { useAuth } from '../../auth/AuthContext';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
// import { getCurrentSupplierId } from '../../../services/supplierService';
import FileUploadService from '../../../services/fileUploadService';

// Helper function to format website URL for API submission
const formatWebsiteForAPI = (url: string): string => {
  if (!url) return '';

  // Trim whitespace
  const trimmedUrl = url.trim();

  // If already has protocol, return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If it's in www.xyz.com format, add https://
  if (trimmedUrl.startsWith('www.')) {
    return `https://${trimmedUrl}`;
  }

  // If it's a domain without www, add https:// and www.
  if (!trimmedUrl.includes('.')) {
    return `https://www.${trimmedUrl}.com`;
  }

  // For other cases, add https://
  return `https://${trimmedUrl}`;
};

const initialFormData = {
  // Business Step
  supplier_id: '',
  supplier_category: '',
  supplier_name: '',
  supplier_logo: null,
  logo: null,
  logoPreview: '',
  logoUrl: null,
  supplier_display_name: '',
  empanelment_status: '',
  supplier_type: [], // Multi-select field
  registered_address: '',
  address: {
    country: '',
    state: '',
    city: '',
    postal_code: '',
  },
  website: '',
  skill_category: [], // Multi-select field
  skill_capability: [], // Multi-select field
  industry: [], // Multi-select field
  branches: [], // Multi-select field
  msme_certified: false,
  zone: '',
  // Contacts
  contacts: [
    {
      firstName: '',
      middleName: '',
      lastName: '',
      displayName: '',
      phone: '',
      countryCode: '+91',
      email: '',
      designation: '',
      department: [],
    },
  ],
  // Documents
  documents: [
    {
      type: '',
      number: '',
      description: '', // Added as per specification
      issueDate: '',
      expiryDate: '',
      file: null,
      uploadedUrl: null,
    },
  ],
  // Contracts
  contracts: [
    {
      contractType: '',
      taxPreference: '',
      paymentTerm: '',
      paymentType: '',
      startDate: '',
      endDate: '',
    },
  ],
};

const steps = [
  {
    id: 'business',
    label: 'Business',
    description: 'Supplier Info',
    component: BusinessStep,
    resetFields: [
      'supplier_id',
      'supplier_category',
      'supplier_name',
      'supplier_logo',
      'supplier_display_name',
      'empanelment_status',
      'supplier_type',
      'registered_address',
      'address.country',
      'address.state',
      'address.city',
      'address.postal_code',
      'website',
      'skill_category',
      'skill_capability',
      'industry',
      'branches',
      'msme_certified',
      'zone',
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    description: 'Contacts',
    component: ContactsStep,
    resetFields: (formData: any) => ({
      contacts: [
        {
          firstName: '',
          middleName: '',
          lastName: '',
          displayName: '',
          phone: '',
          countryCode: '+91',
          email: '',
          designation: '',
          department: [],
        },
      ],
    }),
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Documents',
    component: DocumentsStep,
    resetFields: (formData: any) => ({
      documents: [
        {
          type: '',
          number: '',
          description: '', // Added as per specification
          issueDate: '',
          expiryDate: '',
          file: null,
          uploadedUrl: null,
        },
      ],
    }),
  },
  {
    id: 'contract',
    label: 'Contract',
    description: 'Contract',
    component: ContractStep,
    resetFields: (formData: any) => ({
      contracts: [
        {
          contractType: '',
          taxPreference: '',
          paymentTerm: '',
          paymentType: '',
          startDate: '',
          endDate: '',
        },
      ],
    }),
  },
];

const AddSupplier: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadStates, setUploadStates] = useState<{
    logo?: { uploading: boolean; error: string | null };
    documents?: { [key: string]: { uploading: boolean; error: string | null } };
  }>({});

  // Check for existing draft
  const getInitialData = () => {
    const savedDraft = localStorage.getItem('supplier_draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Auto-restore draft without prompt
        return parsedDraft;
      } catch (error) {
        console.error('Error parsing draft:', error);
        localStorage.removeItem('supplier_draft');
      }
    }
    return initialFormData;
  };

  // Helper function to convert array to string
  const arrayToString = (arr: any): string | null => {
    if (!arr) return null;
    if (Array.isArray(arr)) {
      return arr.filter(item => item && item.trim()).join(', ') || null;
    }
    return arr.toString() || null;
  };

  // LOGO UPLOAD - Immediate upload when user selects logo
  const handleLogoUpload = async (
    file: File | null,
    onChange: (field: string, value: any) => void
  ) => {
    if (!file) {
      onChange('logo', null);
      onChange('logoPreview', null);
      onChange('logoUrl', null);
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

      const uploadResponse = await FileUploadService.uploadSupplierLogo(file);

      // Get presigned URL for immediately showing the preview securely
      const presignedUrl = await FileUploadService.getFileViewUrl(uploadResponse.file_url);

      // Update form data with logo URL
      onChange('logoUrl', uploadResponse.file_url);

      // Update preview with uploaded URL
      onChange('logoPreview', presignedUrl);
      onChange('logo', file);

      // Update upload state
      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: null },
      }));

      showSuccessToast('Logo uploaded successfully!');
    } catch (error) {
      console.error('Logo upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload logo';

      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: errorMessage },
      }));

      showErrorToast(`Logo upload failed: ${errorMessage}`);
    }
  };

  // DOCUMENT UPLOAD - Immediate upload when user selects document
  const handleDocumentUpload = async (
    documentIndex: number,
    file: File | null,
    onChange: (field: string, value: any) => void,
    currentDocuments: any[]
  ) => {
    // Create a unique key for this document
    const documentKey = `doc_${documentIndex}`;

    if (!file) {
      // Clear document data
      const updatedDocuments = [...currentDocuments];
      updatedDocuments[documentIndex] = {
        ...updatedDocuments[documentIndex],
        file: null,
        uploadedUrl: null
      };

      onChange('documents', updatedDocuments);
      setUploadStates(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentKey]: { uploading: false, error: null }
        }
      }));
      return;
    }

    // Set uploading state
    setUploadStates(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentKey]: { uploading: true, error: null }
      }
    }));

    try {
      const validation = FileUploadService.validateFile(file, {
        maxSize: 10, // 10MB limit for documents
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid document file');
      }

      // Upload the document
      const uploadResponses = await FileUploadService.uploadSupplierDocuments([file]);

      if (!uploadResponses || uploadResponses.length === 0) {
        throw new Error('No response received from server');
      }

      const uploadResponse = uploadResponses[0];

      // Update document with uploaded URL
      const updatedDocuments = [...currentDocuments];
      updatedDocuments[documentIndex] = {
        ...updatedDocuments[documentIndex],
        uploadedUrl: uploadResponse.file_url,
        fileName: uploadResponse.file_name
      };

      onChange('documents', updatedDocuments);

      // Update upload state
      setUploadStates(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentKey]: { uploading: false, error: null }
        }
      }));

      showSuccessToast('Document uploaded successfully!');
    } catch (error) {
      console.error('Document upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload document';

      setUploadStates(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentKey]: { uploading: false, error: errorMessage }
        }
      }));

      showErrorToast(`Document upload failed: ${errorMessage}`);
    }
  };

  const handleComplete = async (finalData: any) => {
    try {
      console.log('Supplier data submitted:', finalData);

      // Get current supplier ID before submission - REMOVED
      // const freshSupplierId = await getCurrentSupplierId();

      // Helper function to convert array to string for multi-select values
      const multiSelectToString = (value: any): string | null => {
        if (Array.isArray(value)) {
          return value.filter(item => item && item.trim()).join(', ') || null;
        }
        return value || null;
      };

      // Transform data to match API structure
      const payload: any = {
        supplier_id: finalData.supplier_id || '', // Use user input directly
        supplier_name: finalData.supplier_name || '',
        supplier_category: finalData.supplier_category || '',
        supplier_logo: finalData.logoUrl || null,
        supplier_display_name: finalData.supplier_display_name || finalData.supplier_name || '',
        empanelment_status: finalData.empanelment_status || 'active',
        supplier_type: multiSelectToString(finalData.supplier_type) || '',
        website: formatWebsiteForAPI(finalData.website) || null,
        category: finalData.skill_category || [],
        capability: multiSelectToString(finalData.skill_capability) || null,
        industry: multiSelectToString(finalData.industry) || null,
        branches: finalData.branches || [],
        msme_certified: finalData.msme_certified || false,
        zone: finalData.zone || null,
        address: {
          country: finalData.address?.country || null,
          state: finalData.address?.state || null,
          city: finalData.address?.city || null,
          postal_code: finalData.address?.postal_code || null,
          registered_address: finalData.registered_address || null,
        },
        // Add financial_details object (even if empty, it's required by the API)
        financial_details: finalData.contracts ? finalData.contracts.map((contract: any) => ({
          contract_type: contract.contractType || null,
          payment_term: contract.paymentTerm || null,
          payment_type: contract.paymentType || null,
          start_date: contract.startDate || null,
          end_date: contract.endDate || null
        })) : [],
        // Contacts - filter out contacts with empty emails
        contacts:
          finalData.contacts?.map((contact: any) => {
            const contactData: any = {
              first_name: contact.firstName,
              middle_name: contact.middleName || null,
              last_name: contact.lastName,
              display_name: contact.displayName || null,
              phone: `${contact.countryCode || '+91'}${contact.phone}`,
              email: contact.email || null,
              designation: contact.designation || null,
              department: arrayToString(contact.department) || null,
            };
            return contactData;
          }).filter((contact: any) => contact.first_name && contact.first_name.trim() !== '') || [],
        // Documents
        documents:
          finalData.documents?.map((doc: any) => ({
            document_type: doc.type,
            document_no: doc.number || null,
            document_description: doc.description || null, // Added as per specification
            issue_date: doc.issueDate || null,
            expiry_date: doc.expiryDate || null,
            document_file: doc.uploadedUrl || null,
          })) || [],
        created_by: user?.display_name || 'Unknown User',
        updated_by: user?.display_name || 'Unknown User',
        isNewTC: false,
      };

      console.log('Transformed payload:', payload);

      const response = await suppliersAPI.createSupplier(payload);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create supplier');
      }

      console.log('Supplier created successfully:', response.supplier);
      // Clear draft on successful submission
      localStorage.removeItem('supplier_draft');
      showSuccessToast('Supplier created successfully!');
      navigate('/suppliers', { state: { refresh: true, timestamp: Date.now() } });
    } catch (error) {
      console.error('Supplier creation failed:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to create supplier';
      showErrorToast(`Error: ${errorMsg}`);
    }
  };

  const handleCancel = () => {
    navigate('/suppliers');
  };

  const handleSaveAsDraft = async (draftData: any) => {
    // Save draft to localStorage
    localStorage.setItem('supplier_draft', JSON.stringify(draftData));
    console.log('Supplier data saved as draft:', draftData);
    showSuccessToast('Draft saved successfully!');
  };

  return (
    <FormWizardLayout
      title="Add New Supplier"
      subtitle="Create a new supplier with all necessary details"
      steps={steps}
      initialData={getInitialData()}
      onComplete={handleComplete}
      onCancel={handleCancel}
      showResetButton={true}
      showSaveAsDraft={true}
      onSaveAsDraft={handleSaveAsDraft}
      allowStepNavigation={true}
      stepProps={{
        business: {
          onFileUpload: {
            logo: handleLogoUpload,
          },
          uploadStates,
        },
        documents: {
          onFileUpload: {
            documents: handleDocumentUpload,
          },
          uploadStates,
        },
      }}
      onDiscardDraft={() => localStorage.removeItem('supplier_draft')}
    />
  );
};

export default AddSupplier;