import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FormWizardLayout from '../../templates/FormWizardLayout/FormWizardLayout';
import BusinessStep from './BusinessStep';
import ContactsStep from './ContactsStep';
import DocumentsStep from './DocumentsStep';
import ContractStep from './ContractStep';
import FileUploadService from '../../../services/fileUploadService';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import { useAuth } from '../../auth/AuthContext';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

function isAlpha(str: string) {
  return /^[A-Za-z ]+$/.test(str);
}
function isURL(str: string) {
  return (
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/\S*)?$/.test(str) ||
    /^www\.[\w\-]+\.[a-z]{2,}(\/\S*)?$/.test(str)
  );
}
function isPostalCode(str: string) {
  return /^\d{4,10}$/.test(str);
}

// Removed unused AddClientContent component as it does not return any JSX

const initialFormData = {
  // Business Step
  client_name: '',
  client_display_name: '',
  email: '',
  client_code: '',
  vms_client_name: '',
  address: '',
  country: '',
  state: '',
  city: '',
  postalCode: '',
  website: '',
  portal: '',
  industry: '',
  status: '',
  ownership: '',
  odc: '',
  registeredAddress: '',
  required_documents: [],
  pan: '',
  // Logo
  logo: null,
  logoPreview: '',
  logoUrl: null,  // Contacts
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
  // Billing Address
  billingAddress: {
    attention: '',
    countryRegion: '',
    state: '',
    city: '',
    street1: '',
    street2: '',
    pinCode: '',
    phone: '',
  },
  // Shipping Address
  shippingAddress: {
    attention: '',
    countryRegion: '',
    state: '',
    city: '',
    street1: '',
    street2: '',
    pinCode: '',
    phone: '',
  },
};

const steps = [
  {
    id: 'business',
    label: 'Business',
    description: 'Client Info',
    component: BusinessStep,
    resetFields: [
      'clientId',
      'clientName',
      'clientDisplayName',
      'logo',
      'logoPreview',
      'logoUrl',
      'website',
      'clientPortal',
      'empanelmentStatus',
      'requiredDocs',
      'odc',
      'registeredAddress',
      'ownership',
      'msp',
      'mspAddition',
      'industry',
      'currentCountry',
      'currentState',
      'currentCity',
      'clientPostalCode',
      'pan',
      'gstTreatment',
      'placeOfSupply',
      'sameAsBilling',
      'clientCode',
    ],
    // validation: validateBusinessStep,
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
    // validation: validateContactsStep,
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
          issueDate: '',
          expiryDate: '',
          file: null,
          uploadedUrl: null,
        },
      ],
    }),
    // validation: validateDocumentsStep,
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
          paymentTerm: '',
          paymentType: '',
          contractDate: '',
          expiryDate: '',
        },
      ],
    }),
    // validation: validateContractStep,
  },
];

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadStates, setUploadStates] = useState<{
    logo?: { uploading: boolean; error: string | null };
    documents?: { [key: string]: { uploading: boolean; error: string | null } };
  }>({});

  // Check for existing draft
  const getInitialData = () => {
    const savedDraft = localStorage.getItem('client_draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Ask user if they want to restore the draft
        const restoreDraft = window.confirm(
          'A draft was found. Would you like to continue from where you left off?'
        );
        if (restoreDraft) {
          return parsedDraft;
        } else {
          localStorage.removeItem('client_draft');
        }
      } catch (error) {
        console.error('Error parsing draft:', error);
        localStorage.removeItem('client_draft');
      }
    }
    // Return a deep copy of initialFormData to prevent mutation of the original object
    return JSON.parse(JSON.stringify(initialFormData));
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

      const uploadResponse = await FileUploadService.uploadClientLogo(file);
      console.log('Logo uploaded successfully:', uploadResponse);

      // Get presigned URL for immediately showing the preview securely
      const presignedUrl = await FileUploadService.getFileViewUrl(uploadResponse.file_url);

      onChange('logoUrl', uploadResponse.file_url);
      onChange('logoPreview', presignedUrl);
      onChange('logo', file);

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

      onChange('logo', null);
      onChange('logoPreview', null);
      onChange('logoUrl', null);

      showErrorToast(`Logo upload failed: ${errorMsg}`);
    }
  };

  // DOCUMENT UPLOAD - Immediate upload per document
  const handleDocumentUpload = async (
    documentIndex: number,
    file: File | null,
    onChange: (field: string, value: any) => void,
    currentDocuments: any[]
  ) => {
    console.log('=== handleDocumentUpload called ===');
    console.log('documentIndex:', documentIndex);
    console.log('file:', file);
    console.log('currentDocuments:', currentDocuments);

    if (!file) {
      console.log('No file provided, returning early');
      return;
    }

    const docKey = `doc_${documentIndex}`;
    console.log('Setting upload state to uploading for:', docKey);
    setUploadStates(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: { uploading: true, error: null },
      },
    }));

    try {
      console.log('Validating file...');
      const validation = FileUploadService.validateFile(file, {
        maxSize: 20,
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
        ],
      });

      if (!validation.valid) {
        console.log('File validation failed:', validation.error);
        throw new Error(validation.error || 'Invalid document file');
      }

      console.log('Uploading file to server...');
      const uploadResponses = await FileUploadService.uploadClientDocuments([
        file,
      ]);
      console.log('Document uploaded successfully:', uploadResponses);
      console.log('Extracted file_url:', uploadResponses[0]?.file_url);

      if (
        !uploadResponses ||
        uploadResponses.length === 0 ||
        !uploadResponses[0].file_url
      ) {
        console.log('Invalid upload response');
        throw new Error('Invalid upload response - no file URL received');
      }

      console.log('Updating document state...');
      // Create a new array with the updated document, preserving all other documents
      const updatedDocuments = currentDocuments.map((doc, index) => {
        if (index === documentIndex) {
          return {
            ...doc,
            file: file,
            uploadedUrl: uploadResponses[0].file_url,
          };
        }
        return doc;
      });

      console.log('Calling onChange with updated documents:', updatedDocuments);
      onChange('documents', updatedDocuments);

      console.log(
        'Updated document at index',
        documentIndex,
        'with URL:',
        uploadResponses[0].file_url
      );

      console.log('Setting upload state to complete for:', docKey);
      setUploadStates(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: { uploading: false, error: null },
        },
      }));

      console.log(
        'Document upload completed, URL stored:',
        uploadResponses[0].file_url
      );
    } catch (error) {
      console.error('Document upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      console.log('Setting upload state to error for:', docKey);
      setUploadStates(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: { uploading: false, error: errorMsg },
        },
      }));

      showErrorToast(`Document upload failed: ${errorMsg}`);
    }

    console.log('=== handleDocumentUpload finished ===');
  };

  const handleComplete = async (finalData: any) => {
    try {
      console.log('Submitting client data:', finalData);

      // Helper function to convert array to comma-separated string
      // Prefers label (display name) over value (ID) for better readability
      const arrayToString = (arr: any[]) => {
        if (!arr || !Array.isArray(arr)) return '';
        return arr
          .map(item =>
            typeof item === 'object' ? item.label || item.value || item : item
          )
          .join(', ');
      };

      // Helper function to convert ownership IDs to names
      const convertOwnershipIdsToNames = async (ids: string[]) => {
        if (!ids || !Array.isArray(ids) || ids.length === 0) return '';

        try {
          // Fetch user details for the IDs
          const url = new URL(
            window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Users')
          );
          url.searchParams.append('limit', '1000'); // Get more to find all selected users

          const response = await apiCall<{
            data: Array<{ id: string; name: string }>;
          }>(url.pathname + url.search);

          if (response.data && response.data.data) {
            // Map IDs to names
            const userMap = new Map(
              response.data.data.map(user => [user.id, user.name])
            );
            const names = ids.map(id => userMap.get(id) || id); // Fallback to ID if name not found
            return names.join(', ');
          }
        } catch (error) {
          console.error('Error converting ownership IDs to names:', error);
        }

        // Fallback: return IDs as comma-separated string
        return ids.join(', ');
      };

      // Helper function to add https:// if missing
      const formatUrl = (url: string | null) => {
        if (!url) return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
        return `https://${trimmed}`;
      };

      // Convert ownership IDs to names before creating payload
      const ownershipNames = await convertOwnershipIdsToNames(
        finalData.ownership || []
      );

      // Transform data to match API structure
      const payload: any = {
        client_id:
          finalData.clientId || `THCS${Math.floor(Math.random() * 10000)}`, // Required field
        client_name: finalData.clientName || '',
        client_display_name: finalData.clientDisplayName || '',
        // email will be added conditionally below if valid
        client_logo: finalData.logoUrl || null,
        msp_type: finalData.msp || null,
        associate_msp: finalData.mspAddition || null,
        client_code: finalData.clientCode || null,
        client_registered_address: finalData.registeredAddress || null, // Use registered address field
        client_postal_code: finalData.clientPostalCode
          ? parseInt(finalData.clientPostalCode)
          : finalData.billingPinCode
            ? parseInt(finalData.billingPinCode)
            : null,
        client_country: finalData.currentCountry || null,
        client_website: formatUrl(finalData.website),
        client_status: finalData.empanelmentStatus || 'active',
        client_odc: arrayToString(finalData.odc), // Convert array to string
        client_city: finalData.currentCity || null,
        client_required_documents: arrayToString(finalData.requiredDocs), // Convert array to string
        client_portal: formatUrl(finalData.clientPortal),
        ownership: ownershipNames, // User names, not IDs
        industry: arrayToString(finalData.industry), // Convert array to string
        client_state: finalData.currentState || null,
        created_by: user?.display_name || 'Unknown User', // Logged-in user's display name        // Contacts - filter out contacts with empty emails or map without empty emails
        contacts:
          finalData.contacts?.map((contact: any) => {
            const contactData: any = {
              phone_no: `${contact.countryCode || '+91'}${contact.phone}`,
              first_name: contact.firstName,
              middle_name: contact.middleName || null,
              last_name: contact.lastName,
              display_name: contact.displayName || null,
              designation: contact.designation || null,
              department: arrayToString(contact.department), // Convert array to string
            };
            // Only add email if it's not empty
            if (contact.email && contact.email.trim() !== '') {
              contactData.email = contact.email;
            }
            return contactData;
          }) || [],

        // Documents
        documents:
          finalData.documents?.map((doc: any) => {
            console.log('Processing document for payload:', doc);
            console.log('Document uploadedUrl:', doc.uploadedUrl);
            return {
              document_type: doc.type,
              document_no: doc.number || null,
              document_description: doc.description || null,
              document_issue_date: doc.issueDate || null,
              document_expiry_date: doc.expiryDate || null,
              client_document_file: doc.uploadedUrl || '',
            };
          }) || [],

        // Contracts
        contracts:
          finalData.contracts?.map((contract: any) => ({
            contract_type: contract.contractType || 'Fixed Bid',
            tax_preference:
              contract.taxPreference || finalData.taxPreference || 'GST', // Use form tax preference or default
            payment_term: contract.paymentTerm || null,
            payment_type: contract.paymentType || null,
            start_date: contract.contractDate || null, // Fixed: was startDate, should be contractDate
            end_date: contract.expiryDate || null, // Fixed: was endDate, should be expiryDate
          })) || [],

        // Billing Address
        billing_address: {
          attention: finalData.billingAttention || null,
          country_region: finalData.billingCountry || null,
          state: finalData.billingState || null,
          city: finalData.billingCity || null,
          street_1: finalData.billingStreet1 || null,
          street_2: finalData.billingStreet2 || null,
          pin_code: finalData.billingPinCode || null,
          phone: finalData.billingPhone || null,
        },

        // Shipping Address
        shipping_address: {
          attention: finalData.shippingAttention || null,
          country_region: finalData.shippingCountry || null,
          state: finalData.shippingState || null,
          city: finalData.shippingCity || null,
          street_1: finalData.shippingStreet1 || null,
          street_2: finalData.shippingStreet2 || null,
          pin_code: finalData.shippingPinCode || null,
          phone: finalData.shippingPhone || null,
        },

        // Financial & Tax Details
        financial_details: {
          gst_treatment: finalData.gstTreatment || null,
          place_of_supply: finalData.placeOfSupply || null,
          pan: finalData.pan || null,
          currency: finalData.currency || null,
          tax_preference: finalData.taxPreference || null,
          exemption_reason:
            finalData.taxPreference === 'tax_exempt'
              ? finalData.exemptionReason || null
              : null,
          // Boolean flags for tax preference
          taxable: finalData.taxPreference === 'taxable',
          tax_exempt: finalData.taxPreference === 'tax_exempt',
        },
      };

      // Add email - required by API
      // If user provided email, use it; otherwise use first contact's email as fallback
      // if (finalData.email && finalData.email.trim() !== '') {
      //   payload.email = finalData.email.trim();
      // } else if (finalData.contacts && finalData.contacts.length > 0 && finalData.contacts[0].email) {
      //   // Use first contact's email as client email if no client email provided
      //   payload.email = finalData.contacts[0].email;
      // } else {
      //   // If still no email, use a placeholder (you should add email field to form instead)
      //   payload.email = 'noemail@example.com';
      // }

      console.log('Transformed payload:', payload);

      const response = await apiCall(API_ENDPOINTS.CLIENTS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create client');
      }

      console.log('Client created successfully:', response.data);

      // Clear draft on successful submission
      localStorage.removeItem('client_draft');
      showSuccessToast('Client created successfully!');
      navigate('/clients'); // Auto-revalidation will handle the refresh
    } catch (error) {
      console.error('Client creation failed:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to create client';
      showErrorToast(`Error: ${errorMsg}`);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  const handleSaveAsDraft = async (draftData: any) => {
    // Save draft to localStorage or API
    localStorage.setItem('client_draft', JSON.stringify(draftData));
    showSuccessToast('Client data saved as draft!');
  };

  return (
    <FormWizardLayout
      title="Add New Client"
      subtitle="Create a new client with all necessary details"
      steps={steps}
      initialData={getInitialData()}
      onComplete={handleComplete}
      onCancel={handleCancel}
      showResetButton={true}
      onSaveAsDraft={handleSaveAsDraft}
      allowStepNavigation={true}
      stepProps={{
        business: {
          onFileUpload: {
            logo: handleLogoUpload,
          },
          uploadStates: uploadStates,
        },
        documents: {
          onFileUpload: {
            documents: handleDocumentUpload,
          },
          uploadStates: uploadStates,
        },
      }}
      onDiscardDraft={() => localStorage.removeItem('client_draft')}
    />
  );
};

export default AddClient;
